import type { PointTransaction, TransactionType } from '@/types'

// 포인트 거래 유형 표시 메타데이터의 단일 출처.
// 백엔드는 enum 상수로만 내려주므로 한글 표기·색상은 프론트가 관리한다.
// (lib/report.ts, lib/level.ts와 같은 패턴)

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
    value: 'CHECKIN',
    label: '출첵',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  },
  {
    value: 'ROULETTE',
    label: '포인트 룰렛',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  },
  {
    value: 'ROULETTE_FEE',
    label: '룰렛 수수료',
    badge: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
  },
  {
    value: 'PACHINKO_FEE',
    label: '파칭코 수수료',
    badge: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
  },
  {
    value: 'PACHINKO',
    label: '파칭코',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  },
  {
    value: 'SLOT_FEE',
    label: '슬롯 수수료',
    badge: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
  },
  {
    value: 'SLOT',
    label: '슬롯머신',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  },
]

export const transactionTypeMeta = (type: TransactionType): TransactionTypeMeta =>
  TRANSACTION_TYPES.find(t => t.value === type) ?? TRANSACTION_TYPES[0]

// 거래 1건을 "내 시점"에서 어떻게 보여줄지 계산한 결과.
export interface TransactionDisplay {
  signedAmountLabel: string        // "+500P" | "-300P" | "0P"
  colorClass: string               // 금액 색 (light+dark)
  description: string              // "룰렛 승리" | "룰렛 피해" | "출첵 지급" | "출첵 차감" | ...
  counterpartLabel: string | null  // "OO님으로부터" / "OO님에게" — 시스템이 상대면 null
}

// myUserId 시점에서 거래 1건을 해석한다.
// ROULETTE는 sender/recipient가 항상 유저 대 유저(시스템 경유)라 방향에 따라 승리/피해가 갈리고,
// CHECKIN/PACHINKO/SLOT은 시스템이 상대라 counterpart가 없지만 방향(recipient/sender)에 따라
// 지급/차감이 갈리며, GRANT/COLLECT/*_FEE는 상대가 항상 시스템이라 counterpart가 없고,
// ACCOUNT_OPENED는 금액 이동이 없는 감사 로그라 항상 중립(0P) 처리한다.
//
// ⚠️ switch는 TransactionType union 전체를 빠짐없이 덮어야 한다. case가 빠지면 그 값에서
//    아무것도 반환하지 않아 호출부의 display.* 접근이 런타임 크래시가 된다
//    (TS가 반환 타입 불일치로 컴파일 시점에 잡아준다).
export function describeTransaction(tx: PointTransaction, myUserId: number): TransactionDisplay {
  const isRecipient = tx.recipientId === myUserId

  switch (tx.type) {
    case 'ROULETTE':
      return isRecipient
        ? {
            signedAmountLabel: `+${tx.amount.toLocaleString()}P`,
            colorClass: 'text-emerald-600 dark:text-emerald-400',
            description: '룰렛 승리',
            counterpartLabel: tx.senderNickname ? `${tx.senderNickname}님으로부터` : null,
          }
        : {
            signedAmountLabel: `-${tx.amount.toLocaleString()}P`,
            colorClass: 'text-red-600 dark:text-red-400',
            description: '룰렛 패배',
            counterpartLabel: tx.recipientNickname ? `${tx.recipientNickname}님에게` : null,
          }
    case 'CHECKIN':
      return isRecipient
        ? {
            signedAmountLabel: `+${tx.amount.toLocaleString()}P`,
            colorClass: 'text-emerald-600 dark:text-emerald-400',
            description: '출첵 지급',
            counterpartLabel: null,
          }
        : {
            signedAmountLabel: `-${tx.amount.toLocaleString()}P`,
            colorClass: 'text-red-600 dark:text-red-400',
            description: '출첵 차감',
            counterpartLabel: null,
          }
    // 현재 GRANT를 만드는 백엔드 경로는 활동 보상(게시글·댓글 작성, 내 글이 받은 좋아요) 하나뿐이라
    // 그렇게 표기한다. 어떤 활동이었는지는 백엔드가 Transaction.message에만 담고 TransactionResponse로는
    // 내려주지 않아(= 프론트에 도달하지 않아) 여기서 더 쪼갤 수 없다. 세분화하려면 응답에 message가 필요하다.
    // 일일 상한에 걸려 일부만 지급된 경우에도 amount는 "실제 지급된 액수"라 그대로 보여주면 된다.
    case 'GRANT':
      return {
        signedAmountLabel: `+${tx.amount.toLocaleString()}P`,
        colorClass: 'text-emerald-600 dark:text-emerald-400',
        description: '활동 보상',
        counterpartLabel: null,
      }
    case 'COLLECT':
      return {
        signedAmountLabel: `-${tx.amount.toLocaleString()}P`,
        colorClass: 'text-red-600 dark:text-red-400',
        description: '차감됨',
        counterpartLabel: null,
      }
    case 'ROULETTE_FEE':
      return {
        signedAmountLabel: `-${tx.amount.toLocaleString()}P`,
        colorClass: 'text-red-600 dark:text-red-400',
        description: '룰렛 수수료',
        counterpartLabel: null,
      }
    case 'ACCOUNT_OPENED':
      return {
        signedAmountLabel: '0P',
        colorClass: 'text-neutral-400 dark:text-neutral-500',
        description: '포인트 계좌가 개설되었습니다',
        counterpartLabel: null,
      }
    case 'PACHINKO':
      return isRecipient
        ? {
            signedAmountLabel: `+${tx.amount.toLocaleString()}P`,
            colorClass: 'text-emerald-600 dark:text-emerald-400',
            description: '파칭코 당첨',
            counterpartLabel: null,
          }
        : {
            signedAmountLabel: `-${tx.amount.toLocaleString()}P`,
            colorClass: 'text-red-600 dark:text-red-400',
            description: '파칭코 손실',
            counterpartLabel: null,
          }
    case 'PACHINKO_FEE':
      return {
        signedAmountLabel: `-${tx.amount.toLocaleString()}P`,
        colorClass: 'text-red-600 dark:text-red-400',
        description: '파칭코 수수료',
        counterpartLabel: null,
      }
    case 'SLOT':
      return isRecipient
        ? {
            signedAmountLabel: `+${tx.amount.toLocaleString()}P`,
            colorClass: 'text-emerald-600 dark:text-emerald-400',
            description: '슬롯 당첨',
            counterpartLabel: null,
          }
        : {
            signedAmountLabel: `-${tx.amount.toLocaleString()}P`,
            colorClass: 'text-red-600 dark:text-red-400',
            description: '슬롯 손실',
            counterpartLabel: null,
          }
    case 'SLOT_FEE':
      return {
        signedAmountLabel: `-${tx.amount.toLocaleString()}P`,
        colorClass: 'text-red-600 dark:text-red-400',
        description: '슬롯 수수료',
        counterpartLabel: null,
      }
  }
}
