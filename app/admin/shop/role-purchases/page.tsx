'use client'

import { useCallback, useEffect, useState } from 'react'
import { adminApi } from '@/lib/api/admin'
import { ApiError } from '@/lib/api/client'
import { formatDateTime } from '@/lib/format'
import type { RolePurchaseAdmin } from '@/types'

const PAGE_SIZE = 20

// 경매로 ADMIN 권한을 보유 중인 유저 현황 — 임시 관리자 남용 감시용. 읽기 전용.
export default function AdminRolePurchasesPage() {
  const [items, setItems] = useState<RolePurchaseAdmin[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    adminApi.getRolePurchases(page, PAGE_SIZE)
      .then(res => {
        setItems(res.data?.content ?? [])
        setTotalPages(res.data?.totalPages ?? 0)
      })
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : '목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [page])

  useEffect(load, [load])

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">임시 관리자 현황</h1>
      <p className="text-xs text-neutral-400">경매로 낙찰받아 현재 ADMIN 권한을 보유 중인 회원 목록입니다. 만료 시 자동으로 원래 권한으로 되돌아갑니다.</p>

      {loading ? (
        <p className="py-12 text-center text-sm text-neutral-400">불러오는 중…</p>
      ) : error ? (
        <p className="py-12 text-center text-sm text-red-500">{error}</p>
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-sm text-neutral-400">현재 경매로 ADMIN 권한을 보유 중인 회원이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full min-w-[480px] text-[13px]">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-[11px] font-medium tracking-wide text-neutral-400 dark:border-neutral-800 dark:bg-neutral-800/50 dark:text-neutral-500">
                <th className="whitespace-nowrap px-3 py-2 font-medium">회원</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">획득 권한</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">원래 권한</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">만료 예정</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {items.map(item => (
                <tr key={item.userId}>
                  <td className="whitespace-nowrap px-3 py-2.5 font-medium text-neutral-900 dark:text-neutral-100">
                    {item.nickname}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <span className="inline-block rounded bg-orange-100 px-1.5 py-0.5 text-[11px] font-semibold text-orange-600 dark:bg-orange-500/15 dark:text-orange-400">
                      {item.targetRole}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-neutral-500 dark:text-neutral-400">{item.previousRole}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-neutral-500 dark:text-neutral-400">{formatDateTime(item.expiresAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
