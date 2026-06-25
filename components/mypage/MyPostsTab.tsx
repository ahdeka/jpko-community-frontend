'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usersApi } from '@/lib/api/users'
import { ApiError } from '@/lib/api/client'
import { formatDate } from '@/lib/format'
import type { MyPost } from '@/types'

const PAGE_SIZE = 10

// 내가 쓴 글 탭. URL이 아닌 컴포넌트 내부 state로 페이지를 관리한다
// (대시보드 탭 안에서의 이동이라 주소를 바꾸지 않는 편이 자연스럽다).
export default function MyPostsTab() {
  const [posts, setPosts] = useState<MyPost[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    usersApi
      .getMyPosts(page, PAGE_SIZE)
      .then(res => {
        if (cancelled) return
        setPosts(res.data?.content ?? [])
        setTotalPages(res.data?.totalPages ?? 0)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof ApiError ? e.message : '글을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    // 페이지를 빠르게 바꿀 때 이전 응답이 늦게 도착해 최신 상태를 덮어쓰는 것 방지
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

  if (posts.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-neutral-400 dark:text-neutral-500">
        아직 작성한 글이 없습니다.
        <div className="mt-3">
          <Link href="/posts/new" className="text-blue-600 hover:underline dark:text-blue-400">
            첫 글 작성하기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <ul className="divide-y divide-neutral-100 dark:divide-neutral-800 border-y border-neutral-200 dark:border-neutral-800">
        {posts.map(post => (
          <li key={post.id}>
            <Link
              href={`/posts/${post.id}`}
              className="flex items-center gap-3 px-1 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
            >
              <span className="shrink-0 text-xs text-blue-600 dark:text-blue-400">[{post.categoryName}]</span>
              <span className="min-w-0 flex-1 truncate text-sm text-neutral-800 dark:text-neutral-100">
                {post.title}
              </span>
              <span className="shrink-0 text-xs text-neutral-400 dark:text-neutral-500">조회 {post.viewCount}</span>
              <span className="hidden shrink-0 text-xs text-neutral-400 dark:text-neutral-500 sm:inline">
                {formatDate(post.createdAt)}
              </span>
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
