import { apiClient } from './client'
import { User } from '@/types'

export const authApi = {

  signup: (body: {
    email: string
    password: string
    passwordConfirm: string
    nickname: string
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