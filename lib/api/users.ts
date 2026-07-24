import { apiClient } from './client'
import { PageResponse, MyPost, MyComment, PublicProfile, UserPost } from '@/types'

// 마이페이지 관련 API. 대부분의 엔드포인트는 로그인(쿠키) 필수이며,
// apiClient가 credentials:'include'로 호출하므로 브라우저 쿠키가 자동 전송된다.
// 예외로 공개 프로필 조회(by-nickname)는 백엔드에서 permitAll이라 비로그인도 호출 가능하다.
export const usersApi = {
  // ===== 공개 프로필 (비로그인 허용) =====

  // 닉네임으로 공개 프로필 조회. 없는/탈퇴 유저는 404(USER_NOT_FOUND).
  // 닉네임에 특수문자는 없지만(백엔드 @Pattern) 방어적으로 인코딩한다.
  getPublicProfile: (nickname: string, options?: RequestInit) =>
    apiClient.get<PublicProfile>(
      `/api/users/by-nickname/${encodeURIComponent(nickname)}`,
      options
    ),

  // 특정 유저가 쓴 공개 글 목록 (최신순 페이징). 익명 글은 백엔드에서 제외된다.
  getUserPosts: (nickname: string, page = 0, size = 10, options?: RequestInit) =>
    apiClient.get<PageResponse<UserPost>>(
      `/api/users/by-nickname/${encodeURIComponent(nickname)}/posts?page=${page}&size=${size}&sort=createdAt,desc`,
      options
    ),

  // ===== 마이페이지 (로그인 필수) =====

  // 내가 쓴 글 (최신순 페이징)
  getMyPosts: (page = 0, size = 10) =>
    apiClient.get<PageResponse<MyPost>>(
      `/api/users/me/posts?page=${page}&size=${size}&sort=createdAt,desc`
    ),

  // 내가 쓴 댓글 (최신순 페이징)
  getMyComments: (page = 0, size = 10) =>
    apiClient.get<PageResponse<MyComment>>(
      `/api/users/me/comments?page=${page}&size=${size}&sort=createdAt,desc`
    ),

  // 닉네임 변경
  updateNickname: (nickname: string) =>
    apiClient.patch<void>('/api/users/me/nickname', { nickname }),

  // 자기소개(bio) 변경. 빈 문자열을 보내면 백엔드가 trim 후 null로 정규화한다(= 삭제).
  // @Size(max=200) 검증이 있으므로 프론트도 200자 상한을 함께 건다.
  updateBio: (bio: string) =>
    apiClient.patch<void>('/api/users/me/bio', { bio }),

  // 비밀번호 변경
  updatePassword: (body: {
    currentPassword: string
    newPassword: string
    newPasswordConfirm: string
  }) => apiClient.patch<void>('/api/users/me/password', body),

  // 회원 탈퇴. 본인 확인용으로 현재 비밀번호를 함께 보낸다.
  // 성공 시 백엔드가 응답에서 accessToken·refreshToken 쿠키를 삭제하므로
  // 프론트는 클라이언트 로그인 상태만 비워주면 된다.
  // 실패 code: WRONG_PASSWORD(비밀번호 불일치), ALREADY_WITHDRAWN(이미 탈퇴).
  withdraw: (password: string) =>
    apiClient.delete<void>('/api/users/me', { password }),
}
