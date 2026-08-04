'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TransferPointsModal from '@/components/points/TransferPointsModal'
import { useAuth } from '@/lib/auth-context'
import { MESSAGES } from '@/lib/messages'

// 공개 프로필 헤더에 붙는 "포인트 보내기" 버튼. ProfileReportButton과 동일한 노출 규칙을 따른다.
//  - 본인 프로필에서는 렌더하지 않는다.
//  - 인증 상태 확정 전(isLoading)에는 렌더를 보류한다.
//  - 비로그인은 버튼을 숨기지 않고, 클릭 시 로그인으로 안내한다.
export default function TransferPointsButton({ targetUserId, targetNickname }: { targetUserId: number; targetNickname: string }) {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [open, setOpen] = useState(false)

  if (isLoading || user?.id === targetUserId) return null

  function handleClick() {
    if (!user) {
      alert(MESSAGES.common.loginRequiredToTransfer)
      router.push('/login')
      return
    }
    setOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="shrink-0 rounded-md border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-600 hover:bg-violet-100 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-400 dark:hover:bg-violet-500/20"
      >
        포인트 보내기
      </button>
      <TransferPointsModal
        open={open}
        onClose={() => setOpen(false)}
        fixedRecipient={{ id: targetUserId, nickname: targetNickname }}
      />
    </>
  )
}
