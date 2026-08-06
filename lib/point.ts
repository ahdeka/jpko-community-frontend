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
    value: 'TRANSFER',
    label: '송금',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  },
  {
    value: 'TRANSFER_FEE',
    label: '송금 수수료',
    badge: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
  },
  {
    value: 'BLOCK_PURCHASE',
    label: '차단권 구매',
    badge: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  },
  {
    value: 'BLOCK_UNBLOCK',
    label: '차단 해제',
    badge: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  },
  {
    value: 'BID_HOLD',
    label: '경매 입찰',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  },
  {
    value: 'BID_REFUND',
    label: '경매 환불',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
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
// CHECKIN은 시스템이 상대라 counterpart가 없지만 방향(recipient/sender)에 따라 지급/차감이 갈리며,
// GRANT/COLLECT/ROULETTE_FEE는 상대가 항상 시스템이라 counterpart가 없고,
// ACCOUNT_OPENED는 금액 이동이 없는 감사 로그라 항상 중립(0P) 처리하며,
// TRANSFER는 유저 대 유저 직접 송금이라 ROULETTE와 동일한 구조로 방향에 따라 갈리고,
// TRANSFER_FEE는 상대가 항상 시스템이지만 금액이 랜덤이라 방향이 뒤바뀔 수 있다
// (수수료가 음수로 뽑히면 시스템→유저로 보너스가 지급되어 내가 recipient가 된다).
// BLOCK_PURCHASE/BLOCK_UNBLOCK/BID_HOLD는 항상 유저→시스템(내 내역에 있다는 건 내가 sender라는 뜻)이고,
// BID_REFUND는 항상 시스템→유저라 GRANT/COLLECT처럼 방향 분기 없이 단일 케이스로 처리한다.
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
    case 'TRANSFER':
      return isRecipient
        ? {
            signedAmountLabel: `+${tx.amount.toLocaleString()}P`,
            colorClass: 'text-emerald-600 dark:text-emerald-400',
            description: '송금 받음',
            counterpartLabel: tx.senderNickname ? `${tx.senderNickname}님으로부터` : null,
          }
        : {
            signedAmountLabel: `-${tx.amount.toLocaleString()}P`,
            colorClass: 'text-red-600 dark:text-red-400',
            description: '송금 보냄',
            counterpartLabel: tx.recipientNickname ? `${tx.recipientNickname}님에게` : null,
          }
    case 'TRANSFER_FEE':
      return isRecipient
        ? {
            signedAmountLabel: `+${tx.amount.toLocaleString()}P`,
            colorClass: 'text-emerald-600 dark:text-emerald-400',
            description: '송금 수수료 환급',
            counterpartLabel: null,
          }
        : {
            signedAmountLabel: `-${tx.amount.toLocaleString()}P`,
            colorClass: 'text-red-600 dark:text-red-400',
            description: '송금 수수료',
            counterpartLabel: null,
          }
    case 'BLOCK_PURCHASE':
      return {
        signedAmountLabel: `-${tx.amount.toLocaleString()}P`,
        colorClass: 'text-red-600 dark:text-red-400',
        description: '활동 차단권 구매',
        counterpartLabel: null,
      }
    case 'BLOCK_UNBLOCK':
      return {
        signedAmountLabel: `-${tx.amount.toLocaleString()}P`,
        colorClass: 'text-red-600 dark:text-red-400',
        description: '차단 조기 해제',
        counterpartLabel: null,
      }
    case 'BID_HOLD':
      return {
        signedAmountLabel: `-${tx.amount.toLocaleString()}P`,
        colorClass: 'text-orange-600 dark:text-orange-400',
        description: '권한 경매 입찰',
        counterpartLabel: null,
      }
    case 'BID_REFUND':
      return {
        signedAmountLabel: `+${tx.amount.toLocaleString()}P`,
        colorClass: 'text-emerald-600 dark:text-emerald-400',
        description: '권한 경매 입찰 환불',
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
