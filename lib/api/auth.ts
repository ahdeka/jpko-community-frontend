import { apiClient } from './client'
import { LoginResponse, User } from '@/types'

// 가입 전 인증 토큰 검증 응답 (백엔드 PreSignupVerifyResponse와 1:1).
// 메일 링크로 진입한 회원가입 완료 화면이, 토큰에 묶인 이메일을 확인/표시하기 위해 받는다.
export interface PreSignupVerify {
  email: string
}

export const authApi = {

  // ===== 신규 회원가입 (2단계: 이메일 인증 → 가입 완료) =====

  // 1단계. 이메일 + Turnstile 토큰으로 가입 전 이메일 인증 메일을 요청한다.
  // 백엔드는 항상 성공 문구를 주지만, 중복/도메인/보안문자 실패는 4xx로 온다.
  // 실패 code: DUPLICATE_EMAIL(409), INVALID_EMAIL_DOMAIN(400 - MX 없음), TURNSTILE 실패(400).
  signupInit: (body: {
    email: string
    turnstileToken: string
  }) => apiClient.post<void>('/api/auth/signup/init', body),

  // 2단계 진입. 메일 링크(/signup/{token})가 여는 완료 화면이 호출한다.
  // 토큰이 유효하면 그 토큰에 묶인 이메일을 돌려준다(화면에 표시용).
  // 실패 code: INVALID_VERIFICATION_TOKEN, EXPIRED_VERIFICATION_TOKEN.
  verifySignupToken: (token: string) =>
    apiClient.get<PreSignupVerify>(`/api/auth/signup/verify?token=${encodeURIComponent(token)}`),

  // 2단계 완료. 아이디·닉네임·비밀번호·약관동의를 담아 가입을 확정한다.
  // 성공 시 백엔드가 accessToken·refreshToken 쿠키를 함께 내려주고(자동 로그인),
  // body에는 로그인과 동일한 LoginResponse가 담긴다. 실제 인증 상태는 /api/auth/me로 확정한다.
  // 실패 code: EXPIRED_VERIFICATION_TOKEN, INVALID_VERIFICATION_TOKEN, DUPLICATE_EMAIL,
  //           DUPLICATE_LOGIN_ID, DUPLICATE_NICKNAME, PASSWORD_MISMATCH.
  signupComplete: (body: {
    token: string
    loginId: string
    password: string
    passwordConfirm: string
    nickname: string
    // 백엔드 SignupCompleteRequest의 @AssertTrue 필드. 둘 다 true여야 가입이 통과된다.
    termsAgreed: boolean
    privacyAgreed: boolean
  }) => apiClient.post<LoginResponse>('/api/auth/signup/complete', body),

  // ===== 로그인 =====

  // 로그인 식별자는 아이디 또는 이메일 둘 다 허용한다(백엔드가 loginId → email 순으로 조회).
  // 응답 body에는 출첵 결과(checkIn)와 계정 전환 필요 여부(needsOnboarding)가 함께 담겨 온다.
  // 실제 인증 상태는 이 body가 아니라 /api/auth/me(fetchUser)로 확정한다.
  //
  // turnstileToken: Cloudflare Turnstile 1회용 토큰. 백엔드 LoginRequest의 @NotBlank를 미러링한다.
  // 백엔드는 비밀번호 검증보다 *먼저* 이 토큰을 siteverify로 검증하므로, 비밀번호를 틀린 요청에서도
  // 토큰은 이미 소진된다 → 실패 시 호출부가 반드시 위젯을 리셋해 새 토큰을 받아야 한다.
  // 실패 code: WRONG_PASSWORD, USER_NOT_FOUND, CAPTCHA_FAILED(토큰 소진·만료·위조),
  //           INVALID_INPUT(토큰이 비어 Bean Validation에서 걸린 경우).
  login: (body: {
    loginId: string
    password: string
    turnstileToken: string
  }) => apiClient.post<LoginResponse>('/api/auth/login', body),

  me: () =>
    apiClient.get<User>('/api/auth/me'),

  logout: () =>
    apiClient.post<void>('/api/auth/logout'),

  refresh: () =>
    apiClient.post<void>('/api/auth/refresh'),

  // ===== 기존 유저 온보딩(마이그레이션) =====
  // 흐름: (미인증 유저) 새 이메일 등록·인증 → (인증 완료 후) 아이디·비밀번호 설정.
  // ⚠️ 마이그레이션이 끝나면 백엔드와 함께 정리될 API.

  // 온보딩 1단계(이메일 미인증 유저). 인증받을 새 이메일을 등록하고 인증 메일을 요청한다.
  // 백엔드가 그 이메일을 토큰에 보관했다가, 링크 확인 시점에 계정 이메일로 교체 + 인증 처리한다.
  // 실패 code: ALREADY_VERIFIED_EMAIL(409), DUPLICATE_EMAIL(409), INVALID_EMAIL_DOMAIN(400).
  requestEmailChange: (email: string) =>
    apiClient.patch<void>('/api/auth/email', { email }),

  // 이메일 변경(EMAIL_CHANGE) 링크(/verify-email-change?token=)가 여는 페이지가 호출한다.
  // 성공하면 그 이메일이 계정 이메일로 등록되고 emailVerified=true가 된다.
  // 실패 code: INVALID_VERIFICATION_TOKEN, EXPIRED_VERIFICATION_TOKEN, DUPLICATE_EMAIL.
  confirmEmailChange: (token: string) =>
    apiClient.post<void>(`/api/auth/email/confirm?token=${encodeURIComponent(token)}`),

  // 온보딩 2단계(이메일 인증 완료 유저). 아이디·비밀번호를 설정해 계정 전환을 마친다.
  // 성공하면 isFullyOnboarded=true가 되어 needsOnboarding이 해제된다.
  // 실패 code: EMAIL_VERIFICATION_REQUIRED(403 - 인증 먼저), ALREADY_ASSIGN_LOGIN_ID(409),
  //           DUPLICATE_LOGIN_ID(409), PASSWORD_MISMATCH(400).
  completeOnboarding: (body: {
    loginId: string
    password: string
    passwordConfirm: string
  }) => apiClient.patch<void>('/api/auth/complete-onboarding', body),

  // ===== 이메일 인증 (기존 계정의 현재 이메일 재인증용) =====

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
