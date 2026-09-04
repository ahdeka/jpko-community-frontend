import type { UserLevelInfo } from '@/types'

// 유저 레벨 표시 정책의 단일 출처.
// 백엔드는 숫자(level/exp)만 내려주므로 구간 이름·색상은 프론트가 관리한다.
// (lib/point.ts, lib/report.ts와 같은 패턴)
//
// ⚠️ 백엔드 LevelPolicy는 `level = floor(exp / 500)`인 선형 정책이고 **상한이 없다**.
//    그래서 최상위 구간(elite)은 반드시 열린 구간(30 이상 전부)이어야 한다.
//    구간을 닫아버리면 Lv.50 유저가 어느 구간에도 속하지 못해 스타일이 비게 된다.
//
// 색 선택 기준:
//  - novice(0~9): 가입 직후 전원이 여기 속하고 목록에 가장 많이 도배되므로, 유일하게 무채색으로 둬
//    시선을 뺏지 않는다. 레벨이 "생기는" 느낌은 regular부터 시작한다.
//  - AdminBadge(amber 채움) / RootBadge(violet→fuchsia)와 절대 겹치지 않게 골랐다.
//    elite가 amber를 쓰긴 하지만 '검정 배경 + amber 글자/링'이라 amber로 꽉 찬 운영진 뱃지와
//    한눈에 구분되고, 운영진 뱃지에는 왕관 아이콘과 "운영진" 텍스트가 함께 있어 혼동되지 않는다.
//  - 단색(novice/regular) → 그라데이션(veteran) → 그라데이션+링(elite)으로 질감을 한 단계씩 올려
//    RootBadge가 AdminBadge보다 위라는 걸 질감으로 드러내는 기존 문법을 그대로 따른다.

export type LevelTier = 'novice' | 'regular' | 'veteran' | 'elite'

export interface LevelTierStyle {
  tier: LevelTier
  // 구간 이름. 뱃지 툴팁과 마이페이지 레벨 카드에 노출된다.
  label: string
  // 레벨 뱃지의 배경·글자색 (라이트/다크)
  badge: string
  // 마이페이지 진행바의 채움 색
  bar: string
  // 마이페이지 레벨 숫자 강조색
  text: string
}

// 구간 정의. minLevel 내림차순으로 두고 위에서부터 처음 맞는 것을 고른다.
// (마지막 novice가 minLevel 0이라 어떤 값이 와도 반드시 하나는 매칭된다 = 폴백 불필요)
const TIERS: readonly (LevelTierStyle & { minLevel: number })[] = [
  {
    minLevel: 30,
    tier: 'elite',
    label: '전설',
    badge: 'bg-neutral-900 text-amber-300 ring-1 ring-inset ring-amber-400/60 dark:bg-neutral-950 dark:text-amber-300',
    bar: 'bg-gradient-to-r from-amber-400 to-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
  },
  {
    minLevel: 20,
    tier: 'veteran',
    label: '고인물',
    badge: 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white',
    bar: 'bg-gradient-to-r from-sky-500 to-indigo-500',
    text: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    minLevel: 10,
    tier: 'regular',
    label: '주민',
    badge: 'bg-emerald-500 text-white',
    bar: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    minLevel: 0,
    tier: 'novice',
    label: '새내기',
    badge: 'bg-neutral-200 text-neutral-600 dark:bg-neutral-700/50 dark:text-neutral-300',
    bar: 'bg-neutral-400 dark:bg-neutral-500',
    text: 'text-neutral-700 dark:text-neutral-200',
  },
] as const

// 표시용으로 정규화한 레벨. 음수·소수·NaN이 들어와도 화면이 깨지지 않게 막는다.
// (백엔드는 항상 0 이상 정수를 주지만, 배포 스큐나 응답 파싱 실패로 이상값이 올 수 있다)
export function normalizeLevel(level: number): number {
  return Number.isFinite(level) ? Math.max(0, Math.floor(level)) : 0
}

export function levelTier(level: number): LevelTierStyle {
  const normalized = normalizeLevel(level)
  // minLevel 0인 novice가 항상 맨 마지막에 있어 find는 절대 undefined를 반환하지 않지만,
  // TS는 그걸 모르므로 non-null 단언 대신 마지막 원소를 명시적 폴백으로 둔다.
  return TIERS.find(t => normalized >= t.minLevel) ?? TIERS[TIERS.length - 1]
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
