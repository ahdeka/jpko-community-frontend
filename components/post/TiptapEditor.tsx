'use client'

import { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { Placeholder } from '@tiptap/extensions'
import { Video } from './VideoNode'
import { imagesApi } from '@/lib/api/images'
import { ApiError } from '@/lib/api/client'
import { MESSAGES } from '@/lib/messages'

// 백엔드와 동일한 제약 (S3ImageUploader / ImageService 기준)
export const MAX_CONTENT_LENGTH = 20000 // content HTML 최대 길이
export const MAX_IMAGES = 10 // 게시글당 이미지 수 (백엔드 ImageService.MAX_IMAGES_PER_CONTENT)
export const MAX_VIDEOS = 2 // 게시글당 동영상 수 (백엔드 ImageService.MAX_VIDEOS_PER_CONTENT)

// 용량 제한은 확장자별로 다르다 (백엔드 S3ImageUploader의 MAX_FILE_SIZE_BY_EXTENSION와 동일 기준).
// gif는 애니메이션이라 같은 화면 크기여도 프레임 수만큼 커지므로 예외적으로 10MB까지 허용한다.
const DEFAULT_MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_IMAGE_SIZE_BY_EXT: Record<string, number> = {
  gif: 10 * 1024 * 1024, // 10MB
}
const MAX_VIDEO_SIZE = 30 * 1024 * 1024 // 30MB (백엔드 mp4/mov 상한과 동일)
const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp']
const VIDEO_EXT = ['mp4', 'mov']

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
  // 이미지 업로드 진행 여부를 부모(작성 폼)로 올린다.
  // 업로드가 끝나기 전에 저장하면 본문에 <img>가 아직 안 들어간 채로 제출되므로,
  // 부모는 이 값으로 제출 버튼을 잠근다.
  onUploadingChange?: (uploading: boolean) => void
}

// FileList에서 미디어(이미지/동영상) 파일만 골라 배열로 (붙여넣기/드롭 공용)
// MIME 타입 기준 1차 필터. 세부 확장자·용량 검증은 uploadOne에서 다시 한다.
function mediaFilesFrom(list: FileList | null | undefined): File[] {
  if (!list) return []
  return Array.from(list).filter(
    f => f.type.startsWith('image/') || f.type.startsWith('video/')
  )
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

// 현재 문서에 들어있는 특정 노드(image/video) 수. 백엔드 개수 제한과 맞추기 위함.
function countNodes(editor: Editor, typeName: string): number {
  let count = 0
  editor.state.doc.descendants(node => {
    if (node.type.name === typeName) count++
  })
  return count
}

export default function TiptapEditor({
  content,
  onChange,
  placeholder = '내용을 입력하세요.',
  onUploadingChange,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  // 업로드 진행 표시용. percent는 "브라우저 → 서버 전송" 구간(0~100)이고,
  // phase가 'encoding'이면 전송은 끝났고 서버가 동영상을 재인코딩(압축)하는 중이다
  // (이 구간은 시간을 알 수 없어 %가 아니라 안내 문구만 보여준다).
  const [uploadPercent, setUploadPercent] = useState(0)
  const [uploadPhase, setUploadPhase] = useState<'sending' | 'encoding'>('sending')

  // 내부 상태와 부모 콜백을 한 번에 갱신한다.
  // effect로 부모에 알리면(set-state-in-effect) 렌더가 한 번 더 돌아 상태가 어긋나는 구간이
  // 생기므로, 업로드 시작/종료 이벤트 시점에 둘을 같이 바꾼다.
  // (호출 지점이 전부 이벤트 핸들러라 이 렌더의 최신 onUploadingChange가 그대로 쓰인다)
  function markUploading(next: boolean) {
    setUploading(next)
    onUploadingChange?.(next)
  }

  // 붙여넣기/드롭 핸들러는 editor 생성 시점(마운트 전)에 한 번 등록되므로,
  // 그 시점의 editor는 아직 null이다. 최신 클로저(유효한 editor 참조)를 항상
  // 호출하기 위해 ref로 우회한다. ref 값은 렌더마다 아래에서 갱신된다.
  const handleMediaFilesRef = useRef<(files: File[]) => void>(() => {})

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
      // 동영상 노드(커스텀). <video controls>를 렌더/직렬화한다. 저장 시 백엔드 Jsoup이
      // video/source 태그를 허용하므로 본문에 그대로 살아남는다.
      Video,
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
      // 클립보드/드래그로 들어온 미디어(이미지/동영상) 파일을 가로채 S3 업로드 후 삽입한다.
      // (allowBase64:false라 기본 붙여넣기로는 이미지가 들어가지 않는다)
      handlePaste: (_view, event) => {
        const files = mediaFilesFrom(event.clipboardData?.files)
        if (files.length === 0) return false
        event.preventDefault()
        handleMediaFilesRef.current(files)
        return true
      },
      handleDrop: (_view, event) => {
        const files = mediaFilesFrom((event as DragEvent).dataTransfer?.files)
        if (files.length === 0) return false
        event.preventDefault()
        handleMediaFilesRef.current(files)
        return true
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  // 파일 1개 검증 + 업로드 + 삽입. 잠금(uploading) 토글은 호출자가 담당한다.
  // (여러 개를 순차 업로드할 때 사이에서 잠금이 잠깐 풀리면 그 틈에 제출이 가능해진다)
  async function uploadOne(file: File | null) {
    if (!editor || !file) return

    const ext = file.name.includes('.')
      ? file.name.slice(file.name.lastIndexOf('.') + 1).toLowerCase()
      : ''

    // 클라이언트 1차 검증 — 백엔드와 동일 기준으로 미리 걸러 불필요한 업로드 방지.
    // 확장자로 이미지/동영상을 먼저 가른다(둘 다 아니면 거부). 순서상 여기서 ext가
    // 허용 목록 안의 값으로 확정돼야 이후 용량/개수 제한을 어느 기준으로 적용할지 명확해진다.
    const isImage = IMAGE_EXT.includes(ext)
    const isVideo = VIDEO_EXT.includes(ext)
    if (!isImage && !isVideo) {
      setUploadError(MESSAGES.post.editor.unsupportedFormat)
      return
    }

    // 용량 제한: 동영상은 30MB 고정, 이미지는 확장자별(gif만 10MB, 그 외 5MB).
    const maxSize = isVideo ? MAX_VIDEO_SIZE : (MAX_IMAGE_SIZE_BY_EXT[ext] ?? DEFAULT_MAX_IMAGE_SIZE)
    if (file.size > maxSize) {
      setUploadError(
        MESSAGES.post.editor.fileTooLarge(ext, toMb(maxSize), (file.size / 1024 / 1024).toFixed(1))
      )
      return
    }

    // 개수 제한은 이미지/동영상을 각각 센다(백엔드도 <img>/<video>를 따로 검증).
    // 직전 삽입까지 반영된 문서를 보고 세야 순차 업로드에서 제한을 정확히 지킨다.
    if (isImage && countNodes(editor, 'image') >= MAX_IMAGES) {
      setUploadError(MESSAGES.post.editor.tooManyImages(MAX_IMAGES))
      return
    }
    if (isVideo && countNodes(editor, 'video') >= MAX_VIDEOS) {
      setUploadError(MESSAGES.post.editor.tooManyVideos(MAX_VIDEOS))
      return
    }

    setUploadError(null)
    // 이 파일의 진행 표시를 처음 상태(전송 0%)로 되돌린다. 순차 업로드에서 다음 파일로 넘어갈 때
    // 직전 파일의 100%/압축중 표시가 잠깐 남지 않도록 매 파일 시작 시 리셋한다.
    setUploadPhase('sending')
    setUploadPercent(0)
    try {
      // 동영상은 서버 재인코딩까지 끝난 뒤 응답이 오므로 더 긴 타임아웃을 쓴다(images.ts 참고).
      const res = await imagesApi.upload(file, {
        isVideo,
        onProgress: (percent) => {
          setUploadPercent(percent)
          // 동영상은 전송이 끝나는(100%) 순간 서버 재인코딩이 시작된다 —
          // "압축 중"으로 문구를 바꿔 100%에서 멈춘 것처럼 보이지 않게 한다.
          // (이미지는 인코딩이 없으므로 전환하지 않고 곧바로 완료로 이어진다)
          if (percent >= 100 && isVideo) setUploadPhase('encoding')
        },
      })
      const url = res.data?.url
      if (!url) throw new Error('업로드 응답에 URL이 없습니다.')
      // temp S3 URL을 본문에 삽입. 저장 시 백엔드가 posts/{id}로 이동시킨다.
      if (isVideo) {
        editor.chain().focus().setVideo({ src: url }).run()
      } else {
        editor.chain().focus().setImage({ src: url }).run()
      }
    } catch (e) {
      // ApiError면 백엔드 문구(용량 초과·형식 오류·변환 혼잡 503 등)를 그대로 노출한다.
      const fallback = isVideo
        ? MESSAGES.post.editor.videoUploadFailed
        : MESSAGES.post.editor.uploadFailed
      setUploadError(e instanceof ApiError ? e.message : fallback)
    }
  }

  // 붙여넣기/드롭/파일선택으로 들어온 미디어(이미지/동영상)를 순차 업로드한다.
  // 순차로 처리해야 uploadOne 내부의 개수 검사가 직전 삽입까지 반영된 문서를 보고
  // 제한을 정확히 지킨다(병렬이면 카운트 경쟁으로 제한을 넘길 수 있다).
  // 전체 구간을 uploading으로 감싸 마지막 1개가 삽입될 때까지 제출을 막는다.
  async function handleMediaFiles(files: File[]) {
    if (files.length === 0) return
    markUploading(true)
    try {
      for (const file of files) {
        await uploadOne(file)
      }
    } finally {
      // 업로드가 실패해도(uploadOne이 자체적으로 에러를 잡지만 예상 밖 예외 대비)
      // 잠금은 반드시 풀어야 폼이 영구히 잠기지 않는다.
      markUploading(false)
    }
  }
  // 붙여넣기/드롭 핸들러가 최신 클로저(유효한 editor 참조)를 쓰도록 렌더 후 ref 갱신.
  // 렌더 본문에서 ref.current를 직접 쓰지 않도록 effect로 분리한다.
  useEffect(() => {
    handleMediaFilesRef.current = handleMediaFiles
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
        onPickMedia={() => fileInputRef.current?.click()}
      />
      <EditorContent editor={editor} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime"
        className="hidden"
        onChange={e => {
          // File 객체를 먼저 확보한 뒤 input을 비운다.
          // (먼저 value를 비우면 e.target.files가 비워져 파일을 잃는다)
          const file = e.target.files?.[0] ?? null
          e.target.value = '' // 같은 파일 재선택도 onChange가 다시 뜨도록 초기화
          if (file) handleMediaFiles([file])
        }}
      />
      {uploading && (
        <div className="px-3 py-2 border-t border-neutral-200 dark:border-neutral-800">
          {uploadPhase === 'encoding' ? (
            // 서버 재인코딩(압축) 구간: 진행률을 알 수 없으므로 안내 문구 + 불확정 스피너만.
            <p className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="inline-block w-3 h-3 rounded-full border-2 border-neutral-300 dark:border-neutral-600 border-t-blue-500 animate-spin" />
              {MESSAGES.post.editor.encoding}
            </p>
          ) : (
            // 전송 구간: 실제 진행률(%)을 막대와 숫자로 보여준다.
            <>
              <div className="h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-[width] duration-150 ease-out"
                  style={{ width: `${uploadPercent}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                {MESSAGES.post.editor.uploadingProgress(uploadPercent)}
              </p>
            </>
          )}
        </div>
      )}
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
  const input = window.prompt(MESSAGES.post.editor.linkPrompt, prevUrl ?? '')
  if (input === null) return // 취소

  // extendMarkRange: 커서만 있어도 링크 전체 범위에 적용/해제되도록 확장
  if (input.trim() === '') {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }

  const url = normalizeLinkUrl(input)
  if (!url) {
    window.alert(MESSAGES.post.editor.invalidLink)
    return
  }
  editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

function Toolbar({
  editor,
  uploading,
  onPickMedia,
}: {
  editor: Editor
  uploading: boolean
  onPickMedia: () => void
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
      <Btn active={false} disabled={uploading} onClick={onPickMedia}>
        {uploading ? '업로드 중…' : '🖼 이미지·동영상'}
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
