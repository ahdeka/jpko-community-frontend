import { apiClient } from './client'
import type {
  BlockAppealBody,
  BlockStatus,
  PlaceBidBody,
  PurchaseBlockBody,
  PurchaseShieldBody,
  RoleAuctionRound,
  RolePurchaseStatus,
  RouletteShieldStatus,
  ShopItem,
} from '@/types'

// 상점(임시 활동 차단권 + ADMIN 권한 경매) API. 조회/구매는 로그인 필수이며,
// apiClient가 credentials:'include'로 호출하므로 쿠키가 자동 전송된다.
export const shopApi = {
  // 구매 가능한 상품 카탈로그 (BLOCK/ROLE_AUCTION 전체, active만).
  getItems: () =>
    apiClient.get<ShopItem[]>('/api/shop/items'),

  // 대상 유저에게 차단권 사용.
  purchaseBlock: (body: PurchaseBlockBody) =>
    apiClient.post<void>('/api/shop/blocks', body),

  // 내 차단 상태. 차단 중인 계정도 예외적으로 호출 가능한 경로다(client.ts의 ACTIVITY_BLOCKED 인터셉트 대상 제외).
  getMyBlockStatus: () =>
    apiClient.get<BlockStatus>('/api/shop/blocks/me'),

  // 포인트를 지불하고 본인 차단을 즉시 해제. 차단 중인 계정도 호출 가능.
  unblockSelf: () =>
    apiClient.post<void>('/api/shop/blocks/me/unblock'),

  // 관리자에게 이의제기 메시지 전송. 차단 중인 계정도 호출 가능.
  appeal: (body: BlockAppealBody) =>
    apiClient.post<void>('/api/shop/blocks/me/appeal', body),

  // 현재 진행 중인 권한 경매 회차 목록.
  getCurrentRounds: () =>
    apiClient.get<RoleAuctionRound[]>('/api/shop/role-auctions/current'),

  // 입찰(또는 기존 입찰 인상). amount는 최저가/기존 입찰가보다 높아야 한다.
  placeBid: (roundId: number, body: PlaceBidBody) =>
    apiClient.post<void>(`/api/shop/role-auctions/${roundId}/bids`, body),

  // 입찰 취소 — 예탁된 포인트가 즉시 환불된다.
  cancelBid: (roundId: number) =>
    apiClient.delete<void>(`/api/shop/role-auctions/${roundId}/bids`),

  // 내 권한 경매 낙찰(보유) 현황. 관리자 정지 화면에서 "경매로 얻은 ADMIN인지" 판단할 때도 재사용한다.
  getMyRoleStatus: () =>
    apiClient.get<RolePurchaseStatus>('/api/shop/role-auctions/me'),

  // 룰렛 방어권 구매. 대상 유저 없이 본인에게 즉시 적용되어 룰렛 동의가 취소된다.
  purchaseShield: (body: PurchaseShieldBody) =>
    apiClient.post<void>('/api/shop/shields', body),

  // 내 방어권 보유 현황.
  getMyShieldStatus: () =>
    apiClient.get<RouletteShieldStatus>('/api/shop/shields/me'),
}
