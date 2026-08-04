import { apiClient } from './client'
import {
  PageResponse, AdminUser, UserStatus,
  BlockAppeal, RolePurchaseAdmin, ShopItem, CreateShopItemBody, UpdateShopItemBody,
  UpdateRoleAuctionRoundBody, SuspendDurationPreset, CreateSuspendDurationPresetBody,
} from '@/types'

// 관리자 전용 회원 관리 API.
// 모든 엔드포인트는 백엔드에서 @PreAuthorize("hasRole('ADMIN')")로 보호되며,
// apiClient가 credentials:'include'로 호출하므로 관리자 세션 쿠키가 자동 전송된다.
// (프론트의 /admin 레이아웃 가드는 UX용이고, 최종 방어선은 서버다.)
export const adminApi = {
  // 회원 목록 — 닉네임/이메일 부분검색(keyword) + 최신 가입순 페이징.
  // keyword가 비어 있으면 아예 파라미터를 생략해 전체 목록을 받는다(백엔드 required=false).
  getUsers: (keyword = '', page = 0, size = 20) => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
      sort: 'createdAt,desc',
    })
    const trimmed = keyword.trim()
    if (trimmed) params.set('keyword', trimmed)
    return apiClient.get<PageResponse<AdminUser>>(`/api/admin/users?${params.toString()}`)
  },

  // 계정 상태 변경 (ACTIVE ↔ SUSPENDED).
  // 백엔드 제약:
  //  - DELETED는 지정 불가(INVALID_INPUT), 탈퇴 계정 대상 불가(ALREADY_WITHDRAWN)
  //  - ROOT 계정은 정지 불가(CANNOT_SUSPEND_ROOT)
  //  - SUSPENDED 전환 시 서버가 해당 유저의 refresh token을 삭제(전 기기 로그아웃)
  //  - suspendedUntil: 정지 기한. 정지시키는 계정이 ADMIN이면 필수이며(경매로 얻었든 수동 임명이든
  //    상관없이) 없으면 SUSPEND_DURATION_REQUIRED, 최대 허용 기간을 넘기면 SUSPEND_DURATION_TOO_LONG.
  //    ROOT만 생략하면 무기한 정지된다 — 진짜 관리자는 ROOT뿐이라는 원칙.
  updateStatus: (userId: number, status: Exclude<UserStatus, 'DELETED'>, suspendedUntil?: string) =>
    apiClient.patch<void>(`/api/admin/users/${userId}/status`, {
      status,
      ...(suspendedUntil && { suspendedUntil }),
    }),

  // ROOT 전용 즉시 권한 박탈. 대상이 ADMIN이 아니면 백엔드가 TARGET_NOT_ADMIN으로 거부한다.
  // 경매로 얻은 권한이면 그 RolePurchase를 즉시 만료시키고, 수동 임명이었으면 USER로 되돌린다.
  revokeAdmin: (userId: number) =>
    apiClient.post<void>(`/api/admin/users/${userId}/revoke-admin`),

  // 정지 기한 프리셋 목록 — 정지 모달(SuspendUserModal)을 여는 어떤 관리자든 조회 가능(hasAnyRole('ADMIN','ROOT')).
  getSuspendPresets: () =>
    apiClient.get<SuspendDurationPreset[]>('/api/admin/settings/suspend-presets'),

  // 프리셋 구성(추가/삭제)은 ROOT 전용.
  createSuspendPreset: (body: CreateSuspendDurationPresetBody) =>
    apiClient.post<void>('/api/admin/settings/suspend-presets', body),

  deleteSuspendPreset: (presetId: number) =>
    apiClient.delete<void>(`/api/admin/settings/suspend-presets/${presetId}`),

  // 이하 전부 ROOT 전용(백엔드가 hasRole('ROOT')로 보호, ADMIN도 접근 불가) — 감시·관리 대상이
  // ADMIN 자신일 수 있어 동료 ADMIN에게는 노출/허용하지 않는다.

  // 차단 이의제기 목록.
  getBlockAppeals: (handled: boolean, page = 0, size = 20) =>
    apiClient.get<PageResponse<BlockAppeal>>(
      `/api/admin/shop/block-appeals?handled=${handled}&page=${page}&size=${size}`,
    ),

  // 이의제기 처리완료 표시.
  markAppealHandled: (appealId: number) =>
    apiClient.patch<void>(`/api/admin/shop/block-appeals/${appealId}`),

  // 경매로 ADMIN 권한을 보유 중인 유저 현황 — 임시 관리자 남용 감시용.
  getRolePurchases: (page = 0, size = 20) =>
    apiClient.get<PageResponse<RolePurchaseAdmin>>(`/api/admin/shop/role-purchases?page=${page}&size=${size}`),

  // 상점 카탈로그 관리.
  getShopItems: () =>
    apiClient.get<ShopItem[]>('/api/admin/shop/items'),

  createShopItem: (body: CreateShopItemBody) =>
    apiClient.post<void>('/api/admin/shop/items', body),

  updateShopItem: (itemId: number, body: UpdateShopItemBody) =>
    apiClient.patch<void>(`/api/admin/shop/items/${itemId}`, body),

  // 진행 중인 경매 회차의 종료 시각을 직접 수정(연장)하거나 조기 종료한다.
  // endAt이 현재/과거 시각이면 백엔드가 즉시 정산까지 처리한다(스케줄러의 다음 tick을 기다리지 않음).
  updateRoleAuctionRound: (roundId: number, body: UpdateRoleAuctionRoundBody) =>
    apiClient.patch<void>(`/api/admin/shop/role-auctions/${roundId}`, body),
}
