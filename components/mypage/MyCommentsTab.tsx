'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usersApi } from '@/lib/api/users'
import { ApiError } from '@/lib/api/client'
import { formatRelativeTime } from '@/lib/format'
import type { MyComment } from '@/types'

const PAGE_SIZE = 10

// 내가 쓴 댓글 탭. 각 항목은 원본 게시글(/posts/{postId})로 이동한다.
export default function MyCommentsTab() {
  const [comments, setComments] = useState<MyComment[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    usersApi
      .getMyComments(page, PAGE_SIZE)
      .then(res => {
        if (cancelled) return
        setComments(res.data?.content ?? [])
        setTotalPages(res.data?.totalPages ?? 0)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof ApiError ? e.message : '댓글을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page])

  if (loading) {
    return <p className="py-12 text-center text-sm text-neutral-400">불러오는 중…</p>
  }

  if (error) {
    return <p className="py-12 text-center text-sm text-red-500">{error}</p>
  }

  if (comments.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-neutral-400 dark:text-neutral-500">
        아직 작성한 댓글이 없습니다.
      </div>
    )
  }

  return (
    <div>
      <ul className="divide-y divide-neutral-100 dark:divide-neutral-800 border-y border-neutral-200 dark:border-neutral-800">
        {comments.map(comment => (
          <li key={comment.id}>
            <Link
              href={`/posts/${comment.postId}`}
              className="block px-1 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
            >
              <p className="line-clamp-2 text-sm text-neutral-800 dark:text-neutral-100">{comment.content}</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500">
                <span className="truncate">on {comment.postTitle}</span>
                <span className="shrink-0">· {formatRelativeTime(comment.createdAt)}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage(p => Math.max(0, p - 1))}
            className="rounded px-3 py-1 text-neutral-500 hover:bg-neutral-100 disabled:opacity-40 dark:hover:bg-neutral-800"
          >
            이전
          </button>
          <span className="text-xs text-neutral-400">{page + 1} / {totalPages}</span>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            className="rounded px-3 py-1 text-neutral-500 hover:bg-neutral-100 disabled:opacity-40 dark:hover:bg-neutral-800"
          >
            다음
          </button>
        </div>
      )}
    </div>
  )
}
