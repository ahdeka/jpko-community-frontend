'use client'

import { useCallback, useEffect, useState } from 'react'
import { adminApi } from '@/lib/api/admin'
import { ApiError } from '@/lib/api/client'
import { formatDate, formatDateTime } from '@/lib/format'
import { MESSAGES } from '@/lib/messages'
import { useAuth } from '@/lib/auth-context'
import SuspendUserModal from '@/components/admin/SuspendUserModal'
import type { AdminUser } from '@/types'

const PAGE_SIZE = 20

export default function AdminUsersPage() {
  const { user: actingUser } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 검색어: 입력창 값(keywordInput)과 실제 조회에 반영된 값(keyword)을 분리한다.
  // 타이핑마다 요청을 보내지 않고, 폼 제출(검색 버튼/Enter) 시점에만 keyword를 갱신한다.
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')

  // 현재 상태/등급 변경 요청이 진행 중인 유저 id. 해당 행의 컨트롤만 비활성화한다.
  const [pendingId, setPendingId] = useState<number | null>(null)

  // 지금 로그인한 계정이 ADMIN인지 — ROOT만 무기한 정지 가능하고 ADMIN은 항상 기한이 필요하다
  // (경매로 획득했는지 여부와 무관하게 ADMIN이면 전부 적용).
  const actingIsAdmin = actingUser?.role === 'ADMIN'
  // ROOT만 다른 계정의 관리자 권한을 즉시 박탈할 수 있다.
  const actingIsRoot = actingUser?.role === 'ROOT'
  // 정지 모달을 띄울 대상. null이면 닫힌 상태.
  const [suspendTarget, setSuspendTarget] = useState<AdminUser | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    adminApi
      .getUsers(keyword, page, PAGE_SIZE)
      .then(res => {
        setUsers(res.data?.content ?? [])
        setTotalPages(res.data?.totalPages ?? 0)
        setTotalElements(res.data?.totalElements ?? 0)
      })
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : MESSAGES.admin.users.loadFailed))
      .finally(() => setLoading(false))
  }, [keyword, page])

  useEffect(load, [load])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    // 검색 조건이 바뀌면 항상 첫 페이지부터 다시 본다.
    setPage(0)
    setKeyword(keywordInput)
  }

  // 정지 해제. 정지와 달리 기한 선택이 필요 없어 확인창만으로 충분하다.
  async function handleUnsuspend(user: AdminUser) {
    if (!confirm(MESSAGES.admin.users.unsuspendConfirm(user.nickname))) return

    setPendingId(user.id)
    try {
      await adminApi.updateStatus(user.id, 'ACTIVE')
      setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, status: 'ACTIVE' } : u)))
    } catch (err) {
      alert(err instanceof ApiError ? err.message : MESSAGES.admin.users.statusChangeFailed)
    } finally {
      setPendingId(null)
    }
  }

  // 즉시 관리자 권한 박탈. ROOT 전용이며, 경매로 얻었든 수동 임명이었든 백엔드가 즉시 USER로 되돌린다.
  async function handleRevokeAdmin(user: AdminUser) {
    if (!confirm(MESSAGES.admin.users.revokeAdminConfirm(user.nickname))) return

    setPendingId(user.id)
    try {
      await adminApi.revokeAdmin(user.id)
      setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, role: 'USER' } : u)))
    } catch (err) {
      alert(err instanceof ApiError ? err.message : MESSAGES.admin.users.revokeAdminFailed)
    } finally {
      setPendingId(null)
    }
  }

  // 정지는 대상 유저를 전 기기에서 로그아웃시키는 impactful 작업이라 모달로 명시적으로 확인받고,
  // 경매로 획득한 ADMIN 권한이면 기한 선택도 여기서 함께 받는다(SuspendUserModal).
  async function handleSuspendConfirm(suspendedUntil?: string) {
    if (!suspendTarget) return
    await adminApi.updateStatus(suspendTarget.id, 'SUSPENDED', suspendedUntil)
    setUsers(prev => prev.map(u => (u.id === suspendTarget.id ? { ...u, status: 'SUSPENDED' } : u)))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">
          회원 관리
          {!loading && !error && (
            <span className="ml-2 text-sm font-normal text-neutral-400">총 {totalElements.toLocaleString()}명</span>
          )}
        </h1>

        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <input
            type="search"
            value={keywordInput}
            onChange={e => setKeywordInput(e.target.value)}
            placeholder="닉네임·이메일 검색"
            className="w-44 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 outline-none focus:border-orange-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-orange-500 sm:w-56"
          />
          <button
            type="submit"
            className="shrink-0 rounded-md bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600"
          >
            검색
          </button>
        </form>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-neutral-400">불러오는 중…</p>
      ) : error ? (
        <p className="py-12 text-center text-sm text-red-500">{error}</p>
      ) : users.length === 0 ? (
        <p className="py-12 text-center text-sm text-neutral-400">
          {keyword ? MESSAGES.admin.users.searchEmpty(keyword) : MESSAGES.admin.users.empty}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full min-w-[640px] text-[13px]">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-[11px] font-medium tracking-wide text-neutral-400 dark:border-neutral-800 dark:bg-neutral-800/50 dark:text-neutral-500">
                <th className="whitespace-nowrap px-3 py-2 font-medium">회원</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">역할</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">상태</th>
                <th className="hidden whitespace-nowrap px-3 py-2 font-medium sm:table-cell">가입일</th>
                <th className="whitespace-nowrap px-3 py-2 text-right font-medium">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {users.map(user => {
                const isDeleted = user.status === 'DELETED'
                const isAdmin = user.role === 'ADMIN'
                const busy = pendingId === user.id

                return (
                  <tr key={user.id} className={isDeleted ? 'opacity-60' : undefined}>
                    {/* 회원: 닉네임 + 이메일(+ 미인증 표시). 긴 값이 표를 밀지 않게 폭을 제한하고 말줄임 처리 */}
                    <td className="max-w-[220px] px-3 py-2.5">
                      <div className="truncate font-medium leading-tight text-neutral-900 dark:text-neutral-100">{user.nickname}</div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-[11px] leading-tight text-neutral-400">
                        <span className="truncate">{user.email}</span>
                        {!user.emailVerified && !isDeleted && (
                          <span className="shrink-0 rounded bg-neutral-100 px-1 py-0.5 text-[10px] text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                            미인증
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 역할 */}
                    <td className="whitespace-nowrap px-3 py-2.5">
                      {isAdmin ? (
                        <span className="inline-block rounded bg-orange-100 px-1.5 py-0.5 text-[11px] font-semibold text-orange-600 dark:bg-orange-500/15 dark:text-orange-400">
                          관리자
                        </span>
                      ) : (
                        <span className="text-[11px] text-neutral-400">일반</span>
                      )}
                    </td>

                    {/* 상태: 계정 정지(status)와 포인트 차단권(#6 ActivityBlock)은 완전히 별개 메커니즘이라
                        둘 다 있을 수 있다 — 정지/탈퇴/활성 뱃지에 더해, 차단 중이면 별도 뱃지를 함께 보여준다. */}
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <div className="flex flex-wrap items-center gap-1">
                        {isDeleted ? (
                          <span className="inline-block rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                            탈퇴
                          </span>
                        ) : user.status === 'SUSPENDED' ? (
                          <span className="inline-block rounded bg-red-100 px-1.5 py-0.5 text-[11px] font-semibold text-red-600 dark:bg-red-500/15 dark:text-red-400">
                            정지
                          </span>
                        ) : (
                          <span className="inline-block rounded bg-green-100 px-1.5 py-0.5 text-[11px] font-semibold text-green-700 dark:bg-green-500/15 dark:text-green-400">
                            활성
                          </span>
                        )}
                        {user.activeBlockExpiresAt && (
                          <span
                            title={`${formatDateTime(user.activeBlockExpiresAt)}까지 활동 차단`}
                            className="inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                          >
                            차단중
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 가입일 */}
                    <td className="hidden whitespace-nowrap px-3 py-2.5 text-[11px] text-neutral-400 sm:table-cell">
                      {formatDate(user.createdAt)}
                    </td>

                    {/* 관리: 탈퇴 계정·관리자 계정은 상태 변경 불가(백엔드 정책과 일치) */}
                    <td className="whitespace-nowrap px-3 py-2.5 text-right">
                      {isDeleted ? (
                        <span className="text-xs text-neutral-300 dark:text-neutral-600">—</span>
                      ) : isAdmin ? (
                        actingIsRoot ? (
                          <button
                            type="button"
                            onClick={() => handleRevokeAdmin(user)}
                            disabled={busy}
                            className="rounded border border-red-200 px-2 py-1 text-xs text-red-500 hover:bg-red-50 disabled:opacity-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
                          >
                            {busy ? '처리 중…' : '권한 박탈'}
                          </button>
                        ) : (
                          <span className="text-xs text-neutral-300 dark:text-neutral-600" title="관리자 계정은 정지할 수 없습니다.">
                            —
                          </span>
                        )
                      ) : user.status === 'SUSPENDED' ? (
                        <button
                          type="button"
                          onClick={() => handleUnsuspend(user)}
                          disabled={busy}
                          className="rounded border border-green-300 px-2 py-1 text-xs text-green-700 hover:bg-green-50 disabled:opacity-50 dark:border-green-500/30 dark:text-green-400 dark:hover:bg-green-500/10"
                        >
                          {busy ? '처리 중…' : '정지 해제'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSuspendTarget(user)}
                          disabled={busy}
                          className="rounded border border-red-200 px-2 py-1 text-xs text-red-500 hover:bg-red-50 disabled:opacity-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
                        >
                          정지
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

      <SuspendUserModal
        open={!!suspendTarget}
        onClose={() => setSuspendTarget(null)}
        targetNickname={suspendTarget?.nickname ?? ''}
        actingIsAdmin={actingIsAdmin}
        onConfirm={handleSuspendConfirm}
      />
    </div>
  )
}
