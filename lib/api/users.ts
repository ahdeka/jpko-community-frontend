import { apiClient } from './client'
import { PageResponse, MyPost, MyComment } from '@/types'

// 마이페이지 관련 API. 모든 엔드포인트는 로그인(쿠키) 필수이며,
// apiClient가 credentials:'include'로 호출하므로 브라우저 쿠키가 자동 전송된다.
export const usersApi = {
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

  // 비밀번호 변경
  updatePassword: (body: {
    currentPassword: string
    newPassword: string
    newPasswordConfirm: string
  }) => apiClient.patch<void>('/api/users/me/password', body),
}
