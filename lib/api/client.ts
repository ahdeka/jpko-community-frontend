// lib/api/client.ts

import { ApiResponse } from '@/types'
import { MESSAGES } from '@/lib/messages'

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

// 세션 도중 계정이 정지(SUSPENDED)됐음을 브라우저 전역에 알리는 이벤트 이름.
// 관리자가 계정을 정지시키면 백엔드 JWT 필터가 매 요청마다 403 + code SUSPENDED_ACCOUNT를 준다.
// 정지된 계정도 로그인은 유지되고(SuspendAllowedPaths로 제한된 API만 계속 쓸 수 있다), AuthProvider가
// 이 이벤트를 받아 전체 화면 SuspendedScreen으로 전환한다 — 그 화면이 자체 API로 상세 정보를 조회한다
// (ActivityBlockScreen과 동일한 패턴). 세션 만료(401)와 성격이 달라 별도 이벤트로 분리한다.
export const ACCOUNT_SUSPENDED_EVENT = 'auth:account-suspended'

// 세션 도중 계정이 임시 활동 차단(#6, ACTIVITY_BLOCKED)됐음을 브라우저 전역에 알리는 이벤트 이름.
// 정지(SUSPENDED)와 달리 세션 자체는 유효하고, 백엔드가 허용한 몇 개 경로
// (/api/shop/blocks/me, .../unblock, .../appeal, /api/auth/logout)는 계속 정상 동작한다.
// 그래서 정지처럼 자동 로그아웃하지 않는다 — AuthProvider가 이 이벤트를 받아
// 전체 화면 안내(ActivityBlockScreen)를 띄우기만 한다.
export const ACTIVITY_BLOCKED_EVENT = 'auth:activity-blocked'

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

// 실패 응답(4xx/5xx)을 우리 앱의 ApiError로 변환해 던진다. fetch 경로(request)와
// XHR 경로(uploadWithProgress)가 동일한 규칙을 쓰도록 한 곳으로 모았다.
//  - bodyText: 응답 본문 원문. 우리 API면 { message, code } JSON이지만, 413은 nginx가
//    백엔드에 닿기 전에 끊어 HTML을 주므로 파싱이 실패한다 → 그 경우 용량 초과 문구로 보정한다.
//  - endpoint: 정지/차단 전역 이벤트를 auth 플로우에서는 쏘지 않기 위해(isAuthFlow) 필요.
// 반환 타입 never: 이 함수는 항상 throw하므로, 호출부 이후 코드는 도달하지 않는다.
function throwApiError(status: number, bodyText: string | null, endpoint: string): never {
  let message: string =
    status === 413 ? MESSAGES.common.fileTooLarge : MESSAGES.common.requestFailed
  let code: string | undefined

  if (bodyText) {
    try {
      const errData = JSON.parse(bodyText) as { message?: string; code?: string }
      message = errData.message ?? message
      code = errData.code
    } catch {
      // JSON이 아니면(예: nginx 413 HTML) 위에서 정한 기본 메시지를 그대로 쓴다.
    }
  }

  // 정지 계정 전역 감지 (refresh로 풀 수 없으므로 401 재시도 흐름과 분리).
  if (
    status === 403 &&
    code === 'SUSPENDED_ACCOUNT' &&
    typeof window !== 'undefined' &&
    !isAuthFlow(endpoint)
  ) {
    window.dispatchEvent(new Event(ACCOUNT_SUSPENDED_EVENT))
  }

  // 임시 활동 차단 전역 감지.
  if (
    status === 403 &&
    code === 'ACTIVITY_BLOCKED' &&
    typeof window !== 'undefined' &&
    !isAuthFlow(endpoint)
  ) {
    window.dispatchEvent(new Event(ACTIVITY_BLOCKED_EVENT))
  }

  throw new ApiError(message, status, code)
}

async function request<T>(
  endpoint: string,
  options?: RequestInit,
  // 내부 전용 플래그. 재발급 후 재시도한 요청에는 false를 넘겨, 그 응답이 또 401이어도
  // 다시 재발급하지 않고 그대로 에러를 던진다 — "재시도는 정확히 1회"(엣지케이스 ③).
  retry = true,
): Promise<ApiResponse<T>> {

  if (!BASE_URL) {
    throw new Error(MESSAGES.common.apiUrlMissing)
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

    // 응답 본문을 원문으로 읽어(한 번만 읽을 수 있으므로 text로) 공용 처리기에 넘긴다.
    // 정지/차단 전역 이벤트 발행과 413 보정, ApiError 변환을 throwApiError가 일괄 담당한다.
    const bodyText = await response.text().catch(() => null)
    throwApiError(response.status, bodyText, endpoint)
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

// 업로드 진행률(%)이 필요한 multipart POST 전용. 일반 요청은 apiClient.post를 쓰면 되지만,
// fetch는 요청 body의 업로드 진행률을 표준으로 제공하지 않으므로(브라우저 한계) 이 경로만
// XMLHttpRequest로 처리한다. 인증/에러 규칙은 request()와 동일하게 맞춘다:
//  - withCredentials로 쿠키(accessToken) 동봉
//  - 401이면 refresh 1회 후 정확히 한 번 재시도(그 재시도도 401이면 그대로 에러)
//  - 실패 응답은 throwApiError로 변환(413 보정 · 정지/차단 전역 이벤트 포함)
// onProgress는 "브라우저 → 서버 전송" 구간(0~100%)만 알린다. 100% 도달 후 서버가 동영상을
// 재인코딩하는 시간은 XHR이 알 수 없으므로, 호출부가 100% 시점에 "압축 중" 표시로 전환한다.
export function uploadWithProgress<T>(
  endpoint: string,
  formData: FormData,
  opts: {
    onProgress?: (percent: number) => void
    timeoutMs?: number
    // 내부 전용. refresh 후 재시도할 때 false로 넘겨 "재시도는 정확히 1회"를 보장한다.
    retry?: boolean
  } = {},
): Promise<ApiResponse<T>> {
  if (!BASE_URL) {
    return Promise.reject(new Error(MESSAGES.common.apiUrlMissing))
  }

  const { onProgress, timeoutMs = 10_000, retry = true } = opts

  return new Promise<ApiResponse<T>>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${BASE_URL}${endpoint}`)
    // 쿠키 기반 인증. FormData를 보내므로 Content-Type은 브라우저가 boundary와 함께
    // 자동으로 설정한다(직접 지정하면 boundary가 빠져 서버가 파싱하지 못한다).
    xhr.withCredentials = true
    xhr.timeout = timeoutMs

    if (onProgress) {
      xhr.upload.onprogress = (e: ProgressEvent) => {
        // total을 알 수 있을 때만 %를 계산한다(청크 인코딩 등으로 미상일 수 있음).
        if (e.lengthComputable && e.total > 0) {
          onProgress(Math.min(100, Math.round((e.loaded / e.total) * 100)))
        }
      }
    }

    xhr.onload = () => {
      const status = xhr.status

      if (status >= 200 && status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as ApiResponse<T>)
        } catch {
          // 2xx인데 본문이 JSON이 아닌 경우(거의 없음) — 요청 실패로 취급한다.
          reject(new ApiError(MESSAGES.common.requestFailed, status))
        }
        return
      }

      // accessToken 만료(401): 브라우저에서 1회에 한해 refresh 후 같은 업로드를 재시도한다.
      if (status === 401 && retry && typeof window !== 'undefined' && !isAuthFlow(endpoint)) {
        refreshAccessToken().then((result) => {
          if (result === 'refreshed') {
            // 재발급 성공 → 동일 FormData로 딱 한 번 재시도(XHR send는 FormData를 소비하지 않는다).
            uploadWithProgress<T>(endpoint, formData, { ...opts, retry: false }).then(resolve, reject)
            return
          }
          if (result === 'unauthorized') {
            window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
          }
          // 'unauthorized'/'error' 모두 아래와 동일하게 원래 401 에러를 던진다.
          try {
            throwApiError(status, xhr.responseText, endpoint)
          } catch (err) {
            reject(err)
          }
        })
        return
      }

      // 그 외 실패는 공용 처리기로 변환(413 보정 · 정지/차단 이벤트 · ApiError).
      try {
        throwApiError(status, xhr.responseText, endpoint)
      } catch (err) {
        reject(err)
      }
    }

    // 네트워크 단절/타임아웃은 ApiError가 아닌 일반 Error로 던져, 호출부가 상황에 맞는
    // 폴백 문구(예: "동영상 업로드에 실패했습니다")를 쓰도록 한다(기존 fetch 타임아웃과 동일한 취급).
    xhr.onerror = () => reject(new Error('network error'))
    xhr.ontimeout = () => reject(new Error('timeout'))

    xhr.send(formData)
  })
}