import type { UserLevelInfo } from '@/types'

// 유저 레벨 표시 정책의 단일 출처.
// 백엔드는 숫자(level/exp)만 내려주므로 색상은 프론트가 관리한다.
// (lib/point.ts, lib/report.ts와 같은 패턴)
//
// ⚠️ 구간에 이름(새내기/주민/…)은 두지 않는다. 레벨은 숫자 그 자체로만 표시하며,
//    명칭이 필요해지면 그때 이 파일에 다시 추가한다(현재는 색 + 숫자가 전부).
//
// ⚠️ 백엔드 LevelPolicy는 `level = floor(exp / 500)`인 선형 정책이고 **상한이 없다**.
//    그래서 최상위 구간(90+)은 반드시 열린 구간이어야 한다. 구간을 닫아버리면
//    Lv.120 유저가 어느 구간에도 속하지 못해 스타일이 비게 된다.
//
// ────────────────────────────────────────────────────────────────────────────
// 색 체계 — 10단위로 색상환을 한 바퀴 돈다(디자인 시안 확정값):
//   0~9 회색 · 10~19 청록 · 20~29 초록 · 30~39 노랑 · 40~49 주황
//   50~59 빨강 · 60~69 자홍 · 70~79 파랑 · 80~89 보라 · 90+ 금색
//
// 뱃지는 **연한 배경 + 진한 숫자**를 채운 칩이다. 시안이 지정한 정확한 hex를 그대로 쓴다.
// (Tailwind v4 기본 팔레트는 OKLCH로 재조정돼 v3 계열 hex와 미세하게 다르다. 이름 클래스로
//  바꾸면 시안과 색이 어긋나므로, 라이트 모드 값은 전부 임의값 [#hex]로 못 박는다)
//
// 시안이 정한 두 가지 규칙을 그대로 따른다:
//  1) 40 이상 구간에만 한 겹 더 진한 테두리를 준다. 주황 이후로는 배경이 너무 연해 칩의
//     경계가 사라지기 때문이다. 테두리는 **border가 아니라 box-shadow: inset**이다 —
//     border로 주면 칩이 사방 1px씩 커져 목록의 행 높이와 닉네임 시작점이 흔들린다.
//     Tailwind의 shadow-[inset_0_0_0_1px_#hex]가 정확히 그 box-shadow를 만든다.
//  2) 90+ 금색만 background가 **그라디언트**다. background-color로는 표현되지 않으므로
//     bg-linear-[160deg] + from/to(=background-image)로 넣는다. 노랑(30~39)과 같은 계열이라,
//     이렇게 채도를 올려야 '최상단'으로 구분된다.
//
// ⚠️ 다크 모드에서 시안의 연한 배경을 그대로 쓰면 어두운 목록 위에 밝은 점이 수십 개 찍혀
//    눈이 아프다. 그래서 다크에서만 같은 색을 15% 투명도로 깔고(-400/15) 글자는 밝은 300계열로
//    뒤집으며, 라이트용 inset 테두리는 dark:shadow-none으로 끈다.
//    금색은 예외로 다크에서도 그대로 둔다(어두운 배경에서도 대비가 충분하고, 유일하게
//    '진하게 칠한 칩'이라는 성격이 테마와 무관하게 유지돼야 한다).
//
// ⚠️ Tailwind는 빌드 시점에 소스의 문자열을 훑어 클래스를 생성한다. 아래 클래스들은 반드시
//    문자열 리터럴로 통째로 적혀 있어야 하며, 템플릿 문자열로 hex를 끼워 조립하면 안 된다.
//
// 운영진 뱃지와의 충돌: AdminBadge(amber 채움) / RootBadge(violet→fuchsia 채움)와 색이 겹치는
// 구간(30~39 노랑, 60~89 자홍·보라, 90+ 금색)이 있지만, 운영진 뱃지에는 왕관 아이콘과
// "운영진"/"운영자" 텍스트가 함께 있고 레벨 뱃지는 숫자만 담긴 칩이라 혼동되지 않는다.

export interface LevelStyle {
  // 레벨 뱃지의 배경·글자색·inset 테두리·굵기 (라이트/다크)
  badge: string
  // 마이페이지 진행바의 채움 색
  bar: string
  // 마이페이지 레벨 숫자 강조색
  text: string
}

// 구간 정의. minLevel 내림차순으로 두고 위에서부터 처음 맞는 것을 고른다.
// (마지막 원소가 minLevel 0이라 어떤 값이 와도 반드시 하나는 매칭된다 = 폴백 불필요)
//
// 굵기도 구간이 함께 들고 있다: Lv.19까지는 font-medium(500), Lv.20부터 font-bold(700).
// 레벨이 오를수록 숫자가 굵어져, 색을 구분하기 어려운 환경에서도 서열이 읽힌다.
const LEVEL_STYLES: readonly (LevelStyle & { minLevel: number })[] = [
  {
    // 90+ : 금색. 유일하게 그라디언트로 진하게 채우는 구간(위 주석 2번).
    minLevel: 90,
    badge: 'bg-linear-[160deg] from-[#fbe9a0] to-[#d9a825] text-[#4a3208] font-bold shadow-[inset_0_0_0_1px_#b8860b]',
    bar: 'bg-linear-[90deg] from-[#fbe9a0] to-[#d9a825]',
    text: 'text-[#a16207] dark:text-amber-300',
  },
  {
    // 80~89 : 보라
    minLevel: 80,
    badge: 'bg-[#f5f3ff] text-[#6d28d9] font-bold shadow-[inset_0_0_0_1px_#ddd6fe] dark:bg-violet-400/15 dark:text-violet-300 dark:shadow-none',
    bar: 'bg-violet-500',
    text: 'text-[#6d28d9] dark:text-violet-400',
  },
  {
    // 70~79 : 파랑
    minLevel: 70,
    badge: 'bg-[#eff6ff] text-[#1d4ed8] font-bold shadow-[inset_0_0_0_1px_#bfdbfe] dark:bg-blue-400/15 dark:text-blue-300 dark:shadow-none',
    bar: 'bg-blue-600',
    text: 'text-[#1d4ed8] dark:text-blue-400',
  },
  {
    // 60~69 : 자홍
    minLevel: 60,
    badge: 'bg-[#fdf2f8] text-[#be185d] font-bold shadow-[inset_0_0_0_1px_#fbcfe8] dark:bg-pink-400/15 dark:text-pink-300 dark:shadow-none',
    bar: 'bg-pink-600',
    text: 'text-[#be185d] dark:text-pink-400',
  },
  {
    // 50~59 : 빨강
    minLevel: 50,
    badge: 'bg-[#fef2f2] text-[#b91c1c] font-bold shadow-[inset_0_0_0_1px_#fecaca] dark:bg-red-400/15 dark:text-red-300 dark:shadow-none',
    bar: 'bg-red-600',
    text: 'text-[#b91c1c] dark:text-red-400',
  },
  {
    // 40~49 : 주황. 여기부터 inset 테두리가 붙는다(위 주석 1번).
    minLevel: 40,
    badge: 'bg-[#fff7ed] text-[#c2410c] font-bold shadow-[inset_0_0_0_1px_#fed7aa] dark:bg-orange-400/15 dark:text-orange-300 dark:shadow-none',
    bar: 'bg-orange-600',
    text: 'text-[#c2410c] dark:text-orange-400',
  },
  {
    // 30~39 : 노랑
    minLevel: 30,
    badge: 'bg-[#fefce8] text-[#a16207] font-bold dark:bg-yellow-400/15 dark:text-yellow-300',
    bar: 'bg-yellow-500',
    text: 'text-[#a16207] dark:text-yellow-300',
  },
  {
    // 20~29 : 초록
    minLevel: 20,
    badge: 'bg-[#f0fdf4] text-[#15803d] font-bold dark:bg-green-400/15 dark:text-green-300',
    bar: 'bg-green-600',
    text: 'text-[#15803d] dark:text-green-400',
  },
  {
    // 10~19 : 청록. 여기까지는 굵기가 medium이다.
    minLevel: 10,
    badge: 'bg-[#ecfeff] text-[#0e7490] font-medium dark:bg-cyan-400/15 dark:text-cyan-300',
    bar: 'bg-cyan-600',
    text: 'text-[#0e7490] dark:text-cyan-400',
  },
  {
    // 0~9 : 회색. 가입 직후 전원이 속하고 목록에 가장 많이 깔리는 구간이라
    // 열 가지 색 중 채도가 가장 낮다. 칠해져 있지만 시선은 안 뺏는다.
    minLevel: 0,
    badge: 'bg-[#f4f4f5] text-[#71717a] font-medium dark:bg-zinc-400/15 dark:text-zinc-300',
    bar: 'bg-zinc-500 dark:bg-zinc-400',
    text: 'text-[#71717a] dark:text-zinc-300',
  },
] as const

// ⚠️ 닉네임 자체에는 레벨 스타일을 일절 주지 않는다. 시안에는 레벨을 따라 닉네임의 색·굵기가
//    같이 진해지는 3단계(40 / 60)가 있었지만 걷어냈다 — 목록에서 줄마다 이름의 밝기와 글자 폭이
//    달라져 열이 들쭉날쭉해 보였고, 레벨 차이는 앞에 붙는 뱃지 하나로 충분히 읽힌다.
//    닉네임은 레벨과 무관하게 호출부가 준 색·굵기를 그대로 쓴다(AuthorName이 이름을 감싸지 않는다).

// 표시용으로 정규화한 레벨. 음수·소수·NaN이 들어와도 화면이 깨지지 않게 막는다.
// (백엔드는 항상 0 이상 정수를 주지만, 배포 스큐나 응답 파싱 실패로 이상값이 올 수 있다)
export function normalizeLevel(level: number): number {
  return Number.isFinite(level) ? Math.max(0, Math.floor(level)) : 0
}

export function levelStyle(level: number): LevelStyle {
  const normalized = normalizeLevel(level)
  // minLevel 0인 마지막 원소 덕분에 find는 절대 undefined를 반환하지 않지만,
  // TS는 그걸 모르므로 non-null 단언 대신 마지막 원소를 명시적 폴백으로 둔다.
  return LEVEL_STYLES.find(s => normalized >= s.minLevel) ?? LEVEL_STYLES[LEVEL_STYLES.length - 1]
}

// 현재 레벨 구간의 진행률(0~100). 마이페이지 진행바 width에 그대로 쓴다.
//
// 백엔드 UserLevelResponse는 expIntoLevel(현재 구간에서 모은 exp)과 expPerLevel(구간 크기)을
// 따로 내려준다. 분모가 0/음수로 오면(설정 실수) 0으로 나누기가 되므로 먼저 막는다.
export function levelProgressPercent(info: UserLevelInfo): number {
  if (!Number.isFinite(info.expPerLevel) || info.expPerLevel <= 0) return 0

  const ratio = (info.expIntoLevel / info.expPerLevel) * 100
  if (!Number.isFinite(ratio)) return 0
  return Math.min(100, Math.max(0, ratio))
}

// 다음 레벨까지 남은 exp. 음수가 나오지 않게 0으로 바닥을 깐다.
export function expToNextLevel(info: UserLevelInfo): number {
  const remaining = info.expPerLevel - info.expIntoLevel
  return Number.isFinite(remaining) ? Math.max(0, remaining) : 0
}
