import type { UserGrade } from '@/types'

// 유저 등급 메타데이터의 단일 출처.
// 백엔드는 grade를 enum 상수("ASHIGARU" 등)로만 내려주므로, 한글 이름·설명·색상은
// 프론트가 이 파일 하나로 관리한다. 마이페이지 등급 카드·등급 설명 팝오버·관리자 회원 표가
// 이곳을 참조한다. (등급은 현재 마이페이지/관리자에서만 노출하며, 게시글·댓글엔 표시하지 않는다.)
//
// ⚠️ enum 상수명(ASHIGARU…)은 과거 사무라이 테마의 잔재이며, 백엔드와의 계약이라 그대로
// 유지한다. 사용자에게 보이는 값은 label 뿐이므로 상수명은 신경 쓰지 않아도 된다.
export interface GradeMeta {
  value: UserGrade
  label: string    // 한글 이름 (예: "우수 회원")
  tier: string     // 아주 짧은 계층 표기 — 마이페이지 등급명 옆 보조 설명
  meaning: string  // 등급의 의미 — 등급 설명 팝오버(사다리)에 표시
  badge: string    // 뱃지 배경·글자 색 (light + dark) — 관리자 회원 표
  dot: string      // 사다리 목록에서 쓰는 단색 점 색
}

// ⚠️ 배열 순서 = 낮은 등급 → 높은 등급. 사다리 UI가 이 순서를 그대로 사용한다.
export const GRADES: GradeMeta[] = [
  {
    value: 'ASHIGARU',
    label: '일반 회원',
    tier: '기본 등급',
    meaning: '가입하면 누구나 갖는 기본 등급',
    badge: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
    dot: 'bg-neutral-400',
  },
  {
    value: 'SAMURAI',
    label: '우수 회원',
    tier: '활동 등급',
    meaning: '꾸준한 활동으로 커뮤니티에 기여한 회원',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  {
    value: 'HATAMOTO',
    label: '특별 회원',
    tier: '우대 등급',
    meaning: '활발한 활동과 신뢰를 쌓은 회원',
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    dot: 'bg-sky-500',
  },
  {
    value: 'DAIMYO',
    label: '대표 회원',
    tier: '최상위 등급',
    meaning: '커뮤니티를 대표하는 최상위 회원',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
    dot: 'bg-violet-500',
  },
  {
    value: 'SHOGUN',
    label: '운영진',
    tier: '운영 등급',
    meaning: '커뮤니티를 관리하는 운영 담당자',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
]

// 알 수 없는 값이 와도(백엔드 enum 추가 등) 최소한 최하위 등급으로 안전하게 폴백한다.
export const gradeMeta = (grade: UserGrade): GradeMeta =>
  GRADES.find(g => g.value === grade) ?? GRADES[0]
