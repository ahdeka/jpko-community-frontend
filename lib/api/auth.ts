import { apiClient } from './client'
import { User } from '@/types'

export const authApi = {

  // 회원가입
  signup: (body: {
    email: string
    password: string
    nickname: string
  }) => apiClient.post<void>('/api/auth/signup', body),

  // 로그인
  login: (body: {
    email: string
    password: string
  }) => apiClient.post<User>('/api/auth/login', body),

  // 로그아웃
  logout: () =>
    apiClient.post<void>('/api/auth/logout'),

  // 토큰 갱신
  refresh: () =>
    apiClient.post<void>('/api/auth/refresh'),
}