'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PurchaseBlockModal from '@/components/shop/PurchaseBlockModal'
import { useAuth } from '@/lib/auth-context'
import { MESSAGES } from '@/lib/messages'

// 공개 프로필 헤더에 붙는 "차단하기" 버튼. TransferPointsButton과 동일한 노출 규칙을 따르되,
// 스태프(adminAuthor) 대상은 백엔드가 TARGET_NOT_BLOCKABLE로 항상 거부하므로 아예 렌더하지 않는다
// (등급 select의 SHOGUN 비활성화와 같은 원칙 — 뻔히 실패할 요청을 프론트에서 미리 차단).
export default function ActivityBlockButton({
  targetUserId,
  targetNickname,
  adminAuthor,
}: {
  targetUserId: number
  targetNickname: string
  adminAuthor: boolean
}) {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [open, setOpen] = useState(false)

  if (isLoading || user?.id === targetUserId || adminAuthor) return null

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
        className="shrink-0 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
      >
        차단하기
      </button>
      <PurchaseBlockModal
        open={open}
        onClose={() => setOpen(false)}
        targetUserId={targetUserId}
        targetNickname={targetNickname}
      />
    </>
  )
}
