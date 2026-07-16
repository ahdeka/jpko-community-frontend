'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { noticesApi } from '@/lib/api/notices'
import { postsApi } from '@/lib/api/posts'
import { adminApi } from '@/lib/api/admin'
import { adminReportsApi } from '@/lib/api/reports'
import { formatDate } from '@/lib/format'
import type { NoticeSummary } from '@/types'

// 통계 카드. real=false 면 백엔드 미구현 항목으로 '준비 중'을 표시한다.
function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string | number | null
  accent?: string
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/50">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ?? 'text-neutral-900 dark:text-white'}`}>
        {value === null ? '—' : value}
      </p>
    </div>
  )
}

export default function AdminDashboard() {
  const { user } = useAuth()

  // 실제 수치: 공지 총 개수 / 게시글 총 개수 (공개 목록 응답의 totalElements 활용)
  const [noticeCount, setNoticeCount] = useState<number | null>(null)
  const [postCount, setPostCount] = useState<number | null>(null)
  const [userCount, setUserCount] = useState<number | null>(null)
  // 처리 대기 중인 신고 "대상" 수. 건수가 아니다 — 아래 조회 주석 참고.
  const [pendingReportCount, setPendingReportCount] = useState<number | null>(null)
  const [recentNotices, setRecentNotices] = useState<NoticeSummary[]>([])

  useEffect(() => {
    let cancelled = false

    noticesApi.getAll(0, 5)
      .then(res => {
        if (cancelled) return
        setNoticeCount(res.data?.totalElements ?? 0)
        setRecentNotices(res.data?.content ?? [])
      })
      .catch(() => { if (!cancelled) { setNoticeCount(0); setRecentNotices([]) } })

    postsApi.getAll(0, 1)
      .then(res => { if (!cancelled) setPostCount(res.data?.posts?.totalElements ?? 0) })
      .catch(() => { if (!cancelled) setPostCount(0) })

    // 전체 회원 수: 관리자 회원 목록의 totalElements만 활용(1건만 받아 오버헤드 최소화)
    adminApi.getUsers('', 0, 1)
      .then(res => { if (!cancelled) setUserCount(res.data?.totalElements ?? 0) })
      .catch(() => { if (!cancelled) setUserCount(0) })

    // 처리 대기 신고: PENDING 필터의 totalElements를 쓴다.
    // ⚠️ 이 값은 신고 "건수"가 아니라 "대상 수"다 — 백엔드 집계 쿼리가 (target_type, target_id)로
    //    GROUP BY하므로 totalElements는 그룹(=신고당한 글·댓글)의 개수다.
    //    한 글에 신고 5건이 쌓여 있어도 여기서는 1로 센다. 카드 라벨도 그에 맞춰 표기한다.
    adminReportsApi.getSummaries({ status: 'PENDING' }, 0, 1)
      .then(res => { if (!cancelled) setPendingReportCount(res.data?.totalElements ?? 0) })
      .catch(() => { if (!cancelled) setPendingReportCount(0) })

    return () => { cancelled = true }
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">대시보드</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {user?.nickname}님, 관리자 페이지입니다.
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="전체 공지" value={noticeCount} accent="text-orange-500" />
        <StatCard label="전체 게시글" value={postCount} />
        <StatCard label="전체 회원" value={userCount} />
        {/* 처리할 신고가 있으면 빨강으로 시선을 끌고, 0이면 평범한 색으로 둔다. */}
        <StatCard
          label="미처리 신고"
          value={pendingReportCount}
          accent={pendingReportCount ? 'text-red-500' : undefined}
        />
      </div>
      <p className="-mt-3 text-[11px] text-neutral-400 dark:text-neutral-500">
        ※ 미처리 신고는 신고가 접수된 게시글·댓글의 수이며, 신고 건수와는 다릅니다.
      </p>

      {/* 빠른 작업 */}
      <section>
        <h2 className="mb-3 text-sm font-bold text-neutral-900 dark:text-neutral-100">빠른 작업</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href="/admin/notices/new"
            className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4 hover:border-orange-300 hover:bg-orange-50/40 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-orange-500/40 dark:hover:bg-orange-500/5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-orange-100 text-orange-500 dark:bg-orange-500/20">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">공지사항 작성</p>
              <p className="text-xs text-neutral-400">새 공지를 등록합니다</p>
            </div>
          </Link>

          <Link
            href="/admin/notices"
            className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4 hover:border-orange-300 hover:bg-orange-50/40 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-orange-500/40 dark:hover:bg-orange-500/5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-300">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">공지사항 관리</p>
              <p className="text-xs text-neutral-400">목록·수정·삭제</p>
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4 hover:border-orange-300 hover:bg-orange-50/40 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-orange-500/40 dark:hover:bg-orange-500/5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-300">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">회원 관리</p>
              <p className="text-xs text-neutral-400">등급·상태 변경</p>
            </div>
          </Link>

          <Link
            href="/admin/reports"
            className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-4 hover:border-orange-300 hover:bg-orange-50/40 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-orange-500/40 dark:hover:bg-orange-500/5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-300">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" />
              </svg>
            </span>
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                신고 관리
                {/* 처리할 게 있을 때만 배지를 띄워, 평소엔 조용하고 필요할 때만 눈에 띄게 한다. */}
                {pendingReportCount ? (
                  <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                    {pendingReportCount > 99 ? '99+' : pendingReportCount}
                  </span>
                ) : null}
              </p>
              <p className="text-xs text-neutral-400">신고 확인·조치</p>
            </div>
          </Link>
        </div>
      </section>

      {/* 최근 공지 미리보기 */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">최근 공지</h2>
          <Link href="/admin/notices" className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
            전체 보기
          </Link>
        </div>
        {recentNotices.length === 0 ? (
          <p className="rounded-lg border border-dashed border-neutral-200 py-8 text-center text-sm text-neutral-400 dark:border-neutral-800">
            등록된 공지가 없습니다.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {recentNotices.map(notice => (
              <li key={notice.id} className="flex items-center gap-3 px-3 py-2.5">
                {notice.pinned && (
                  <span className="shrink-0 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">공지</span>
                )}
                <Link
                  href={`/notices/${notice.id}`}
                  className="min-w-0 flex-1 truncate text-sm text-neutral-700 hover:text-neutral-900 dark:text-neutral-200 dark:hover:text-white"
                >
                  {notice.title}
                </Link>
                <span className="shrink-0 text-xs text-neutral-400">{formatDate(notice.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
