'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { commentsApi, type CommentTarget } from '@/lib/api/comments'
import { ApiError } from '@/lib/api/client'
import { MESSAGES } from '@/lib/messages'

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

  const isReply = parentId !== undefined

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!content.trim()) {
      setError(MESSAGES.comment.form.contentRequired)
      return
    }

    setError('')
    setLoading(true)

    try {
      await commentsApi.create(target, {
        content: content.trim(),
        anonymous,
        ...(parentId !== undefined && { parentId }),
      })
      setContent('')
      setAnonymous(false)
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
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={isReply ? '답글을 입력하세요.' : '댓글을 입력하세요.'}
        rows={isReply ? 2 : 3}
        maxLength={500}
        className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded px-3 py-2 text-sm outline-none focus:border-blue-400 dark:focus:border-blue-500 resize-none"
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <div className="flex justify-between items-center mt-2">
        <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-neutral-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={e => setAnonymous(e.target.checked)}
            className="w-3 h-3"
          />
          익명
        </label>
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
            disabled={loading}
            className="px-4 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '등록 중...' : isReply ? '답글 등록' : '댓글 등록'}
          </button>
        </div>
      </div>
    </form>
  )
}
