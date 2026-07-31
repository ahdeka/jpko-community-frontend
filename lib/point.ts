import type { PointTransaction, TransactionType } from '@/types'

// 포인트 거래 유형 표시 메타데이터의 단일 출처.
// 백엔드는 enum 상수로만 내려주므로 한글 표기·색상은 프론트가 관리한다.
// (lib/report.ts, lib/grade.ts와 같은 패턴)

export interface TransactionTypeMeta {
  value: TransactionType
  label: string   // 뱃지 텍스트
  badge: string   // 뱃지 배경·글자 색 (light + dark)
}

export const TRANSACTION_TYPES: TransactionTypeMeta[] = [
  {
    value: 'GRANT',
    label: '지급',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
  {
    value: 'COLLECT',
    label: '차감',
    badge: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  },
  {
    value: 'ACCOUNT_OPENED',
    label: '계좌 개설',
    badge: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
  },
  {
    value: 'ROULETTE',
    label: '포인트 룰렛',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  },
]

export const transactionTypeMeta = (type: TransactionType): TransactionTypeMeta =>
  TRANSACTION_TYPES.find(t => t.value === type) ?? TRANSACTION_TYPES[0]

// 거래 1건을 "내 시점"에서 어떻게 보여줄지 계산한 결과.
export interface TransactionDisplay {
  signedAmountLabel: string        // "+500P" | "-300P" | "0P"
  colorClass: string               // 금액 색 (light+dark)
  description: string              // "포인트 룰렛 승리" | "포인트 룰렛 피해" | "지급받음" | "차감됨" | "계좌 개설"
  counterpartLabel: string | null  // "OO님으로부터" / "OO님에게" — 시스템이 상대면 null
}

// myUserId 시점에서 거래 1건을 해석한다.
// ROULETTE는 sender/recipient가 항상 유저 대 유저(시스템 경유)라 방향에 따라 승리/피해가 갈리고,
// GRANT/COLLECT는 상대가 항상 시스템이라 counterpart가 없으며,
// ACCOUNT_OPENED는 금액 이동이 없는 감사 로그라 항상 중립(0P) 처리한다.
export function describeTransaction(tx: PointTransaction, myUserId: number): TransactionDisplay {
  const isRecipient = tx.recipientId === myUserId

  switch (tx.type) {
    case 'ROULETTE':
      return isRecipient
        ? {
            signedAmountLabel: `+${tx.amount.toLocaleString()}P`,
            colorClass: 'text-emerald-600 dark:text-emerald-400',
            description: '포인트 룰렛 승리',
            counterpartLabel: tx.senderNickname ? `${tx.senderNickname}님으로부터` : null,
          }
        : {
            signedAmountLabel: `-${tx.amount.toLocaleString()}P`,
            colorClass: 'text-red-600 dark:text-red-400',
            description: '포인트 룰렛 피해',
            counterpartLabel: tx.recipientNickname ? `${tx.recipientNickname}님에게` : null,
          }
    case 'GRANT':
      return {
        signedAmountLabel: `+${tx.amount.toLocaleString()}P`,
        colorClass: 'text-emerald-600 dark:text-emerald-400',
        description: '지급받음',
        counterpartLabel: null,
      }
    case 'COLLECT':
      return {
        signedAmountLabel: `-${tx.amount.toLocaleString()}P`,
        colorClass: 'text-red-600 dark:text-red-400',
        description: '차감됨',
        counterpartLabel: null,
      }
    case 'ACCOUNT_OPENED':
      return {
        signedAmountLabel: '0P',
        colorClass: 'text-neutral-400 dark:text-neutral-500',
        description: '포인트 계좌가 개설되었습니다',
        counterpartLabel: null,
      }
  }
}
