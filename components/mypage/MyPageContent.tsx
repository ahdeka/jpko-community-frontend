'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { usersApi } from '@/lib/api/users'
import { pointsApi } from '@/lib/api/points'
import MyPostsTab from '@/components/mypage/MyPostsTab'
import MyCommentsTab from '@/components/mypage/MyCommentsTab'
import MyPointsTab from '@/components/mypage/MyPointsTab'
import MyReportsTab from '@/components/mypage/MyReportsTab'
import MyRankingTab from '@/components/mypage/MyRankingTab'
import ProfileSettings from '@/components/mypage/ProfileSettings'
import EmailVerificationBanner from '@/components/mypage/EmailVerificationBanner'
import PointInfoPopover from '@/components/common/PointInfoPopover'
import LevelBadge from '@/components/common/LevelBadge'
import { levelStyle, levelProgressPercent, expToNextLevel } from '@/lib/level'
import type { UserLevelInfo } from '@/types'
import { MESSAGES } from '@/lib/messages'

type Tab = 'posts' | 'comments' | 'points' | 'ranking' | 'reports' | 'profile'

const TABS: readonly Tab[] = ['posts', 'comments', 'points', 'ranking', 'reports', 'profile']

// 딥링크(?tab=ranking 등)로 들어온 초기 탭을 고른다. 알 수 없는 값이면 기본 'posts'.
function resolveInitialTab(raw: string | null): Tab {
  return TABS.includes(raw as Tab) ? (raw as Tab) : 'posts'
}

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

// 레벨 · 경험치 카드.
//
// /api/auth/me(UserInfoResponse.level)가 level/totalExp/expIntoLevel/expPerLevel을 한 번에
// 내려주므로 추가 API 호출 없이 그린다(글/댓글/포인트 통계와 달리 useEffect 패칭이 없다).
// 진행바가 있어 가로 폭이 필요하므로 통계 카드 그리드에 끼우지 않고 별도 섹션으로 둔다.
//
// 색(레벨별 강조색·진행바)은 전부 lib/level.ts가 정하며, 목록의 레벨 뱃지와 같은 출처를 쓰기
// 때문에 "뱃지는 초록인데 마이페이지 바는 파랑"처럼 어긋날 일이 없다.
function LevelCard({ info }: { info: UserLevelInfo }) {
  const style = levelStyle(info.level)
  const percent = levelProgressPercent(info)
  const remaining = expToNextLevel(info)

  return (
    // 통계 카드(글/댓글/포인트)보다 시선 우선순위가 낮은 보조 정보라 한 단계 낮은 밀도로 짠다.
    // 획득 방법 안내는 카드 본문에서 빼고 title(툴팁)로 옮겼다 — 두 줄짜리 설명이 카드 높이의
    // 3분의 1을 먹고 있었고, 매번 읽을 내용은 아니기 때문이다.
    <section
      title={MESSAGES.level.card.howTo}
      className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-800/50"
    >
      <div className="flex items-center justify-between gap-3">
        {/* 구간 명칭은 없다 — 레벨은 숫자와 색으로만 표시한다(lib/level.ts). */}
        <div className="flex min-w-0 items-baseline gap-1.5">
          <p className="shrink-0 text-xs text-neutral-500 dark:text-neutral-400">
            {MESSAGES.level.card.title}
          </p>
          <span className={`text-lg font-bold leading-none tabular-nums ${style.text}`}>
            {MESSAGES.level.card.levelLabel(info.level)}
          </span>
        </div>
        <p className="shrink-0 text-[11px] tabular-nums text-neutral-400 dark:text-neutral-500">
          {MESSAGES.level.card.totalExp(info.totalExp.toLocaleString())}
        </p>
      </div>

      {/*
        진행바. width를 인라인 style로 주는 이유는 퍼센트가 런타임 값이라
        Tailwind가 빌드 시점에 클래스를 생성할 수 없기 때문이다(w-[37%] 같은 동적 클래스는 안 만들어짐).
        스크린리더에는 role="progressbar" + aria-value*로 같은 정보를 전달한다.
      */}
      <div
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={MESSAGES.level.card.title}
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700"
      >
        <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${percent}%` }} />
      </div>

      <div className="mt-1 flex items-center justify-between gap-2 text-[10px] tabular-nums text-neutral-500 dark:text-neutral-400">
        <span>
          {MESSAGES.level.card.progress(
            info.expIntoLevel.toLocaleString(),
            info.expPerLevel.toLocaleString(),
          )}
        </span>
        <span>{MESSAGES.level.card.toNext(remaining.toLocaleString())}</span>
      </div>
    </section>
  )
}

export default function MyPageContent() {
  const { user, isLoading } = useAuth()
  // 메인의 "내 순위 보기" 링크(/mypage?tab=ranking)로 들어오면 랭킹 탭을 초기 선택한다.
  // 초기값 계산은 마운트 시 1회뿐이며, 이후 탭 전환은 버튼(setTab)이 담당한다(URL은 갱신하지 않는다).
  // useSearchParams는 클라이언트 훅이라, 이 컴포넌트는 page에서 <Suspense>로 감싸야 프로덕션
  // 빌드가 통과한다(Next: static page에서 useSearchParams는 Suspense 경계 필수).
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<Tab>(() => resolveInitialTab(searchParams.get('tab')))

  // 통계용 집계(전체 개수)는 목록과 별개로 size=1만 받아 totalElements만 사용한다.
  const [postCount, setPostCount] = useState<number | null>(null)
  const [commentCount, setCommentCount] = useState<number | null>(null)
  const [pointBalance, setPointBalance] = useState<number | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    usersApi.getMyPosts(0, 1)
      .then(res => { if (!cancelled) setPostCount(res.data?.totalElements ?? 0) })
      .catch(() => { if (!cancelled) setPostCount(0) })

    usersApi.getMyComments(0, 1)
      .then(res => { if (!cancelled) setCommentCount(res.data?.totalElements ?? 0) })
      .catch(() => { if (!cancelled) setCommentCount(0) })

    pointsApi.getBalance()
      .then(res => { if (!cancelled) setPointBalance(res.data?.balance ?? 0) })
      .catch(() => { if (!cancelled) setPointBalance(0) })

    return () => { cancelled = true }
  }, [user])

  // 인증 상태 확인 중에는 깜빡임을 막기 위해 아무것도 그리지 않는다.
  if (isLoading) return null

  // 비로그인 사용자 차단 (마이페이지는 로그인 필수)
  if (!user) {
    return (
      <div className="py-16 text-center text-sm text-neutral-500 dark:text-neutral-400">
        <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400">로그인</Link>
        {' '}{MESSAGES.mypage.loginGateSuffix}
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
              {/* 목록·프로필과 동일한 레벨 뱃지를 여기에도 붙여, 내 레벨이 남에게 어떻게
                  보이는지 그대로 확인할 수 있게 한다. (level 자체가 없으면 아래 카드와 함께 사라짐) */}
              {user.level && <LevelBadge level={user.level.level} />}
              {isAdmin && (
                <span className="shrink-0 rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                  관리자
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <p className="truncate text-xs text-neutral-400 dark:text-neutral-500">{user.email}</p>
              {/* 미인증 사용자에게만 이메일 옆 노란 배지 노출 (상세 안내는 아래 배너에서) */}
              {!user.emailVerified && (
                <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-amber-100 px-1 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                  <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  미인증
                </span>
              )}
            </div>
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

      {/* 이메일 미인증 경고 (인증 완료 시 자동으로 숨겨짐) */}
      <EmailVerificationBanner />

      {/*
        레벨 · 경험치.
        ⚠️ user.level이 없을 수 있다 — 프론트(Vercel)가 백엔드(EC2)보다 먼저 배포되면
           /api/auth/me 응답에 level 필드가 통째로 없다. 그 경우 이 카드만 조용히 빠지고
           마이페이지의 나머지(통계·탭)는 정상 동작한다.
      */}
      {user.level && <LevelCard info={user.level} />}

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="내가 쓴 글" value={postCount} accent="text-neutral-900 dark:text-white" />
        <StatCard label="내가 쓴 댓글" value={commentCount} accent="text-neutral-900 dark:text-white" />
        {/* 포인트 카드: 라벨 우측에 룰렛 설명 팝오버 */}
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">포인트</p>
            <PointInfoPopover />
          </div>
          <p className="mt-1 text-2xl font-bold text-orange-600 dark:text-orange-400">
            {pointBalance === null ? '—' : `${pointBalance.toLocaleString()}P`}
          </p>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-neutral-200 dark:border-neutral-800">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          <button type="button" className={tabButton('posts')} onClick={() => setTab('posts')}>
            내가 쓴 글
          </button>
          <button type="button" className={tabButton('comments')} onClick={() => setTab('comments')}>
            내가 쓴 댓글
          </button>
          <button type="button" className={tabButton('points')} onClick={() => setTab('points')}>
            포인트
          </button>
          <button type="button" className={tabButton('ranking')} onClick={() => setTab('ranking')}>
            랭킹
          </button>
          <button type="button" className={tabButton('reports')} onClick={() => setTab('reports')}>
            내 신고
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
        {tab === 'points' && <MyPointsTab />}
        {tab === 'ranking' && <MyRankingTab />}
        {tab === 'reports' && <MyReportsTab />}
        {tab === 'profile' && <ProfileSettings />}
      </div>
    </div>
  )
}
