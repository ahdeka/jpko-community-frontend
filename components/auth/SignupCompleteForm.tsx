'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { useAuth } from '@/lib/auth-context'
import { MESSAGES } from '@/lib/messages'
import RedirectingOverlay from './RedirectingOverlay'
import { inputClass, NICKNAME_RE, LOGINID_RE, PasswordToggle, AgreementRow } from './_shared'

type FieldName =
  | 'loginId'
  | 'password'
  | 'passwordConfirm'
  | 'nickname'
  | 'termsAgreed'
  | 'privacyAgreed'
type FieldErrors = Partial<Record<FieldName, string>>

// 토큰 검증 결과. verifying → (성공)ready / (실패)invalid.
type Phase = 'verifying' | 'ready' | 'invalid'

// 신규 회원가입 2단계 화면. 메일 링크(/signup/{token})가 연다.
//   ① 토큰 검증(GET /signup/verify) → 묶인 이메일 확인
//   ② 아이디·닉네임·비밀번호·약관 입력(POST /signup/complete) → 자동 로그인 → 홈
export default function SignupCompleteForm({ token }: { token: string }) {
  const router = useRouter()
  const { fetchUser, notifyCheckInResult } = useAuth()

  const [phase, setPhase] = useState<Phase>(token ? 'verifying' : 'invalid')
  const [linkError, setLinkError] = useState(token ? '' : MESSAGES.auth.signup.invalidLink)
  const [email, setEmail] = useState('')

  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [nickname, setNickname] = useState('')
  const [termsAgreed, setTermsAgreed] = useState(false)
  const [privacyAgreed, setPrivacyAgreed] = useState(false)

  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErrors, setServerErrors] = useState<FieldErrors>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  // 제출 성공 후 리다이렉트 진행 중 표시.
  const [redirecting, setRedirecting] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)

  // React 19 dev(Strict Mode)에서 effect 두 번 실행 시 verify가 중복 호출되는 것을 막는다.
  // verify는 읽기전용이라 두 번 불러도 토큰이 소비되진 않지만, 불필요한 왕복을 줄인다.
  const requested = useRef(false)

  useEffect(() => {
    if (!token || requested.current) return
    requested.current = true

    authApi
      .verifySignupToken(token)
      .then((res) => {
        setEmail(res.data?.email ?? '')
        setPhase('ready')
      })
      .catch((err) => {
        setPhase('invalid')
        if (err instanceof ApiError && err.code === 'EXPIRED_VERIFICATION_TOKEN') {
          setLinkError(MESSAGES.auth.signup.expiredLink)
        } else {
          setLinkError(MESSAGES.auth.signup.invalidLink)
        }
      })
  }, [token])

  // 클라이언트 검증(현재 입력값에서 매 렌더 파생). 백엔드 SignupCompleteRequest @Valid + 규칙 미러링.
  const clientErrors = useMemo<FieldErrors>(() => {
    const errs: FieldErrors = {}

    // 아이디: 소문자·숫자·언더바 4~20자. 백엔드가 trim().toLowerCase() 후 검사하므로 동일 기준.
    const trimmedLoginId = loginId.trim().toLowerCase()
    if (!trimmedLoginId) {
      errs.loginId = MESSAGES.auth.signup.loginIdRequired
    } else if (!LOGINID_RE.test(trimmedLoginId)) {
      errs.loginId = MESSAGES.auth.signup.loginIdPattern
    }

    if (!password) {
      errs.password = MESSAGES.auth.signup.passwordRequired
    } else if (password.length < 8) {
      errs.password = MESSAGES.auth.signup.passwordTooShort
    }

    if (!passwordConfirm) {
      errs.passwordConfirm = MESSAGES.auth.signup.passwordConfirmRequired
    } else if (password && password !== passwordConfirm) {
      errs.passwordConfirm = MESSAGES.auth.signup.passwordMismatch
    }

    const trimmedNickname = nickname.trim()
    if (!trimmedNickname) {
      errs.nickname = MESSAGES.auth.signup.nicknameRequired
    } else if (trimmedNickname.length < 2 || trimmedNickname.length > 20) {
      errs.nickname = MESSAGES.auth.signup.nicknameLength
    } else if (!NICKNAME_RE.test(trimmedNickname)) {
      errs.nickname = MESSAGES.auth.signup.nicknamePattern
    }

    if (!termsAgreed) errs.termsAgreed = MESSAGES.auth.signup.termsRequired
    if (!privacyAgreed) errs.privacyAgreed = MESSAGES.auth.signup.privacyRequired

    return errs
  }, [loginId, password, passwordConfirm, nickname, termsAgreed, privacyAgreed])

  const allAgreed = termsAgreed && privacyAgreed
  function toggleAll() {
    const next = !allAgreed
    setTermsAgreed(next)
    setPrivacyAgreed(next)
  }

  function visibleError(field: FieldName): string | undefined {
    if (serverErrors[field]) return serverErrors[field]
    if (touched[field] || submitted) return clientErrors[field]
    return undefined
  }

  function markTouched(field: FieldName) {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  function clearServerError(field: FieldName) {
    setServerErrors(prev => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const passwordMatched =
    passwordConfirm.length > 0 && password === passwordConfirm && !visibleError('passwordConfirm')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    setApiError('')

    if (Object.keys(clientErrors).length > 0) return

    setLoading(true)
    try {
      const res = await authApi.signupComplete({
        token,
        loginId: loginId.trim().toLowerCase(),
        password,
        passwordConfirm,
        nickname: nickname.trim(),
        termsAgreed,
        privacyAgreed,
      })
      // 가입 완료 = 자동 로그인. 인증 상태를 갱신하고 홈으로 이동한다.
      setRedirecting(true)
      await fetchUser()
      if (res.data?.checkIn) notifyCheckInResult(res.data.checkIn)
      router.replace('/')
    } catch (err) {
      setLoading(false)
      if (err instanceof ApiError) {
        // 토큰 만료/무효는 폼 안에서 고칠 수 없으므로 링크 오류 화면으로 전환한다.
        if (err.code === 'EXPIRED_VERIFICATION_TOKEN') {
          setPhase('invalid')
          setLinkError(MESSAGES.auth.signup.expiredLink)
        } else if (err.code === 'INVALID_VERIFICATION_TOKEN') {
          setPhase('invalid')
          setLinkError(MESSAGES.auth.signup.invalidLink)
        } else if (err.code === 'DUPLICATE_EMAIL') {
          // 검증~완료 사이에 같은 이메일이 먼저 가입된 경우. 필드가 아니라 공통 영역에 안내.
          setApiError(MESSAGES.auth.signup.duplicateEmail)
        } else if (err.code === 'DUPLICATE_LOGIN_ID') {
          setServerErrors(prev => ({ ...prev, loginId: MESSAGES.auth.signup.duplicateLoginId }))
        } else if (err.code === 'DUPLICATE_NICKNAME') {
          setServerErrors(prev => ({ ...prev, nickname: MESSAGES.auth.signup.duplicateNickname }))
        } else if (err.code === 'PASSWORD_MISMATCH') {
          setServerErrors(prev => ({ ...prev, passwordConfirm: MESSAGES.auth.signup.passwordMismatch }))
        } else {
          setApiError(err.message || MESSAGES.auth.signup.genericError)
        }
      } else {
        setApiError(MESSAGES.auth.signup.genericError)
      }
    }
  }

  if (redirecting) {
    return <RedirectingOverlay />
  }

  if (phase === 'verifying') {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <Spinner />
        <p className="text-sm text-neutral-600 dark:text-neutral-300">{MESSAGES.auth.signup.verifyingLink}</p>
      </div>
    )
  }

  if (phase === 'invalid') {
    return (
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <WarnIcon />
        <div>
          <h1 className="text-lg font-bold">{MESSAGES.auth.signup.invalidLinkTitle}</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{linkError}</p>
        </div>
        <Link
          href="/signup"
          className="w-full rounded bg-blue-600 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          회원가입 다시 하기
        </Link>
      </div>
    )
  }

  // phase === 'ready'
  const loginIdError = visibleError('loginId')
  const passwordError = visibleError('password')
  const passwordConfirmError = visibleError('passwordConfirm')
  const nicknameError = visibleError('nickname')
  const termsError = visibleError('termsAgreed')
  const privacyError = visibleError('privacyAgreed')

  return (
    <>
      <h1 className="mb-6 text-center text-xl font-bold">회원가입</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {/* 토큰에 묶인 이메일(수정 불가). 인증된 주소임을 명확히 보여준다. */}
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
            이메일 (인증 완료)
          </label>
          <input
            type="email"
            value={email}
            readOnly
            className={`${inputClass} cursor-not-allowed bg-neutral-100 dark:bg-neutral-800`}
          />
        </div>

        <div>
          <input
            type="text"
            placeholder="아이디 (영문 소문자·숫자·언더바 4~20자)"
            value={loginId}
            onChange={e => {
              setLoginId(e.target.value)
              clearServerError('loginId')
            }}
            onBlur={() => markTouched('loginId')}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="username"
            className={inputClass}
          />
          {loginIdError && <p className="mt-1 text-xs text-red-500">{loginIdError}</p>}
        </div>

        <div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호 (8자 이상)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onBlur={() => markTouched('password')}
              autoComplete="new-password"
              className={`${inputClass} pr-10`}
            />
            <PasswordToggle visible={showPassword} onToggle={() => setShowPassword(v => !v)} />
          </div>
          {passwordError && <p className="mt-1 text-xs text-red-500">{passwordError}</p>}
        </div>

        <div>
          <div className="relative">
            <input
              type={showPasswordConfirm ? 'text' : 'password'}
              placeholder="비밀번호 확인"
              value={passwordConfirm}
              onChange={e => {
                setPasswordConfirm(e.target.value)
                clearServerError('passwordConfirm')
              }}
              onBlur={() => markTouched('passwordConfirm')}
              autoComplete="new-password"
              className={`${inputClass} ${passwordMatched ? 'pr-16' : 'pr-10'}`}
            />
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
              {passwordMatched && (
                <svg className="h-4 w-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
              <PasswordToggle
                visible={showPasswordConfirm}
                onToggle={() => setShowPasswordConfirm(v => !v)}
                positioned={false}
              />
            </div>
          </div>
          {passwordConfirmError && <p className="mt-1 text-xs text-red-500">{passwordConfirmError}</p>}
          {passwordMatched && !passwordConfirmError && (
            <p className="mt-1 text-xs text-green-600 dark:text-green-500">
              {MESSAGES.auth.signup.passwordMatched}
            </p>
          )}
        </div>

        <div>
          <input
            type="text"
            placeholder="닉네임 (2~20자)"
            value={nickname}
            onChange={e => {
              setNickname(e.target.value)
              clearServerError('nickname')
            }}
            onBlur={() => markTouched('nickname')}
            className={inputClass}
          />
          {nicknameError && <p className="mt-1 text-xs text-red-500">{nicknameError}</p>}
        </div>

        {/* 약관·개인정보 동의 */}
        <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
          <label className="flex cursor-pointer select-none items-center gap-2">
            <input
              type="checkbox"
              checked={allAgreed}
              onChange={toggleAll}
              className="h-4 w-4 accent-blue-600"
            />
            <span className="text-sm font-medium">전체 동의</span>
          </label>

          <div className="my-2.5 border-t border-neutral-200 dark:border-neutral-800" />

          <AgreementRow
            checked={termsAgreed}
            onChange={() => setTermsAgreed(v => !v)}
            error={termsError}
            href="/terms"
            label="이용약관"
          />
          <div className="mt-2">
            <AgreementRow
              checked={privacyAgreed}
              onChange={() => setPrivacyAgreed(v => !v)}
              error={privacyError}
              href="/privacy"
              label="개인정보처리방침"
            />
          </div>
        </div>

        {apiError && <p className="text-xs text-red-500">{apiError}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? '가입 중…' : '회원가입 완료'}
        </button>
      </form>
    </>
  )
}

function Spinner() {
  return (
    <svg className="h-8 w-8 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
  )
}

function WarnIcon() {
  return (
    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/15">
      <svg className="h-7 w-7 text-amber-600 dark:text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </span>
  )
}
