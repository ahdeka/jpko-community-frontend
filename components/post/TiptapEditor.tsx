'use client'

import { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { Placeholder } from '@tiptap/extensions'
import { imagesApi } from '@/lib/api/images'
import { ApiError } from '@/lib/api/client'

// 백엔드와 동일한 제약 (S3ImageUploader / PostCreateRequest 기준)
export const MAX_CONTENT_LENGTH = 20000 // content HTML 최대 길이
export const MAX_IMAGES = 5 // 게시글당 이미지 수
// 용량 제한은 확장자별로 다르다 (백엔드 S3ImageUploader의 MAX_FILE_SIZE_BY_EXTENSION와 동일 기준).
// gif는 애니메이션이라 같은 화면 크기여도 프레임 수만큼 커지므로 예외적으로 10MB까지 허용한다.
const DEFAULT_MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_IMAGE_SIZE_BY_EXT: Record<string, number> = {
  gif: 10 * 1024 * 1024, // 10MB
}
const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp']

// 바이트 → 사람이 읽는 MB. 제한값이 항상 1MB 배수라 소수점은 버린다.
function toMb(bytes: number): number {
  return Math.floor(bytes / 1024 / 1024)
}

interface Props {
  // 초기 HTML (수정 모드에서 기존 본문). 비제어로 1회만 세팅된다.
  content: string
  // 본문이 바뀔 때마다 HTML 문자열을 부모로 올림
  onChange: (html: string) => void
  // 본문이 비어 있을 때 흐리게 보여줄 안내 문구. 입력이 시작되면 자동으로 사라진다.
  placeholder?: string
}

// FileList에서 이미지 파일만 골라 배열로 (붙여넣기/드롭 공용)
function imageFilesFrom(list: FileList | null | undefined): File[] {
  if (!list) return []
  return Array.from(list).filter(f => f.type.startsWith('image/'))
}

// 링크 입력값을 안전한 URL로 정규화. 허용 안 되면 null.
//  - http/https/mailto 는 그대로 허용
//  - 다른 스킴(javascript:, data: 등)은 거부 (에디터 미리보기 단계 XSS 방지)
//  - 스킴이 없으면 https:// 를 붙여 보정 (예: "example.com" → "https://example.com")
// 저장 시 백엔드 Jsoup도 protocols를 재차 검증하므로 이중 방어가 된다.
function normalizeLinkUrl(input: string): string | null {
  const url = input.trim()
  if (!url) return null
  if (/^(https?:\/\/|mailto:)/i.test(url)) return url
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return null // 그 외 스킴 거부
  return `https://${url}`
}

// 현재 문서에 들어있는 이미지 노드 수 (백엔드 5장 제한과 맞추기 위함)
function countImages(editor: Editor): number {
  let count = 0
  editor.state.doc.descendants(node => {
    if (node.type.name === 'image') count++
  })
  return count
}

export default function TiptapEditor({ content, onChange, placeholder = '내용을 입력하세요.' }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // 붙여넣기/드롭 핸들러는 editor 생성 시점(마운트 전)에 한 번 등록되므로,
  // 그 시점의 editor는 아직 null이다. 최신 클로저(유효한 editor 참조)를 항상
  // 호출하기 위해 ref로 우회한다. ref 값은 렌더마다 아래에서 갱신된다.
  const handleImageFilesRef = useRef<(files: File[]) => void>(() => {})

  const editor = useEditor({
    extensions: [
      // StarterKit v3에는 underline/link/code/codeBlock/heading이 기본 포함된다.
      // 링크는 에디터 안에서 클릭 시 페이지 이동을 막고(편집 방해 방지),
      // 저장 가능한 안전한 프로토콜만 허용한다(javascript:, data: 차단 — 백엔드 Jsoup도 재차 필터).
      StarterKit.configure({
        link: {
          openOnClick: false,
          protocols: ['http', 'https', 'mailto'],
        },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      // 빈 본문일 때 첫 문단에 안내 문구를 얹는다. 문구 자체는 실제 문서 내용이 아니라
      // data-placeholder 속성 + CSS ::before로만 그려지므로 저장되는 content를 오염시키지 않는다.
      Placeholder.configure({ placeholder }),
    ],
    content,
    // 수정 모드에서 저장된 본문을 다시 불러올 때 연속 공백을 유지한다.
    // true: 공백은 보존하되 줄바꿈은 공백으로 정규화(줄바꿈은 <br>/<p>가 담당하므로,
    // 과거 저장분의 HTML 정렬용 줄바꿈이 빈 줄로 새어 들어오는 것을 막는다).
    parseOptions: { preserveWhitespace: true },
    // Next.js 서버 렌더링 시 hydration mismatch 방지 (Tiptap 권장 설정)
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'post-content min-h-60 px-3 py-2 outline-none',
      },
      // 클립보드/드래그로 들어온 이미지 파일을 가로채 S3 업로드 후 삽입한다.
      // (allowBase64:false라 기본 붙여넣기로는 이미지가 들어가지 않는다)
      handlePaste: (_view, event) => {
        const files = imageFilesFrom(event.clipboardData?.files)
        if (files.length === 0) return false
        event.preventDefault()
        handleImageFilesRef.current(files)
        return true
      },
      handleDrop: (_view, event) => {
        const files = imageFilesFrom((event as DragEvent).dataTransfer?.files)
        if (files.length === 0) return false
        event.preventDefault()
        handleImageFilesRef.current(files)
        return true
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  async function handleFiles(file: File | null) {
    if (!editor || !file) return

    const ext = file.name.includes('.')
      ? file.name.slice(file.name.lastIndexOf('.') + 1).toLowerCase()
      : ''

    // 클라이언트 1차 검증 — 백엔드와 동일 기준으로 미리 걸러 불필요한 업로드 방지
    if (!ALLOWED_EXT.includes(ext)) {
      setUploadError('지원하지 않는 형식입니다. (jpg, jpeg, png, gif, webp)')
      return
    }
    // 확장자 검사를 먼저 통과했으므로 ext는 허용 목록 안의 값이 확정된 상태다.
    // (반대 순서면 알 수 없는 확장자에 대해 어떤 제한을 적용할지 모호해진다)
    const maxSize = MAX_IMAGE_SIZE_BY_EXT[ext] ?? DEFAULT_MAX_IMAGE_SIZE
    if (file.size > maxSize) {
      setUploadError(
        `${ext.toUpperCase()} 파일은 ${toMb(maxSize)}MB 이하여야 합니다. (현재 약 ${(file.size / 1024 / 1024).toFixed(1)}MB)`
      )
      return
    }
    if (countImages(editor) >= MAX_IMAGES) {
      setUploadError(`이미지는 최대 ${MAX_IMAGES}장까지 첨부할 수 있습니다.`)
      return
    }

    setUploadError(null)
    setUploading(true)
    try {
      const res = await imagesApi.upload(file)
      const url = res.data?.url
      if (!url) throw new Error('이미지 URL이 응답에 없습니다.')
      // temp S3 URL을 본문에 인라인 삽입. 저장 시 백엔드가 posts/{id}로 이동시킨다.
      editor.chain().focus().setImage({ src: url }).run()
    } catch (e) {
      setUploadError(
        e instanceof ApiError ? e.message : '이미지 업로드에 실패했습니다.'
      )
    } finally {
      setUploading(false)
    }
  }

  // 붙여넣기/드롭으로 들어온 여러 이미지를 순차 업로드한다.
  // 순차로 처리해야 handleFiles 내부의 이미지 수 검사가 직전 삽입까지 반영된 문서를
  // 보고 5장 제한을 정확히 지킨다(병렬이면 카운트 경쟁으로 제한을 넘길 수 있다).
  async function handleImageFiles(files: File[]) {
    for (const file of files) {
      await handleFiles(file)
    }
  }
  // 붙여넣기/드롭 핸들러가 최신 클로저(유효한 editor 참조)를 쓰도록 렌더 후 ref 갱신.
  // 렌더 본문에서 ref.current를 직접 쓰지 않도록 effect로 분리한다.
  useEffect(() => {
    handleImageFilesRef.current = handleImageFiles
  })

  // immediatelyRender:false 이므로 클라이언트 마운트 전까지 editor가 null일 수 있음
  if (!editor) {
    return (
      <div className="border border-neutral-300 dark:border-neutral-700 rounded">
        <div className="min-h-72" />
      </div>
    )
  }

  return (
    <div className="border border-neutral-300 dark:border-neutral-700 rounded focus-within:border-blue-400 dark:focus-within:border-blue-500">
      <Toolbar
        editor={editor}
        uploading={uploading}
        onPickImage={() => fileInputRef.current?.click()}
      />
      <EditorContent editor={editor} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={e => {
          // File 객체를 먼저 확보한 뒤 input을 비운다.
          // (먼저 value를 비우면 e.target.files가 비워져 파일을 잃는다)
          const file = e.target.files?.[0] ?? null
          e.target.value = '' // 같은 파일 재선택도 onChange가 다시 뜨도록 초기화
          handleFiles(file)
        }}
      />
      {uploadError && (
        <p className="px-3 py-2 text-xs text-red-500 border-t border-neutral-200 dark:border-neutral-800">
          {uploadError}
        </p>
      )}
    </div>
  )
}

// ===== 툴바 =====

// 링크 삽입/수정/해제. 선택 영역(없으면 커서가 놓인 링크 전체)에 링크를 건다.
function setLink(editor: Editor) {
  // 커서가 기존 링크 위에 있으면 그 URL을 기본값으로 보여준다.
  const prevUrl = editor.getAttributes('link').href as string | undefined
  const input = window.prompt('링크 URL을 입력하세요 (비우면 링크 해제)', prevUrl ?? '')
  if (input === null) return // 취소

  // extendMarkRange: 커서만 있어도 링크 전체 범위에 적용/해제되도록 확장
  if (input.trim() === '') {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }

  const url = normalizeLinkUrl(input)
  if (!url) {
    window.alert('사용할 수 없는 링크입니다. http/https 주소를 입력해주세요.')
    return
  }
  editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

function Toolbar({
  editor,
  uploading,
  onPickImage,
}: {
  editor: Editor
  uploading: boolean
  onPickImage: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-neutral-200 dark:border-neutral-800 px-2 py-1.5">
      <Btn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        <b>B</b>
      </Btn>
      <Btn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <i>I</i>
      </Btn>
      <Btn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <u>U</u>
      </Btn>
      <Btn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <s>S</s>
      </Btn>
      <Btn active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
        {'<>'}
      </Btn>
      <Divider />
      <Btn active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        H1
      </Btn>
      <Btn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        H2
      </Btn>
      <Btn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        H3
      </Btn>
      <Divider />
      <Btn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        • 목록
      </Btn>
      <Btn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        1. 목록
      </Btn>
      <Btn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        인용
      </Btn>
      <Btn active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        코드블록
      </Btn>
      <Divider />
      <Btn active={editor.isActive('link')} onClick={() => setLink(editor)}>
        🔗 링크
      </Btn>
      {/* 구분선(hr). StarterKit의 HorizontalRule 확장은 이미 포함돼 있어 명령만 연결하면 된다.
          (isActive 상태가 없는 삽입형 명령이라 active는 항상 false) */}
      <Btn active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        ― 구분선
      </Btn>
      <Divider />
      <Btn active={false} disabled={uploading} onClick={onPickImage}>
        {uploading ? '업로드 중…' : '🖼 이미지'}
      </Btn>
    </div>
  )
}

function Btn({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`px-2 py-1 text-xs rounded disabled:opacity-50 ${
        active
          ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
          : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
      }`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-0.5" />
}
