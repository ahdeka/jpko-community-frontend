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

  // ===== 이메일 인증 =====

  // 로그인한 사용자가 자기 계정으로 인증 메일 발송을 요청한다(body 없음, 쿠키로 사용자 식별).
  // 실패 code: ALREADY_VERIFIED_EMAIL(409), INVALID_EMAIL_DOMAIN(400 - MX 레코드 없음).
  requestEmailVerification: () =>
    apiClient.post<void>('/api/auth/email-verification/request'),

  // 비로그인 상태에서 이메일로 인증 메일 재발송을 요청한다.
  // 계정 열거(enumeration) 방지를 위해 가입/인증 여부와 무관하게 항상 200을 준다.
  resendEmailVerification: (email: string) =>
    apiClient.post<void>('/api/auth/email-verification/resend', { email }),

  // 메일 링크가 여는 /verify-email 페이지가 호출한다. 토큰은 query string으로 전달.
  // 실패 code: INVALID_VERIFICATION_TOKEN, EXPIRED_VERIFICATION_TOKEN.
  confirmEmailVerification: (token: string) =>
    apiClient.post<void>(`/api/auth/email-verification/confirm?token=${encodeURIComponent(token)}`),

  // ===== 비밀번호 재설정 =====

  // 이메일로 재설정 링크 발송을 요청한다.
  // 계정 열거 방지를 위해 가입/인증 여부와 무관하게 항상 200을 준다(프론트는 성공/실패를 구분할 수 없음).
  requestPasswordReset: (email: string) =>
    apiClient.post<void>('/api/auth/password-reset/request', { email }),

  // 메일 링크가 여는 /reset-password 페이지가 호출한다.
  // 실패 code: INVALID_VERIFICATION_TOKEN, EXPIRED_VERIFICATION_TOKEN, PASSWORD_MISMATCH.
  confirmPasswordReset: (body: {
    token: string
    newPassword: string
    newPasswordConfirm: string
  }) => apiClient.post<void>('/api/auth/password-reset/confirm', body),
}