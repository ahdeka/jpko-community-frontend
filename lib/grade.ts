import type { UserGrade } from '@/types'

// 유저 등급(사무라이 계급 테마) 메타데이터의 단일 출처.
// 백엔드는 grade를 enum 상수("ASHIGARU" 등)로만 내려주므로, 한글 이름·설명·색상은
// 프론트가 이 파일 하나로 관리한다. 관리자 회원 표·마이페이지 등급 뱃지가 모두 여기를 참조한다.
export interface GradeMeta {
  value: UserGrade
  label: string    // 한글 이름 (예: "아시가루")
  tier: string     // 아주 짧은 계층 표기 (예: "일반 등급") — 등급명 옆 보조 설명
  meaning: string  // 계급의 의미 — 툴팁/사다리에 표시
  badge: string    // 뱃지 배경·글자 색 (light + dark)
  dot: string      // 사다리 목록에서 쓰는 단색 점 색
}

// ⚠️ 배열 순서 = 낮은 계급 → 높은 계급. 사다리 UI가 이 순서를 그대로 사용한다.
export const GRADES: GradeMeta[] = [
  {
    value: 'ASHIGARU',
    label: '아시가루',
    tier: '일반 등급',
    meaning: '평시엔 농민, 전시에 동원된 최하급 보병',
    badge: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
    dot: 'bg-neutral-400',
  },
  {
    value: 'SAMURAI',
    label: '사무라이',
    tier: '무사 등급',
    meaning: '정식 무사 계급',
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    dot: 'bg-sky-500',
  },
  {
    value: 'HATAMOTO',
    label: '하타모토',
    tier: '정예 등급',
    meaning: '쇼군을 직접 호위하는 상급 무사',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  {
    value: 'DAIMYO',
    label: '다이묘',
    tier: '귀족 등급',
    meaning: '영지를 다스리는 대영주',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
    dot: 'bg-violet-500',
  },
  {
    value: 'SHOGUN',
    label: '쇼군',
    tier: '운영 등급',
    meaning: '무가 정권의 최고 통치자',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
]

// 알 수 없는 값이 와도(백엔드 enum 추가 등) 최소한 최하위 등급으로 안전하게 폴백한다.
export const gradeMeta = (grade: UserGrade): GradeMeta =>
  GRADES.find(g => g.value === grade) ?? GRADES[0]
