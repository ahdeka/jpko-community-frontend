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

const REFRESH_ENDPOINT = '/api/auth/refresh'

// 재발급까지 실패한 401(세션 만료)을 브라우저 전역에 알리는 이벤트 이름.
// client.ts는 React 밖이라 Context를 직접 못 건드리므로, AuthProvider가 이 이벤트를 구독해 로그인 상태를 정리한다.
export const SESSION_EXPIRED_EVENT = 'auth:session-expired'

// 이 엔드포인트들의 401은 "액세스 토큰 만료"가 아니라 그 자체가 정상적인 인증 응답이므로
// 재발급 재시도 대상에서 제외한다.
//  - refresh: 여기서 재발급을 다시 부르면 무한 재귀가 된다(엣지케이스 ①).
//  - login/logout/signup/email-verification/password-reset: 비밀번호 오류·비로그인 등이라 재발급이 무의미.
// 반면 /api/auth/me는 "세션 유지"의 핵심이라 재시도 대상으로 남긴다(그래서 명시적으로 제외).
function isAuthFlow(endpoint: string): boolean {
  return endpoint.startsWith('/api/auth/') && !endpoint.startsWith('/api/auth/me')
}

// refresh 시도 결과를 3가지로 구분한다.
//  - 'refreshed'   : 재발급 성공 → 원래 요청을 재시도할 수 있다.
//  - 'unauthorized': refreshToken도 만료/무효(refresh가 4xx 응답) → 세션 만료 확정.
//  - 'error'       : 네트워크/타임아웃 등으로 refresh 요청 자체가 실패 → 세션 만료로 단정하지 않는다.
type RefreshResult = 'refreshed' | 'unauthorized' | 'error'

// 진행 중인 refresh 요청을 하나로 공유(single-flight)하기 위한 모듈 레벨 상태.
// 동시에 여러 요청이 401을 받아도 refresh는 딱 한 번만 나가고, 나머지는 그 결과를 기다린다(엣지케이스 ②).
// 브라우저에서만 사용하므로 서버(RSC) 요청 간에 공유될 일은 없다.
let refreshPromise: Promise<RefreshResult> | null = null

// refreshToken 쿠키로 새 accessToken 재발급을 시도한다.
// 반드시 raw fetch로 호출한다 — request()를 거치지 않으므로 refresh가 401이어도
// 다시 refresh를 부르는 재귀가 원천적으로 불가능하다(엣지케이스 ①).
function refreshAccessToken(): Promise<RefreshResult> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE_URL}${REFRESH_ENDPOINT}`, {
      method: 'POST',
      credentials: 'include',
      signal: AbortSignal.timeout(10_000),
    })
      // 응답을 받았으면 성공(2xx)/인증거부(그 외)를 구분한다. 응답 자체가 없으면(throw) 네트워크 오류다.
      .then((res): RefreshResult => (res.ok ? 'refreshed' : 'unauthorized'))
      .catch((): RefreshResult => 'error')
      // 성공이든 실패든 상태를 비워, 다음 401은 새 refresh를 시작할 수 있게 한다.
      .finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

async function request<T>(
  endpoint: string,
  options?: RequestInit,
  // 내부 전용 플래그. 재발급 후 재시도한 요청에는 false를 넘겨, 그 응답이 또 401이어도
  // 다시 재발급하지 않고 그대로 에러를 던진다 — "재시도는 정확히 1회"(엣지케이스 ③).
  retry = true,
): Promise<ApiResponse<T>> {

  if (!BASE_URL) {
    throw new Error('NEXT_PUBLIC_API_URL 환경 변수가 설정되지 않았습니다.')
  }

  const { headers: extraHeaders, signal, ...restOptions } = options ?? {}

  const isFormData = restOptions.body instanceof FormData

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...restOptions,
    headers: {
      ...(!isFormData && restOptions.body !== undefined && { 'Content-Type': 'application/json' }),
      ...extraHeaders,
    },
    credentials: 'include',
    signal: signal ?? AbortSignal.timeout(10_000),
  })

  if (!response.ok) {
    // accessToken 만료(401)면 브라우저에서 1회에 한해 재발급 후 원래 요청을 재시도한다.
    // 서버(RSC)에서는 백엔드 Set-Cookie가 브라우저로 전달되지 않아 재발급이 무의미하므로 제외한다.
    if (
      response.status === 401 &&
      retry &&
      typeof window !== 'undefined' &&
      !isAuthFlow(endpoint)
    ) {
      const result = await refreshAccessToken()
      if (result === 'refreshed') {
        // 재발급 성공 → 브라우저 accessToken 쿠키가 갱신된 상태. 같은 요청을 딱 한 번 재시도.
        // (body가 string/FormData라 동일 옵션으로 재전송해도 안전하다.)
        return request<T>(endpoint, options, false)
      }
      if (result === 'unauthorized') {
        // refreshToken도 만료/무효 → 세션 만료 확정. 전역에 알려, 살아있던 로그인 상태(Context)를
        // 즉시 정리하게 한다. 이 처리가 없으면 "쿠키는 사라졌는데 헤더는 로그인 상태"인 불일치가 남는다.
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
      }
      // 'error'(네트워크/타임아웃)는 세션 만료로 단정하지 않는다 — 일시적 장애로 로그아웃되는 것을 막는다.
      // 어느 경우든 아래로 떨어져 원래의 401 에러를 그대로 던지므로, 호출부의 개별 처리도 그대로 동작한다.
    }

    // 기본 메시지. 413은 nginx(client_max_body_size)가 백엔드에 닿기 전에 끊은 것이라
    // 응답 본문이 우리 API의 JSON이 아니라 nginx의 HTML이다. 아래 json() 파싱이 실패해
    // "요청에 실패했습니다."로 뭉뚱그려지면 용량 문제라는 걸 알 수 없으므로 여기서 구분해준다.
    let message =
      response.status === 413
        ? '파일 용량이 너무 큽니다. 더 작은 파일로 다시 시도해주세요.'
        : '요청에 실패했습니다.'
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
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
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

  // DELETE도 body를 실을 수 있게 한다(회원 탈퇴처럼 서버가 @RequestBody로 비밀번호를 요구하는 경우).
  // 기존 호출부는 모두 endpoint만 넘기므로 body 인자 추가는 하위 호환된다.
  // body가 있으면 request()가 Content-Type: application/json을 자동으로 붙인다.
  delete: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'DELETE',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
}