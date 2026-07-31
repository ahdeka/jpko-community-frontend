'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import RouletteGame from '@/components/points/RouletteGame'
import { MESSAGES } from '@/lib/messages'

// 룰렛(베팅형 대결) 페이지. 마이페이지 탭이 아니라 별도 페이지로 둔 이유: 마이페이지의 포인트 탭은
// 조회 전용(잔액·내역)인 반면, 이 화면은 배팅→결과 확인이 반복되는 단발성 액션 위주 화면이라
// 목록 탭 UI에 끼워 넣기보다 독립된 화면으로 두는 편이 자연스럽다.
export default function RoulettePage() {
  const { user, isLoading } = useAuth()

  if (isLoading) return null

  if (!user) {
    return (
      <div className="py-16 text-center text-sm text-neutral-500 dark:text-neutral-400">
        <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400">로그인</Link>
        {' '}{MESSAGES.points.roulettePage.loginGateSuffix}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">포인트 룰렛</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {MESSAGES.points.roulettePage.description}
        </p>
      </div>

      <RouletteGame />
    </div>
  )
}
