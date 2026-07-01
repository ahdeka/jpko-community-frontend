import { apiClient } from './client'
import { User } from '@/types'

export const authApi = {

  signup: (body: {
    email: string
    password: string
    passwordConfirm: string
    nickname: string
    // 백엔드 SignupRequest의 @AssertTrue 필드. 둘 다 true여야 가입이 통과된다.
    termsAgreed: boolean
    privacyAgreed: boolean
  }) => apiClient.post<void>('/api/auth/signup', body),

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