import { apiClient } from './client'
import { User } from '@/types'

export const authApi = {

  // 회원가입 성공 시 백엔드가 accessToken·refreshToken 쿠키를 함께 내려주고(자동 로그인),
  // 응답 body에는 로그인과 동일한 요약 정보(LoginResponse: nickname, role)가 담긴다.
  // 실제 인증 상태는 이 body가 아니라 /api/auth/me(fetchUser)로 확정하므로, 호출부는 body를 소비하지 않아도 된다.
  signup: (body: {
    email: string
    password: string
    passwordConfirm: string
    nickname: string
    // 백엔드 SignupRequest의 @AssertTrue 필드. 둘 다 true여야 가입이 통과된다.
    termsAgreed: boolean
    privacyAgreed: boolean
  }) => apiClient.post<{ nickname: string; role: User['role'] }>('/api/auth/signup', body),

  login: (body: {
    email: string
    password: string
  }) => apiClient.post<void>('/api/auth/login', body),

  me: () =>
    apiClient.get<User>('/api/auth/me'),

  logout: () =>
    apiClient.post<void>('/api/auth/logout'),

  refresh: () =>
    apiClient.post<void>('/api/auth/refresh'),
}