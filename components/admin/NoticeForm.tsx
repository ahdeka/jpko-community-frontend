'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { noticesApi } from '@/lib/api/notices'
import { ApiError } from '@/lib/api/client'
import { useUnsavedChanges } from '@/lib/use-unsaved-changes'
import TiptapEditor, { MAX_CONTENT_LENGTH } from '@/components/post/TiptapEditor'

interface Props {
  mode: 'create' | 'edit'
  noticeId?: number
  initialTitle?: string
  initialContent?: string
  initialPinned?: boolean
  initialFeatured?: boolean
}

// HTML에서 태그를 제거한 순수 텍스트 (빈 본문 판별용)
function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

// 공지 작성/수정 폼. 본문 에디터는 게시글과 동일한 TiptapEditor를 재사용한다.
// (이미지 업로드 경로/제약도 게시글과 공유 — 백엔드 ImageService가 Post/Notice 공용)
export default function NoticeForm({
  mode,
  noticeId,
  initialTitle = '',
  initialContent = '',
  initialPinned = false,
  initialFeatured = false,
}: Props) {
  const router = useRouter()

  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [pinned, setPinned] = useState(initialPinned)
  const [featured, setFeatured] = useState(initialFeatured)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  // 저장이 끝나면 이탈 경고 해제 (저장 직후 목록 이동에는 경고가 뜨지 않게)
  const [submitted, setSubmitted] = useState(false)

  // 제목·본문·노출옵션 중 하나라도 초기값과 다르면 "작성 중"으로 보고 이탈 시 경고
  const isDirty =
    title !== initialTitle ||
    content !== initialContent ||
    pinned !== initialPinned ||
    featured !== initialFeatured
  useUnsavedChanges(isDirty && !submitted)

  const hasImage = /<img\b/i.test(content)
  const plainText = stripTags(content)
  const contentLength = content.length
  const overLimit = contentLength > MAX_CONTENT_LENGTH

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = '제목을 입력해주세요.'
    else if (title.length > 100) errs.title = '제목은 100자 이하여야 합니다.'
    if (!plainText && !hasImage) errs.content = '내용을 입력해주세요.'
    else if (overLimit) errs.content = `본문은 ${MAX_CONTENT_LENGTH.toLocaleString()}자 이하여야 합니다.`
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setLoading(true)

    try {
      const body = { title: title.trim(), content, pinned, featured }
      if (mode === 'edit' && noticeId != null) {
        await noticesApi.update(noticeId, body)
      } else {
        await noticesApi.create(body)
      }
      setSubmitted(true) // 이탈 경고 해제 후 이동
      router.push('/admin/notices')
      router.refresh()
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push('/login')
      } else if (err instanceof ApiError && err.status === 403) {
        setErrors({ form: '관리자 권한이 없습니다.' })
      } else if (err instanceof ApiError) {
        setErrors({ form: err.message })
      } else {
        setErrors({ form: '요청에 실패했습니다.' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <input
          type="text"
          placeholder="공지 제목"
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={100}
          className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-blue-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-blue-500"
        />
        {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
      </div>

      <div>
        {/* 수정 모드의 기존 본문은 initialContent로 1회 주입된다(TiptapEditor가 비제어) */}
        <TiptapEditor content={initialContent} onChange={setContent} />
        <div className="mt-1 flex items-center justify-between">
          {errors.content ? <p className="text-xs text-red-500">{errors.content}</p> : <span />}
          <span className={`text-xs ${overLimit ? 'text-red-500' : 'text-neutral-400 dark:text-neutral-500'}`}>
            {contentLength.toLocaleString()} / {MAX_CONTENT_LENGTH.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 노출 옵션 */}
      <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-800/40">
        <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-200">
          <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} className="h-4 w-4" />
          <span>게시판 상단 고정 <span className="text-xs text-neutral-400">(목록 페이지 상단 띠에 노출)</span></span>
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-200">
          <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} className="h-4 w-4" />
          <span>메인 중요 공지 <span className="text-xs text-neutral-400">(메인 상단 강조 노출)</span></span>
        </label>
      </div>

      {errors.form && <p className="text-xs text-red-500">{errors.form}</p>}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded border border-neutral-300 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading || overLimit}
          className="rounded bg-orange-500 px-6 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? '저장 중…' : mode === 'edit' ? '수정' : '등록'}
        </button>
      </div>
    </form>
  )
}
