'use client'

import { useRef, useState } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { imagesApi } from '@/lib/api/images'
import { ApiError } from '@/lib/api/client'

// 백엔드와 동일한 제약 (S3ImageUploader / PostCreateRequest 기준)
export const MAX_CONTENT_LENGTH = 20000 // content HTML 최대 길이
export const MAX_IMAGES = 5 // 게시글당 이미지 수
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp']

interface Props {
  // 초기 HTML (수정 모드에서 기존 본문). 비제어로 1회만 세팅된다.
  content: string
  // 본문이 바뀔 때마다 HTML 문자열을 부모로 올림
  onChange: (html: string) => void
}

// 현재 문서에 들어있는 이미지 노드 수 (백엔드 5장 제한과 맞추기 위함)
function countImages(editor: Editor): number {
  let count = 0
  editor.state.doc.descendants(node => {
    if (node.type.name === 'image') count++
  })
  return count
}

export default function TiptapEditor({ content, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
    ],
    content,
    // Next.js 서버 렌더링 시 hydration mismatch 방지 (Tiptap 권장 설정)
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'post-content min-h-60 px-3 py-2 outline-none',
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
    if (file.size > MAX_IMAGE_SIZE) {
      setUploadError('이미지 크기는 5MB 이하여야 합니다.')
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
      <Btn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <s>S</s>
      </Btn>
      <Divider />
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
