'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { noticesApi } from '@/lib/api/notices'
import { ApiError } from '@/lib/api/client'
import { formatDate } from '@/lib/format'
import type { NoticeSummary } from '@/types'

const PAGE_SIZE = 20

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<NoticeSummary[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  function load() {
    setLoading(true)
    setError(null)
    noticesApi
      .getAll(page, PAGE_SIZE)
      .then(res => {
        setNotices(res.data?.content ?? [])
        setTotalPages(res.data?.totalPages ?? 0)
      })
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : '목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [page])

  async function handleDelete(id: number, title: string) {
    // 삭제는 되돌릴 수 없으므로 제목을 보여주며 명시적으로 확인받는다.
    if (!confirm(`"${title}" 공지를 삭제할까요?\n삭제 후에는 복구할 수 없습니다.`)) return

    setDeletingId(id)
    try {
      await noticesApi.delete(id)
      // 삭제 후 현재 페이지를 다시 불러온다. 마지막 항목을 지워 페이지가 비면 이전 페이지로.
      if (notices.length === 1 && page > 0) {
        setPage(p => p - 1) // page 변경이 useEffect로 load 트리거
      } else {
        load()
      }
    } catch (e) {
      alert(e instanceof ApiError ? e.message : '삭제에 실패했습니다.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">공지사항 관리</h1>
        <Link
          href="/admin/notices/new"
          className="inline-flex items-center gap-1 rounded-md bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          공지 작성
        </Link>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-neutral-400">불러오는 중…</p>
      ) : error ? (
        <p className="py-12 text-center text-sm text-red-500">{error}</p>
      ) : notices.length === 0 ? (
        <p className="py-12 text-center text-sm text-neutral-400">등록된 공지가 없습니다.</p>
      ) : (
        <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {notices.map(notice => (
            <li key={notice.id} className="flex items-center gap-3 px-3 py-3">
              <div className="flex shrink-0 gap-1">
                {notice.pinned && (
                  <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">고정</span>
                )}
                {notice.featured && (
                  <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">중요</span>
                )}
              </div>
              <Link
                href={`/notices/${notice.id}`}
                className="min-w-0 flex-1 truncate text-sm text-neutral-800 hover:text-neutral-950 dark:text-neutral-100 dark:hover:text-white"
              >
                {notice.title}
              </Link>
              <span className="hidden shrink-0 text-xs text-neutral-400 sm:inline">{formatDate(notice.createdAt)}</span>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/admin/notices/${notice.id}/edit`}
                  className="rounded border border-neutral-300 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  수정
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(notice.id, notice.title)}
                  disabled={deletingId === notice.id}
                  className="rounded border border-red-200 px-2 py-1 text-xs text-red-500 hover:bg-red-50 disabled:opacity-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
                >
                  {deletingId === notice.id ? '삭제 중…' : '삭제'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
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
