'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { commentsApi } from '@/lib/api/comments'
import { ApiError } from '@/lib/api/client'

interface Props {
  postId: number
  parentId?: number
  onCancel?: () => void
}

export default function CommentForm({ postId, parentId, onCancel }: Props) {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [content, setContent] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isReply = parentId !== undefined

  if (isLoading) return null

  if (!user) {
    if (isReply) return null
    return (
      <div className="mt-4 py-4 text-center text-sm text-gray-500 border rounded">
        <Link href="/login" className="text-blue-600 hover:underline">로그인</Link>
        {' '}후 댓글을 작성할 수 있습니다.
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!content.trim()) {
      setError('내용을 입력해주세요.')
      return
    }

    setError('')
    setLoading(true)

    try {
      await commentsApi.create(postId, {
        content: content.trim(),
        anonymous,
        ...(parentId !== undefined && { parentId }),
      })
      setContent('')
      setAnonymous(false)
      onCancel?.()
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
        className="w-full border rounded px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <div className="flex justify-between items-center mt-2">
        <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
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
              className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
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
