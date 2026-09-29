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

  // 로그인 식별자는 아이디(loginId)뿐이다 — 이메일 로그인은 백엔드에서 제거됐다.
  // 응답 body에는 출첵 결과(checkIn)가 담겨 온다.
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

  // ===== 이메일 변경 =====
  // 이메일 인증(가입 후 재인증)·온보딩 API는 백엔드에서 제거됐고, 이메일 변경만 남았다.
  // 새 이메일로 인증 메일을 보내고, 그 메일의 링크(/verify-email-change?token=)가 교체를 확정한다.
  // ⚠️ 현재 프론트에는 requestEmailChange를 부르는 화면이 없다(온보딩 화면과 함께 제거됨).
  //    마이페이지에 이메일 변경 UI를 붙이면 그때 이 API가 다시 쓰인다.

  // 바꿀 이메일을 등록하고 인증 메일을 요청한다.
  // 백엔드가 그 이메일을 토큰에 보관했다가, 링크 확인 시점에 계정 이메일로 교체한다.
  // 실패 code: ALREADY_VERIFIED_EMAIL(409 - 지금 쓰는 이메일과 동일), DUPLICATE_EMAIL(409),
  //           INVALID_EMAIL_DOMAIN(400 - MX 레코드 없음).
  requestEmailChange: (email: string) =>
    apiClient.patch<void>('/api/auth/email', { email }),

  // 이메일 변경(EMAIL_CHANGE) 링크(/verify-email-change?token=)가 여는 페이지가 호출한다.
  // 성공하면 그 이메일이 계정 이메일로 교체된다.
  // 실패 code: INVALID_VERIFICATION_TOKEN, EXPIRED_VERIFICATION_TOKEN, DUPLICATE_EMAIL.
  confirmEmailChange: (token: string) =>
    apiClient.post<void>(`/api/auth/email/confirm?token=${encodeURIComponent(token)}`),

  // ===== 아이디/비밀번호 찾기 =====

  // 이메일 + Turnstile 토큰으로 계정 찾기 메일을 요청한다.
  // 가입 여부와 무관하게 200을 준다(계정 열거 방지) — 차이는 메일 내용에만 있다.
  //  - 가입된 이메일: 아이디 + 비밀번호 재설정 링크(/reset-password?token=, 30분 유효)
  //  - 미가입/탈퇴 이메일: "연결된 계정 없음" 안내(단, MX 레코드가 없는 도메인이면 발송 생략)
  // 실패 code: CAPTCHA_FAILED(400), INVALID_INPUT(400), EMAIL_SEND_FAILED(500).
  findAccount: (body: {
    email: string
    turnstileToken: string
  }) => apiClient.post<void>('/api/auth/find-account', body),

  // 메일 링크가 여는 /reset-password 페이지가 호출한다.
  // 실패 code: INVALID_VERIFICATION_TOKEN, EXPIRED_VERIFICATION_TOKEN, PASSWORD_MISMATCH.
  confirmPasswordReset: (body: {
    token: string
    newPassword: string
    newPasswordConfirm: string
  }) => apiClient.post<void>('/api/auth/password-reset/confirm', body),
}
