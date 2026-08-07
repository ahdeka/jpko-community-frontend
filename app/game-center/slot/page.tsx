import SlotGame from '@/components/points/SlotGame'
import { MESSAGES } from '@/lib/messages'

// 게임센터 > 슬롯 탭. 로그인 게이트·제목은 상위 레이아웃이 처리한다(룰렛 탭과 동일 구조).
export default function GameCenterSlotPage() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        {MESSAGES.points.slotPage.description}
      </p>
      <SlotGame />
    </div>
  )
}
