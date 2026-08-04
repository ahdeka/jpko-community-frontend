import { apiClient } from './client'
import {
  PageResponse, AdminUser, UserStatus, UserGrade,
  BlockAppeal, RolePurchaseAdmin, ShopItem, CreateShopItemBody, UpdateShopItemBody,
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
  //  - suspendedUntil: 정지 기한. 경매(권한 경매)로 획득한 ADMIN 권한이 정지시키는 경우 필수이며
  //    없으면 SUSPEND_DURATION_REQUIRED, 최대 허용 기간을 넘기면 SUSPEND_DURATION_TOO_LONG.
  //    진짜 ADMIN/ROOT는 생략하면 지금처럼 무기한 정지된다.
  updateStatus: (userId: number, status: Exclude<UserStatus, 'DELETED'>, suspendedUntil?: string) =>
    apiClient.patch<void>(`/api/admin/users/${userId}/status`, {
      status,
      ...(suspendedUntil && { suspendedUntil }),
    }),

  // 등급 변경.
  // 백엔드 제약:
  //  - 탈퇴 계정 대상 불가(ALREADY_WITHDRAWN)
  //  - SHOGUN은 role === 'ADMIN' 계정에만 부여 가능(SHOGUN_REQUIRES_ADMIN_ROLE)
  updateGrade: (userId: number, grade: UserGrade) =>
    apiClient.patch<void>(`/api/admin/users/${userId}/grade`, { grade }),

  // 차단 이의제기 목록 (ADMIN/ROOT).
  getBlockAppeals: (handled: boolean, page = 0, size = 20) =>
    apiClient.get<PageResponse<BlockAppeal>>(
      `/api/admin/shop/block-appeals?handled=${handled}&page=${page}&size=${size}`,
    ),

  // 이의제기 처리완료 표시 (ADMIN/ROOT).
  markAppealHandled: (appealId: number) =>
    apiClient.patch<void>(`/api/admin/shop/block-appeals/${appealId}`),

  // 경매로 ADMIN 권한을 보유 중인 유저 현황 (ADMIN/ROOT) — 임시 관리자 남용 감시용.
  getRolePurchases: (page = 0, size = 20) =>
    apiClient.get<PageResponse<RolePurchaseAdmin>>(`/api/admin/shop/role-purchases?page=${page}&size=${size}`),

  // 이하 상점 카탈로그 관리는 백엔드에서 hasRole('ROOT')로 보호된다 (ADMIN도 접근 불가).
  getShopItems: () =>
    apiClient.get<ShopItem[]>('/api/admin/shop/items'),

  createShopItem: (body: CreateShopItemBody) =>
    apiClient.post<void>('/api/admin/shop/items', body),

  updateShopItem: (itemId: number, body: UpdateShopItemBody) =>
    apiClient.patch<void>(`/api/admin/shop/items/${itemId}`, body),
}
