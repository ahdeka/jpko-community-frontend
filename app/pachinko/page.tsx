'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import PachinkoGame from '@/components/points/PachinkoGame'
import { MESSAGES } from '@/lib/messages'

// 파칭코(플린코형 구슬 낙하) 페이지. 룰렛과 동일하게 마이페이지 탭이 아니라 독립된 페이지로 둔다
// (배팅→결과 확인이 반복되는 단발성 액션 위주 화면이라 목록 탭 UI보다 독립 화면이 자연스럽다).
export default function PachinkoPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) return null

  if (!user) {
    return (
      <div className="py-16 text-center text-sm text-neutral-500 dark:text-neutral-400">
        <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400">로그인</Link>
        {' '}{MESSAGES.points.pachinkoPage.loginGateSuffix}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">파칭코</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {MESSAGES.points.pachinkoPage.description}
        </p>
      </div>

      <PachinkoGame />
    </div>
  )
}
