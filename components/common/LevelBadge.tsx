import { levelTier, normalizeLevel } from '@/lib/level'
import { MESSAGES } from '@/lib/messages'

// 활동 레벨 표시 뱃지 — 닉네임 앞에 숫자만 담은 작은 칩.
//
// AdminBadge("운영진")/RootBadge("운영자")와 목적이 다르다: 저 둘은 '진위 신뢰'(사칭 방지)라
// 텍스트를 반드시 함께 넣지만, 레벨은 목록의 모든 줄에 붙는 장식성 정보라 최대한 좁아야 한다.
// 그래서 "Lv." 접두 없이 숫자만 넣고, 구간 이름은 title(툴팁)로만 노출한다.
// (표형 목록의 글쓴이 컬럼이 6.5rem뿐이라 접두사를 넣으면 닉네임이 잘린다)
//
// 색·구간 정책은 전부 lib/level.ts가 갖고 있다. 여기서는 스타일 문자열을 받아 붙이기만 한다.
//
// ⚠️ Lv.0은 유효한 값이다(가입 직후 전원이 0). 호출부는 falsy 체크가 아니라 null 체크로
//    렌더 여부를 정해야 하며, 이 컴포넌트는 0이 들어와도 정상적으로 "0"을 그린다.
export default function LevelBadge({
  level,
  className = '',
}: {
  level: number
  className?: string
}) {
  const normalized = normalizeLevel(level)
  const tier = levelTier(normalized)

  return (
    <span
      title={MESSAGES.level.badgeTitle(normalized, tier.label)}
      // min-w + justify-center + tabular-nums: 1자리(8)와 3자리(120)가 섞여도 칩 폭이 들쭉날쭉하지
      // 않게 최소 폭을 잡아준다. 목록에서 닉네임 시작 위치가 줄마다 흔들리는 걸 막는 장치다.
      // shrink-0: 좁은 폭(모바일 카드형)에서 뱃지가 찌그러지지 않게 고정.
      className={`inline-flex min-w-[1.125rem] shrink-0 items-center justify-center rounded px-1 py-px text-[10px] font-bold leading-none tabular-nums ${tier.badge} ${className}`}
    >
      {normalized}
    </span>
  )
}
