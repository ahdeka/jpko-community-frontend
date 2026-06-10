// lib/api/client.ts

import { ApiResponse } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// accessToken 만료(401) 시 refreshToken으로 재발급을 시도한다.
// 동시에 여러 요청이 401을 받아도 refresh 호출은 한 번만 일어나도록 Promise를 공유한다.
let refreshPromise: Promise<boolean> | null = null

function refreshAccessToken(): Promise<boolean> {
  refreshPromise ??= fetch(`${BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then(res => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

// 이 엔드포인트들에서 발생한 401은 토큰 만료가 아닌 인증 자체의 실패이므로 재발급을 시도하지 않는다.
const REFRESH_EXEMPT_ENDPOINTS = ['/api/auth/refresh', '/api/auth/login', '/api/auth/signup']

async function request<T>(
  endpoint: string,
  options?: RequestInit,
  isRetry = false
): Promise<ApiResponse<T>> {

  if (!BASE_URL) {
    throw new Error('NEXT_PUBLIC_API_URL 환경 변수가 설정되지 않았습니다.')
  }

  const { headers: extraHeaders, signal, ...restOptions } = options ?? {}

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...restOptions,
    headers: {
      ...(restOptions.body !== undefined && { 'Content-Type': 'application/json' }),
      ...extraHeaders,
    },
    credentials: 'include',
    signal: signal ?? AbortSignal.timeout(10_000),
  })

  // 클라이언트(브라우저)에서 401을 받으면 accessToken 재발급 후 한 번만 재시도한다.
  if (
    response.status === 401 &&
    !isRetry &&
    typeof window !== 'undefined' &&
    !REFRESH_EXEMPT_ENDPOINTS.includes(endpoint)
  ) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      return request<T>(endpoint, options, true)
    }
  }

  if (!response.ok) {
    let message = '요청에 실패했습니다.'
    let code: string | undefined

    try {
      const errData: ApiResponse<T> = await response.json()
      message = errData.message ?? message
      code = errData.code
    } catch {}

    throw new ApiError(message, response.status, code)
  }

  return response.json()
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, options),

  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    }),
}