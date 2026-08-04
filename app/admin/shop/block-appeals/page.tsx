'use client'

import { useCallback, useEffect, useState } from 'react'
import { adminApi } from '@/lib/api/admin'
import { ApiError } from '@/lib/api/client'
import { formatDateTime } from '@/lib/format'
import { useAuth } from '@/lib/auth-context'
import { isRoot } from '@/lib/role'
import type { BlockAppeal } from '@/types'

const PAGE_SIZE = 20

// 차단 이의제기 관리. AdminUsersPage의 테이블+페이징+pendingId 패턴을 그대로 따른다.
// ROOT 전용 — 이의제기가 ADMIN(경매로 획득한 임시 ADMIN 포함)의 차단권 남용을 신고하는
// 내용일 수 있어, 일반 ADMIN에게는 노출하지 않는다(백엔드도 hasRole('ROOT')로 보호).
export default function AdminBlockAppealsPage() {
  const { user } = useAuth()
  const [appeals, setAppeals] = useState<BlockAppeal[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [handledFilter, setHandledFilter] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<number | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    adminApi.getBlockAppeals(handledFilter, page, PAGE_SIZE)
      .then(res => {
        setAppeals(res.data?.content ?? [])
        setTotalPages(res.data?.totalPages ?? 0)
      })
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : '이의제기 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [handledFilter, page])

  useEffect(load, [load])

  if (!user || !isRoot(user.role)) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">접근 권한이 없습니다.</p>
        <p className="mt-1 text-xs text-neutral-400">ROOT 전용 페이지입니다.</p>
      </div>
    )
  }

  function handleFilterChange(next: boolean) {
    setPage(0)
    setHandledFilter(next)
  }

  async function handleMarkHandled(appeal: BlockAppeal) {
    setPendingId(appeal.id)
    try {
      await adminApi.markAppealHandled(appeal.id)
      // 미처리 필터를 보고 있으면 처리 완료된 항목은 목록에서 사라져야 하므로 새로고침한다.
      if (!handledFilter) {
        setAppeals(prev => prev.filter(a => a.id !== appeal.id))
      } else {
        setAppeals(prev => prev.map(a => (a.id === appeal.id ? { ...a, handled: true } : a)))
      }
    } catch (err) {
      alert(err instanceof ApiError ? err.message : '처리에 실패했습니다.')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">차단 이의제기</h1>
        <div className="flex gap-1 rounded-md border border-neutral-300 p-0.5 text-xs dark:border-neutral-700">
          <button
            type="button"
            onClick={() => handleFilterChange(false)}
            className={`rounded px-2.5 py-1 ${!handledFilter ? 'bg-orange-500 text-white' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
          >
            미처리
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange(true)}
            className={`rounded px-2.5 py-1 ${handledFilter ? 'bg-orange-500 text-white' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
          >
            처리완료
          </button>
        </div>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-neutral-400">불러오는 중…</p>
      ) : error ? (
        <p className="py-12 text-center text-sm text-red-500">{error}</p>
      ) : appeals.length === 0 ? (
        <p className="py-12 text-center text-sm text-neutral-400">
          {handledFilter ? '처리완료된 이의제기가 없습니다.' : '미처리 이의제기가 없습니다.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full min-w-[560px] text-[13px]">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-[11px] font-medium tracking-wide text-neutral-400 dark:border-neutral-800 dark:bg-neutral-800/50 dark:text-neutral-500">
                <th className="whitespace-nowrap px-3 py-2 font-medium">보낸 사람</th>
                <th className="px-3 py-2 font-medium">메시지</th>
                <th className="hidden whitespace-nowrap px-3 py-2 font-medium sm:table-cell">접수일</th>
                <th className="whitespace-nowrap px-3 py-2 text-right font-medium">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {appeals.map(appeal => {
                const busy = pendingId === appeal.id
                return (
                  <tr key={appeal.id}>
                    <td className="whitespace-nowrap px-3 py-2.5 font-medium text-neutral-900 dark:text-neutral-100">
                      {appeal.senderNickname}
                    </td>
                    <td className="max-w-[360px] px-3 py-2.5 text-neutral-600 dark:text-neutral-300">
                      <p className="whitespace-pre-wrap break-words">{appeal.message}</p>
                    </td>
                    <td className="hidden whitespace-nowrap px-3 py-2.5 text-[11px] text-neutral-400 sm:table-cell">
                      {formatDateTime(appeal.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right">
                      {appeal.handled ? (
                        <span className="text-xs text-neutral-300 dark:text-neutral-600">처리완료</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleMarkHandled(appeal)}
                          disabled={busy}
                          className="rounded border border-neutral-300 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        >
                          {busy ? '처리 중…' : '처리 완료'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
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
