'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { MESSAGES } from '@/lib/messages'

// 게임센터(룰렛·파칭코·슬롯) 공통 셸.
// 세 게임이 모두 "로그인 필수 + 배팅→결과 반복"이라, 예전엔 각 페이지가 로그인 게이트를
// 개별로 들고 있었다(3중 중복). 이 레이아웃 하나로 게이트를 모으고, URL 기반 탭으로 전환한다.
// - 탭 전환은 실제 라우트 이동(/game-center/<game>)이라 각 게임의 상태·애니메이션이 서로 격리되고
//   뒤로가기·링크 공유가 자연스럽다(순수 클라이언트 탭이면 언마운트로 진행 중 게임이 날아감).
// - !user일 때 children(게임)을 아예 렌더하지 않으므로 비로그인 상태에서 게임 API가 호출되지 않는다.

// 탭 정의. 여기 순서가 탭바 노출 순서이자 기본 진입 탭(첫 항목)이 된다.
const TABS = [
  { href: '/game-center/roulette', label: '룰렛' },
  { href: '/game-center/pachinko', label: '파칭코' },
  { href: '/game-center/slot', label: '슬롯' },
  // 게임이 아니라 결과 보기라 맨 뒤에 둔다(기본 진입 탭은 계속 룰렛).
  { href: '/game-center/ranking', label: '랭킹' },
] as const

export default function GameCenterLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const pathname = usePathname()

  // 인증 확인 중에는 렌더를 보류한다(로그인 게이트가 깜빡였다 사라지는 것을 막음).
  if (isLoading) return null

  if (!user) {
    return (
      <div className="py-16 text-center text-sm text-neutral-500 dark:text-neutral-400">
        <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400">로그인</Link>
        {' '}{MESSAGES.points.gameCenter.loginGateSuffix}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">{MESSAGES.points.gameCenter.title}</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {MESSAGES.points.gameCenter.subtitle}
        </p>
      </div>

      {/* 탭바: 현재 경로와 정확히 일치하는 탭만 활성. 게임 서브라우트는 정적 경로라 === 비교로 충분하다. */}
      <nav className="flex items-center gap-1 overflow-x-auto border-b border-neutral-200 dark:border-neutral-800">
        {TABS.map(tab => {
          const active = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={
                active
                  ? 'whitespace-nowrap border-b-2 border-orange-500 px-4 py-2 text-sm font-semibold text-neutral-900 dark:text-white'
                  : 'whitespace-nowrap border-b-2 border-transparent px-4 py-2 text-sm text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
              }
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>

      {children}
    </div>
  )
}
