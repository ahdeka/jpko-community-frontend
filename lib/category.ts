// 글 목록 배지에 쓰는 카테고리 약칭.
// 헤더 등 다른 곳은 전체 이름을 쓰므로, 이 약칭은 "목록 배지 전용"이다.
// 매핑에 없는 카테고리는 원래 이름을 그대로 반환한다.
// (약칭이 많아지면 백엔드 Category에 shortName 필드를 두는 쪽으로 옮기는 게 좋다.)
const SHORT_LABELS: Record<string, string> = {
  워킹홀리데이: '워홀',
}

export function categoryShortLabel(name: string): string {
  return SHORT_LABELS[name] ?? name
}
