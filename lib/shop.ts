import type { ShopItemType, UserRole } from '@/types'

// 상점 표시 메타데이터의 단일 출처. lib/point.ts(TRANSACTION_TYPES)와 같은 패턴 —
// API 호출과 분리된 순수 표시 로직만 모은다.

export interface ShopItemTypeMeta {
  value: ShopItemType
  label: string
  badge: string
}

export const SHOP_ITEM_TYPES: ShopItemTypeMeta[] = [
  {
    value: 'BLOCK',
    label: '차단권',
    badge: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  },
  {
    value: 'ROLE_AUCTION',
    label: '권한 경매',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  },
  {
    value: 'SHIELD',
    label: '방어권',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  },
]

export const shopItemTypeMeta = (type: ShopItemType): ShopItemTypeMeta =>
  SHOP_ITEM_TYPES.find(t => t.value === type) ?? SHOP_ITEM_TYPES[0]

// 경매 대상 role의 한글 표시명. 현재 백엔드는 ROOT를 경매 대상으로 등록하지 못하게 막아
// 사실상 ADMIN만 오지만, 방어적으로 모든 UserRole을 다룬다.
const ROLE_LABELS: Record<UserRole, string> = {
  USER: '일반 회원',
  ADMIN: '관리자 권한',
  ROOT: '최고 관리자 권한',
}

export const roleLabel = (role: UserRole): string => ROLE_LABELS[role]
