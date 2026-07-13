'use client'

import { useCallback, useEffect, useState } from 'react'
import { adminApi } from '@/lib/api/admin'
import { ApiError } from '@/lib/api/client'
import { formatDate } from '@/lib/format'
// 등급 메타(한글명·색상·순서)는 lib/grade.ts가 단일 출처. 마이페이지 등과 공유한다.
// SHOGUN(쇼군)은 운영진 전용이라 백엔드가 role !== ADMIN 이면 거부하므로,
// UI에서도 일반 회원에겐 해당 옵션을 비활성화해 "무조건 실패할 요청"을 원천 차단한다.
import { GRADES, gradeMeta } from '@/lib/grade'
import type { AdminUser, UserGrade } from '@/types'

const PAGE_SIZE = 20

export default function AdminUsersPage() {
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
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : '회원 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [keyword, page])

  useEffect(load, [load])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    // 검색 조건이 바뀌면 항상 첫 페이지부터 다시 본다.
    setPage(0)
    setKeyword(keywordInput)
  }

  // 등급 변경. 성공하기 전까지는 로컬 상태를 바꾸지 않으므로(제어 select),
  // 요청이 실패하면 select 값이 저절로 원래 등급으로 남아 별도 롤백이 필요 없다.
  async function handleGradeChange(user: AdminUser, next: UserGrade) {
    if (next === user.grade) return
    const label = gradeMeta(next).label
    if (!confirm(`${user.nickname}님의 등급을 '${label}'(으)로 변경할까요?`)) return

    setPendingId(user.id)
    try {
      await adminApi.updateGrade(user.id, next)
      setUsers(prev =>
        prev.map(u =>
          u.id === user.id ? { ...u, grade: next, displayGradeName: label } : u,
        ),
      )
    } catch (err) {
      alert(err instanceof ApiError ? err.message : '등급 변경에 실패했습니다.')
    } finally {
      setPendingId(null)
    }
  }

  // 계정 정지 / 정지 해제. 정지는 대상 유저를 전 기기에서 로그아웃시키는 impactful 작업이라
  // 명시적으로 확인받는다.
  async function handleToggleStatus(user: AdminUser) {
    const suspend = user.status === 'ACTIVE'
    const message = suspend
      ? `${user.nickname}님의 계정을 정지할까요?\n정지되면 해당 회원은 즉시 로그아웃되며 로그인할 수 없습니다.`
      : `${user.nickname}님의 계정 정지를 해제할까요?`
    if (!confirm(message)) return

    setPendingId(user.id)
    try {
      await adminApi.updateStatus(user.id, suspend ? 'SUSPENDED' : 'ACTIVE')
      setUsers(prev =>
        prev.map(u =>
          u.id === user.id ? { ...u, status: suspend ? 'SUSPENDED' : 'ACTIVE' } : u,
        ),
      )
    } catch (err) {
      alert(err instanceof ApiError ? err.message : '상태 변경에 실패했습니다.')
    } finally {
      setPendingId(null)
    }
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
          {keyword ? `'${keyword}' 검색 결과가 없습니다.` : '회원이 없습니다.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full min-w-[640px] text-[13px]">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-[11px] font-medium tracking-wide text-neutral-400 dark:border-neutral-800 dark:bg-neutral-800/50 dark:text-neutral-500">
                <th className="whitespace-nowrap px-3 py-2 font-medium">회원</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">등급</th>
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

                    {/* 등급: 탈퇴 계정은 뱃지만(변경 불가), 그 외에는 즉시 반영되는 select */}
                    <td className="whitespace-nowrap px-3 py-2.5">
                      {isDeleted ? (
                        <span className={`inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold ${gradeMeta(user.grade).badge}`}>
                          {user.displayGradeName}
                        </span>
                      ) : (
                        <select
                          value={user.grade}
                          disabled={busy}
                          onChange={e => handleGradeChange(user, e.target.value as UserGrade)}
                          aria-label={`${user.nickname} 등급`}
                          className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-[11px] text-neutral-800 outline-none focus:border-orange-400 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:focus:border-orange-500"
                        >
                          {GRADES.map(g => (
                            <option
                              key={g.value}
                              value={g.value}
                              // 쇼군은 운영진(ADMIN) 전용 — 일반 회원에겐 선택 자체를 막는다.
                              // 단 이미 쇼군인 경우엔 현재 값 표시를 위해 비활성화하지 않는다.
                              disabled={g.value === 'SHOGUN' && !isAdmin && user.grade !== 'SHOGUN'}
                            >
                              {g.label}
                            </option>
                          ))}
                        </select>
                      )}
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

                    {/* 상태 */}
                    <td className="whitespace-nowrap px-3 py-2.5">
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
                        <span className="text-xs text-neutral-300 dark:text-neutral-600" title="관리자 계정은 정지할 수 없습니다.">
                          —
                        </span>
                      ) : user.status === 'SUSPENDED' ? (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user)}
                          disabled={busy}
                          className="rounded border border-green-300 px-2 py-1 text-xs text-green-700 hover:bg-green-50 disabled:opacity-50 dark:border-green-500/30 dark:text-green-400 dark:hover:bg-green-500/10"
                        >
                          {busy ? '처리 중…' : '정지 해제'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user)}
                          disabled={busy}
                          className="rounded border border-red-200 px-2 py-1 text-xs text-red-500 hover:bg-red-50 disabled:opacity-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
                        >
                          {busy ? '처리 중…' : '정지'}
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
