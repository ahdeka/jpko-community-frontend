'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { usersApi } from '@/lib/api/users'
import MyPostsTab from '@/components/mypage/MyPostsTab'
import MyCommentsTab from '@/components/mypage/MyCommentsTab'
import ProfileSettings from '@/components/mypage/ProfileSettings'

type Tab = 'posts' | 'comments' | 'profile'

// 통계 카드 한 칸
function StatCard({ label, value, accent }: { label: string; value: number | null; accent: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/50">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent}`}>
        {/* 집계 로딩 중에는 '—'로 자리만 잡아 레이아웃이 흔들리지 않게 한다 */}
        {value === null ? '—' : value.toLocaleString()}
      </p>
    </div>
  )
}

export default function MyPage() {
  const { user, isLoading } = useAuth()
  const [tab, setTab] = useState<Tab>('posts')

  // 통계용 집계(전체 개수)는 목록과 별개로 size=1만 받아 totalElements만 사용한다.
  const [postCount, setPostCount] = useState<number | null>(null)
  const [commentCount, setCommentCount] = useState<number | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    usersApi.getMyPosts(0, 1)
      .then(res => { if (!cancelled) setPostCount(res.data?.totalElements ?? 0) })
      .catch(() => { if (!cancelled) setPostCount(0) })

    usersApi.getMyComments(0, 1)
      .then(res => { if (!cancelled) setCommentCount(res.data?.totalElements ?? 0) })
      .catch(() => { if (!cancelled) setCommentCount(0) })

    return () => { cancelled = true }
  }, [user])

  // 인증 상태 확인 중에는 깜빡임을 막기 위해 아무것도 그리지 않는다.
  if (isLoading) return null

  // 비로그인 사용자 차단 (마이페이지는 로그인 필수)
  if (!user) {
    return (
      <div className="py-16 text-center text-sm text-neutral-500 dark:text-neutral-400">
        <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400">로그인</Link>
        {' '}후 마이페이지를 이용할 수 있습니다.
      </div>
    )
  }

  const isAdmin = user.role === 'ADMIN'

  const tabButton = (key: Tab) =>
    tab === key
      ? 'border-b-2 border-orange-500 px-3 py-2 text-sm font-semibold text-neutral-900 dark:text-white'
      : 'border-b-2 border-transparent px-3 py-2 text-sm text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'

  return (
    <div className="flex flex-col gap-6">
      {/* 인사말 + 프로필 요약 */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-white dark:bg-neutral-600">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4.42 3.58-7 8-7s8 2.58 8 7" />
            </svg>
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-lg font-bold">{user.nickname}</h1>
              {isAdmin && (
                <span className="shrink-0 rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                  관리자
                </span>
              )}
            </div>
            <p className="truncate text-xs text-neutral-400 dark:text-neutral-500">{user.email}</p>
          </div>
        </div>

        {/* 관리자는 마이페이지에서 바로 관리자 페이지로 진입 가능 */}
        {isAdmin && (
          <Link
            href="/admin"
            className="shrink-0 rounded-md border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-600 hover:bg-orange-100 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20"
          >
            관리자 페이지 →
          </Link>
        )}
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="내가 쓴 글" value={postCount} accent="text-neutral-900 dark:text-white" />
        <StatCard label="내가 쓴 댓글" value={commentCount} accent="text-neutral-900 dark:text-white" />
        {/* 등급 카드는 숫자가 아닌 텍스트라 별도로 렌더 */}
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/50">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">회원 등급</p>
          <p className={`mt-1 text-2xl font-bold ${isAdmin ? 'text-orange-500' : 'text-neutral-900 dark:text-white'}`}>
            {isAdmin ? '관리자' : '일반회원'}
          </p>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-neutral-200 dark:border-neutral-800">
        <nav className="-mb-px flex gap-1">
          <button type="button" className={tabButton('posts')} onClick={() => setTab('posts')}>
            내가 쓴 글
          </button>
          <button type="button" className={tabButton('comments')} onClick={() => setTab('comments')}>
            내가 쓴 댓글
          </button>
          <button type="button" className={tabButton('profile')} onClick={() => setTab('profile')}>
            프로필 설정
          </button>
        </nav>
      </div>

      {/* 탭 콘텐츠 */}
      <div>
        {tab === 'posts' && <MyPostsTab />}
        {tab === 'comments' && <MyCommentsTab />}
        {tab === 'profile' && <ProfileSettings />}
      </div>
    </div>
  )
}
