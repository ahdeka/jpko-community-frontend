import { apiClient } from './client'
import { PageResponse, AdminUser, UserStatus, UserRole } from '@/types'

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
  //  - suspendedUntil: 정지 기한. 정지시키는 계정이 ADMIN이면 필수이며, 없으면
  //    SUSPEND_DURATION_REQUIRED, 최대 허용 기간(7일)을 넘기면 SUSPEND_DURATION_TOO_LONG.
  //    ROOT만 생략하면 무기한 정지된다 — 진짜 관리자는 ROOT뿐이라는 원칙.
  updateStatus: (userId: number, status: Exclude<UserStatus, 'DELETED'>, suspendedUntil?: string) =>
    apiClient.patch<void>(`/api/admin/users/${userId}/status`, {
      status,
      ...(suspendedUntil && { suspendedUntil }),
    }),

  // ROOT 전용 즉시 권한 박탈. 대상이 ADMIN이 아니면 백엔드가 TARGET_NOT_ADMIN으로 거부한다.
  // 백엔드는 대상을 곧바로 USER로 되돌린다.
  revokeAdmin: (userId: number) =>
    apiClient.post<void>(`/api/admin/users/${userId}/revoke-admin`),

  // ROOT 전용 권한 변경 (USER ↔ ADMIN). 관리자 임명이 이 경로로만 가능하다 —
  // 예전에는 권한 경매가 ADMIN을 만들어내는 통로였지만 그 기능이 제거됐다.
  //
  // 인자 타입에서 'ROOT'를 뺀 이유: 백엔드가 CANNOT_ASSIGN_ROOT_ROLE로 거부하는 값이라
  // 애초에 호출 자체가 불가능하도록 타입에서 막는다(updateStatus의 DELETED 제외와 같은 패턴).
  // 백엔드 제약:
  //  - 대상이 ROOT면 CANNOT_MODIFY_ROOT, 탈퇴 계정이면 ALREADY_WITHDRAWN
  //  - JwtAuthenticationFilter가 매 요청마다 role을 DB에서 다시 읽으므로, 대상이 이미
  //    로그인해 있어도 다음 요청부터 즉시 반영된다(세션 종료 불필요).
  updateRole: (userId: number, role: Exclude<UserRole, 'ROOT'>) =>
    apiClient.patch<void>(`/api/admin/users/${userId}/role`, { role }),
}
