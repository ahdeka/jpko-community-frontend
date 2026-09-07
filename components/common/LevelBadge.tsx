import { levelStyle, normalizeLevel } from '@/lib/level'
import { MESSAGES } from '@/lib/messages'

// 활동 레벨 표시 뱃지 — 닉네임 앞에 숫자만 담은 작은 칩.
//
// AdminBadge("운영진")/RootBadge("운영자")와 목적이 다르다: 저 둘은 '진위 신뢰'(사칭 방지)라
// 텍스트를 반드시 함께 넣지만, 레벨은 목록의 모든 줄에 붙는 장식성 정보라 최대한 좁아야 한다.
// 그래서 "Lv." 접두 없이 숫자만 넣고, 접두가 붙은 전체 표기는 title(툴팁)로만 노출한다.
// (구간 명칭은 없다 — 레벨은 숫자와 색으로만 구분한다)
// (표형 목록의 글쓴이 컬럼이 6.5rem뿐이라 접두사를 넣으면 닉네임이 잘린다)
//
// 색 정책(10단위로 회색→청록→초록→노랑→주황→빨강→자홍→파랑→보라→금색)과 칩의 배경·글자색·
// 굵기는 전부 lib/level.ts가 갖고 있다. 여기서는 스타일 문자열을 받아 치수만 잡는다.
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
  const style = levelStyle(normalized)

  return (
    <span
      title={MESSAGES.level.badgeTitle(normalized)}
      // 치수는 디자인 시안 확정값이다: 10px / line-height 1 / padding 4px 5px / radius 3px.
      // → 높이가 정확히 18px로 떨어지고, 한 자리 숫자일 때 거의 정사각 플레이트가 된다.
      //   (얇은 알약형은 옆 텍스트에 묻혀 무슨 숫자인지 읽히지 않았다)
      //
      // ⚠️ 굵기(font-medium/bold)는 여기서 정하지 않는다. 레벨 20을 기준으로 갈리는 정책값이라
      //    style.badge가 들고 오며, 이 className에 font-* 를 같이 쓰면 둘이 충돌한다.
      //
      // min-w + justify-center + tabular-nums: 자릿수가 섞여도 칩 폭이 들쭉날쭉하지 않아
      // 목록에서 닉네임 시작 위치가 줄마다 흔들리지 않는다(3자리부터만 가로로 늘어난다).
      // shrink-0: 좁은 폭(모바일 카드형)에서 뱃지가 찌그러지지 않게 고정.
      //
      // ⚠️ 40+ 구간의 테두리는 border가 아니라 inset box-shadow다(lib/level.ts 참고).
      //    box-shadow는 레이아웃 박스를 건드리지 않아, 테두리가 있는 칩과 없는 칩의
      //    크기가 정확히 같다 — border로 주면 그 줄만 1px씩 밀린다.
      className={`inline-flex min-w-[1.125rem] shrink-0 items-center justify-center rounded-[3px] px-[5px] py-[4px] text-[10px] leading-none tabular-nums ${style.badge} ${className}`}
    >
      {normalized}
    </span>
  )
}
