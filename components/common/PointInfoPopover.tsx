'use client'

import InfoPopover from '@/components/common/InfoPopover'
import { MESSAGES } from '@/lib/messages'

// 포인트가 어디서 들어오고 나가는지 설명하는 안내 팝오버(마이페이지 포인트 카드).
// 여닫는 동작·접근성은 InfoPopover가 담당하고, 여기서는 내용만 정한다.
export default function PointInfoPopover() {
  return (
    <InfoPopover label="포인트 안내 보기">
      {/* 활동 보상을 맨 위에 둔다 - 일상적으로 가장 자주 포인트가 들어오는 경로이자,
          일일 상한에 걸리면 아무 안내 없이 조용히 지급이 멈추는 유일한 항목이라
          "왜 포인트가 안 들어오지?"에 대한 답이 여기 먼저 보여야 한다. */}
      <p className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500">
        활동 보상
      </p>
      <p className="mt-1 text-[11px] leading-snug text-neutral-600 dark:text-neutral-300">
        {MESSAGES.points.pointInfo.activityRewardDescription}
      </p>
      <p className="mt-2 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500">
        출첵
      </p>
      <p className="mt-1 text-[11px] leading-snug text-neutral-600 dark:text-neutral-300">
        {MESSAGES.points.pointInfo.checkinDescription}
      </p>
      <p className="mt-2 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500">
        룰렛
      </p>
      <p className="mt-1 text-[11px] leading-snug text-neutral-600 dark:text-neutral-300">
        {MESSAGES.points.pointInfo.rouletteDescription}
      </p>
    </InfoPopover>
  )
}
