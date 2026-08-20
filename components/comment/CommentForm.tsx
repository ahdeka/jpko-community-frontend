'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { commentsApi, type CommentTarget } from '@/lib/api/comments'
import { imagesApi } from '@/lib/api/images'
import { ApiError } from '@/lib/api/client'
import { MESSAGES } from '@/lib/messages'

// 백엔드 S3ImageUploader와 동일한 첨부 제약. 댓글은 단일 이미지만 허용한다
// (백엔드 comments.image_url 단일 컬럼). gif는 애니메이션이라 프레임 수만큼 커져 예외적으로 10MB까지.
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
  // 이 폼이 댓글을 달 대상(게시글/공지). 작성 요청 경로를 결정한다.
  target: CommentTarget
  parentId?: number
  // 답글 대상 작성자명. 넘어오면 입력창에 '@닉네임 '을 미리 채워준다.
  // 백엔드 변경 없이 멘션을 본문 텍스트에 그대로 실어 보내기 위한 방식이며,
  // 사용자가 원치 않으면 직접 지울 수 있으므로 멘션을 강제하지 않는다.
  mention?: string
  // 최상위 댓글 등록 후 이동할 마지막 페이지 URL(#comments 포함).
  // 새 댓글은 오름차순 목록의 끝에 붙으므로, 다른 페이지를 보고 있어도 방금 쓴 댓글을 보게 한다.
  // 답글 폼에는 넘기지 않는다(답글은 부모가 있는 현재 페이지에 그대로 붙어 새로고침만 하면 된다).
  lastPageHref?: string
  onCancel?: () => void
}

export default function CommentForm({ target, parentId, mention, lastPageHref, onCancel }: Props) {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  // 폼은 '답글' 버튼을 누를 때마다 새로 마운트되므로, 초기값으로 prefill하면 충분하다.
  const [content, setContent] = useState(mention ? `@${mention} ` : '')
  const [anonymous, setAnonymous] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  // 첨부 이미지의 확정 URL(=/api/images/upload가 준 temp S3 URL). 미첨부면 null.
  // 이 값을 그대로 미리보기 src와 제출 payload에 쓴다 — 업로드가 성공했음을 곧 이 값의 존재로 보증한다.
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  // 이미지 업로드 진행 여부. 업로드가 끝나기 전 등록되면 imageUrl이 아직 null이라
  // 첨부 없는 댓글로 잘못 저장되므로, 이 값으로 등록을 잠근다.
  const [uploading, setUploading] = useState(false)
  // 폼(컨테이너) 안에 포커스가 있는지. 익명 체크·등록 버튼을 평소엔 숨기고 포커스 시에만 펼치기 위함.
  const [focused, setFocused] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 카드의 빈 영역(헤더·푸터 여백 등)을 클릭해도 입력창이 활성화되도록 textarea로 포커스를 넘긴다.
  // 버튼·입력요소·textarea 자체 클릭은 제외해야 한다 — 특히 textarea를 제외하지 않으면
  // preventDefault가 클릭 위치 커서 지정을 막아 기존 텍스트 중간을 못 짚게 된다.
  function focusInputOnDeadZone(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement
    if (target.closest('button, input, a, textarea, label')) return
    e.preventDefault() // mousedown 기본 포커스 이동을 막고 우리가 직접 textarea에 포커스
    textareaRef.current?.focus()
  }

  const isReply = parentId !== undefined

  // 하단 액션(익명·등록)을 펼칠지. 포커스가 있거나, 이미 작성 중(본문·이미지 존재)이면 펼친다.
  // 본문/이미지 조건을 함께 두는 이유: 등록 버튼을 클릭하는 순간 textarea에서 blur가 나
  // focused가 false로 떨어져도, 그 시점엔 본문이나 이미지가 있어 계속 펼쳐진 상태가 유지되므로
  // 버튼이 사라져 클릭이 유실되는 일이 없다.
  const expanded = focused || content.trim().length > 0 || imageUrl !== null

  // 포커스가 폼 밖으로 완전히 나갈 때만 접는다. 내부 요소(체크박스·버튼)로 이동하면 유지한다.
  function handleContainerBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setFocused(false)
    }
  }

  if (isLoading) return null

  if (!user) {
    if (isReply) return null
    return (
      <div className="mt-4 py-4 text-center text-sm text-gray-500 dark:text-neutral-400 border border-gray-300 dark:border-neutral-700 rounded">
        <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">로그인</Link>
        {' '}{MESSAGES.comment.form.loginGateSuffix}
      </div>
    )
  }

  // 파일 1장 검증 + S3 temp 업로드. 성공 시 imageUrl을 세팅한다(단일이라 기존 첨부는 교체).
  // 실패해도 uploading 잠금은 반드시 풀어야 폼이 영구히 잠기지 않는다.
  async function uploadImage(file: File) {
    const ext = file.name.includes('.')
      ? file.name.slice(file.name.lastIndexOf('.') + 1).toLowerCase()
      : ''

    // 클라이언트 1차 검증 — 백엔드와 동일 기준으로 미리 걸러 불필요한 업로드를 막는다.
    if (!ALLOWED_EXT.includes(ext)) {
      setError(MESSAGES.comment.form.imageUnsupportedFormat)
      return
    }
    const maxSize = MAX_IMAGE_SIZE_BY_EXT[ext] ?? DEFAULT_MAX_IMAGE_SIZE
    if (file.size > maxSize) {
      setError(MESSAGES.comment.form.imageTooLarge(ext, toMb(maxSize), (file.size / 1024 / 1024).toFixed(1)))
      return
    }

    setError('')
    setUploading(true)
    try {
      const res = await imagesApi.upload(file)
      const url = res.data?.url
      if (!url) throw new Error('이미지 URL이 응답에 없습니다.')
      setImageUrl(url)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : MESSAGES.comment.form.imageUploadFailed)
    } finally {
      setUploading(false)
    }
  }

  // 클립보드에 이미지가 있으면(스크린샷 붙여넣기 등) 가로채 업로드한다.
  // 텍스트 붙여넣기는 그대로 두어야 하므로 이미지가 있을 때만 preventDefault한다.
  // 단일 이미지 정책이라 여러 장을 붙여넣어도 첫 장만 받는다.
  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const file = Array.from(e.clipboardData.files).find(f => f.type.startsWith('image/'))
    if (!file) return
    e.preventDefault()
    void uploadImage(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // 업로드가 끝나기 전 등록을 누르면 첨부가 유실되므로 먼저 막는다.
    if (uploading) {
      setError(MESSAGES.comment.form.imageUploading)
      return
    }
    // 본문·이미지가 모두 없을 때만 막는다(이미지만 있는 댓글은 백엔드도 허용).
    if (!content.trim() && !imageUrl) {
      setError(MESSAGES.comment.form.emptyContent)
      return
    }

    setError('')
    setLoading(true)

    try {
      await commentsApi.create(target, {
        content: content.trim(),
        anonymous,
        ...(parentId !== undefined && { parentId }),
        ...(imageUrl && { imageUrl }),
      })
      setContent('')
      setAnonymous(false)
      setImageUrl(null)
      onCancel?.()
      // 최상위 댓글은 마지막 페이지로 이동해 방금 쓴 댓글을 보여준다.
      // (이미 그 페이지면 push가 no-op이라도 이어지는 refresh가 목록을 새로 받아온다.)
      // 답글은 현재 페이지에 그대로 붙으므로 새로고침만 한다.
      if (!isReply && lastPageHref) {
        router.push(lastPageHref)
      }
      router.refresh()
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        router.push('/login')
      } else if (e instanceof ApiError) {
        setError(e.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div
        onFocus={() => setFocused(true)}
        onBlur={handleContainerBlur}
        onMouseDown={focusInputOnDeadZone}
        className="overflow-hidden rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus-within:border-blue-400 dark:focus-within:border-blue-500"
      >
        {/* 헤더 바: 왼쪽에 작성자 닉네임, 오른쪽에 이미지 첨부 버튼. 첨부 버튼은 접힌 상태에서도 노출한다.
            익명 체크 시엔 닉네임 노출이 오해를 주므로 '익명'으로 바꿔 보여준다. */}
        <div className="flex items-center justify-between bg-gray-100 dark:bg-neutral-800/60 px-3 py-2">
          <span className="text-xs font-semibold text-gray-700 dark:text-neutral-200">
            {anonymous ? '익명' : user.nickname}
          </span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 disabled:opacity-50"
          >
            {/* 이미지 아이콘 */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25v9.5A2.25 2.25 0 0 1 16.75 17H3.25A2.25 2.25 0 0 1 1 14.75v-9.5Zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 0 0 .75-.75v-2.69l-2.22-2.219a.75.75 0 0 0-1.06 0l-1.91 1.909.47.47a.75.75 0 1 1-1.06 1.06L6.53 8.091a.75.75 0 0 0-1.06 0l-2.97 2.97ZM12 7a1 1 0 1 1 2 0 1 1 0 0 1-2 0Z" clipRule="evenodd" />
            </svg>
            {uploading ? '업로드 중…' : '이미지'}
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={content}
          // 입력을 시작하면 이전 안내(예: "내용을 입력해주세요.")를 즉시 지운다 —
          // 사용자가 조치를 취하는 중에 문구가 남아 있으면 헷갈리기 때문.
          onChange={e => {
            setContent(e.target.value)
            if (error) setError('')
          }}
          onPaste={handlePaste}
          placeholder={isReply ? '답글을 입력하세요.' : '댓글을 입력하세요. (이미지는 붙여넣기 또는 이미지 버튼)'}
          rows={isReply ? 2 : 3}
          maxLength={500}
          className="w-full bg-transparent text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm outline-none resize-none"
        />

        {/* 첨부 이미지 미리보기: 등록 전 확인·취소용. 실제 댓글에 붙는 이미지도 이 URL이다. */}
        {imageUrl && (
          <div className="px-3 pb-2">
            <div className="relative inline-block">
              {/* next/image 미설정이라 일반 img 사용. 미리보기도 실제 표시처럼 작게 고정한다. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="첨부 이미지 미리보기"
                className="max-h-32 w-auto rounded border border-gray-200 dark:border-neutral-700"
              />
              <button
                type="button"
                onClick={() => setImageUrl(null)}
                aria-label="이미지 제거"
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-700 text-white text-xs leading-none hover:bg-gray-900"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {error && <p className="px-3 pb-1 text-xs text-red-500">{error}</p>}

        {/* 푸터 바: 왼쪽 익명 체크, 오른쪽 취소/등록.
            포커스가 없을 땐 visibility만 감춘다(항상 DOM·공간 유지) — 접었다 펴면 높이가 바뀌어
            스크롤이 흔들리므로, 높이는 고정하고 표시 여부만 토글한다.
            invisible이면 버튼·체크박스가 포커스/클릭 대상에서도 빠져 접힌 상태에서 오작동하지 않는다. */}
        <div className={`flex items-center justify-between border-t border-gray-100 dark:border-neutral-800 px-3 py-2 ${expanded ? '' : 'invisible'}`}>
          {/*
            익명 토글: label 대신 넉넉한 패딩의 버튼으로 만들어 체크박스·글씨 어디를 눌러도 토글되게 한다.
            onMouseDown preventDefault는 이 클릭이 textarea의 포커스(커서)를 빼앗지 않게 막는다
            — 안 그러면 익명을 누를 때마다 입력 커서가 풀려 다시 클릭해야 한다. (mousedown만 막고 click은 그대로 발생)
            내부 checkbox는 시각 표시용이라 readOnly·pointer-events-none로 두고, 버튼이 role/aria-checked로 상태를 알린다.
          */}
          <button
            type="button"
            role="checkbox"
            aria-checked={anonymous}
            onMouseDown={e => e.preventDefault()}
            onClick={() => setAnonymous(v => !v)}
            className="-ml-2 flex items-center gap-1.5 rounded px-2 py-1.5 text-xs text-gray-500 dark:text-neutral-400 cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-neutral-800"
          >
            <input
              type="checkbox"
              checked={anonymous}
              readOnly
              tabIndex={-1}
              aria-hidden="true"
              className="w-3.5 h-3.5 pointer-events-none"
            />
            익명
          </button>
          <div className="flex gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                취소
              </button>
            )}
            <button
              type="submit"
              disabled={loading || uploading}
              className="px-4 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '등록 중...' : isReply ? '답글 등록' : '작성'}
            </button>
          </div>
        </div>
      </div>

      {/* 파일 선택 input(숨김). 붙여넣기와 동일한 업로드 경로를 탄다. */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={e => {
          // File을 먼저 확보한 뒤 input을 비운다(먼저 비우면 files가 사라짐).
          const file = e.target.files?.[0] ?? null
          e.target.value = '' // 같은 파일 재선택도 onChange가 다시 뜨도록 초기화
          if (file) void uploadImage(file)
        }}
      />
    </form>
  )
}
