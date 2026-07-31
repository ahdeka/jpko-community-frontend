'use client'

import { useEffect, useState } from 'react'
import { pointsApi } from '@/lib/api/points'
import { ApiError } from '@/lib/api/client'
import { formatDateTime } from '@/lib/format'
import { describeTransaction, transactionTypeMeta } from '@/lib/point'
import { useAuth } from '@/lib/auth-context'
import { MESSAGES } from '@/lib/messages'
import type { PointTransaction } from '@/types'

const PAGE_SIZE = 20

// 내 포인트 거래 내역 탭. 조회 전용이며, 잔액 자체는 마이페이지 상단 통계 카드가 보여준다.
export default function MyPointsTab() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<PointTransaction[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)
    setError(null)

    pointsApi
      .getMyTransactions(page, PAGE_SIZE)
      .then(res => {
        if (cancelled) return
        setTransactions(res.data?.content ?? [])
        setTotalPages(res.data?.totalPages ?? 0)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof ApiError ? e.message : MESSAGES.mypage.myPoints.loadFailed)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page, user])

  if (loading) {
    return <p className="py-12 text-center text-sm text-neutral-400">불러오는 중…</p>
  }

  if (error) {
    return <p className="py-12 text-center text-sm text-red-500">{error}</p>
  }

  if (!user || transactions.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-neutral-400 dark:text-neutral-500">
        {MESSAGES.mypage.myPoints.empty}
      </div>
    )
  }

  return (
    <div>
      <ul className="divide-y divide-neutral-100 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {transactions.map(tx => {
          const typeMeta = transactionTypeMeta(tx.type)
          const display = describeTransaction(tx, user.id)

          return (
            <li key={tx.transactionId} className="flex items-center justify-between gap-3 px-1 py-3">
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${typeMeta.badge}`}>
                    {typeMeta.label}
                  </span>
                  <span className="text-[11px] text-neutral-400">{formatDateTime(tx.createdAt)}</span>
                </div>
                <p className="text-sm text-neutral-800 dark:text-neutral-100">
                  {display.description}
                  {display.counterpartLabel && (
                    <span className="text-neutral-400"> · {display.counterpartLabel}</span>
                  )}
                </p>
              </div>
              <span className={`shrink-0 text-sm font-bold ${display.colorClass}`}>
                {display.signedAmountLabel}
              </span>
            </li>
          )
        })}
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
