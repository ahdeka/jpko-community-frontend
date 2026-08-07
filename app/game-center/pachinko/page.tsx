import PachinkoGame from '@/components/points/PachinkoGame'
import { MESSAGES } from '@/lib/messages'

// 게임센터 > 파칭코 탭. 로그인 게이트·제목은 상위 레이아웃이 처리한다(룰렛 탭과 동일 구조).
export default function GameCenterPachinkoPage() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        {MESSAGES.points.pachinkoPage.description}
      </p>
      <PachinkoGame />
    </div>
  )
}
