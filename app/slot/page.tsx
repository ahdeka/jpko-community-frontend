'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import SlotGame from '@/components/points/SlotGame'
import { MESSAGES } from '@/lib/messages'

// 슬롯머신(3릴, 트리플 매치만 당첨) 페이지. 룰렛과 동일하게 마이페이지 탭이 아니라 독립된 페이지로 둔다
// (배팅→결과 확인이 반복되는 단발성 액션 위주 화면이라 목록 탭 UI보다 독립 화면이 자연스럽다).
export default function SlotPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) return null

  if (!user) {
    return (
      <div className="py-16 text-center text-sm text-neutral-500 dark:text-neutral-400">
        <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400">로그인</Link>
        {' '}{MESSAGES.points.slotPage.loginGateSuffix}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">슬롯머신</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {MESSAGES.points.slotPage.description}
        </p>
      </div>

      <SlotGame />
    </div>
  )
}
