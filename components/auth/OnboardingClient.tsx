'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { useAuth } from '@/lib/auth-context'
import { MESSAGES } from '@/lib/messages'
import RedirectingOverlay from './RedirectingOverlay'
import { inputClass, LOGINID_RE, PasswordToggle } from './_shared'

// 기존 유저 온보딩(마이그레이션) 화면.
//
// 진입 조건: 로그인 상태 + needsOnboarding=true. (전역 가드가 이 페이지로 강제 이동시킨다)
// 단계는 계정 상태로 결정한다.
//   - 이메일 미인증(시나리오 A/C): 새 이메일 등록·인증 → 인증 완료되면 다음 단계로.
//   - 이메일 인증 완료(시나리오 B, 또는 A/C 인증 후): 아이디·비밀번호 설정 → 전환 완료.
//
// 상태 판단은 전적으로 useAuth().user 에 의존한다. 다른 탭에서 이메일 인증을 마치면
// user.emailVerified가 바뀌므로, 창이 포커스를 되찾을 때마다 /me를 다시 받아 동기화한다.
export default function OnboardingClient() {
  const { user, isLoading, fetchUser } = useAuth()
  const router = useRouter()

  // 다른 탭/기기에서 이메일 인증을 마쳤을 수 있으니, 창 포커스 복귀 시 최신 상태를 받아온다.
  useEffect(() => {
    function onFocus() {
      fetchUser()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [fetchUser])

  // 비로그인 → 로그인 화면. 이미 전환 완료(needsOnboarding=false) → 홈.
  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace('/login')
    } else if (!user.needsOnboarding) {
      router.replace('/')
    }
  }, [isLoading, user, router])

  // 판단 보류(로딩) 또는 이동 대상(비로그인/전환완료)일 때는 폼 대신 오버레이만 보여준다.
  if (isLoading || !user || !user.needsOnboarding) {
    return <RedirectingOverlay />
  }

  return user.emailVerified
    ? <CredentialsStep fetchUser={fetchUser} />
    : <EmailStep fetchUser={fetchUser} />
}

// ─────────────────────────────────────────────────────────────────────────
// 1단계: 인증받을 이메일 등록 (이메일 미인증 유저)
// ─────────────────────────────────────────────────────────────────────────
function EmailStep({ fetchUser }: { fetchUser: () => Promise<void> }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  // 인증 메일을 보낸 주소. null이면 아직 입력 단계.
  const [sentTo, setSentTo] = useState<string | null>(null)
  // "인증 완료했어요"를 눌러 확인했으나 아직 미인증인 경우.
  const [checking, setChecking] = useState(false)
  const [stillWaiting, setStillWaiting] = useState(false)

  const emailError = useMemo(() => {
    const trimmed = email.trim()
    if (!trimmed) return MESSAGES.auth.onboarding.emailRequired
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return MESSAGES.auth.onboarding.emailInvalid
    return ''
  }, [email])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (emailError) {
      setError(emailError)
      return
    }

    setLoading(true)
    const normalized = email.trim().toLowerCase()
    try {
      await authApi.requestEmailChange(normalized)
      setSentTo(normalized)
      setStillWaiting(false)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'ALREADY_VERIFIED_EMAIL') {
          // 다른 탭에서 이미 인증을 마친 경우. 최신 상태를 받아오면 부모가 2단계로 넘어간다.
          await fetchUser()
          return
        }
        if (err.code === 'DUPLICATE_EMAIL') {
          setError(MESSAGES.auth.onboarding.duplicateEmail)
        } else if (err.code === 'INVALID_EMAIL_DOMAIN') {
          setError(MESSAGES.auth.onboarding.invalidDomain)
        } else {
          setError(err.message || MESSAGES.auth.onboarding.emailGenericError)
        }
      } else {
        setError(MESSAGES.auth.onboarding.emailGenericError)
      }
    } finally {
      setLoading(false)
    }
  }

  // "인증 완료했어요" — 최신 상태를 받아온다. 인증됐으면 부모가 2단계로 전환하고,
  // 아직이면 안내 문구를 노출한다.
  async function handleCheckVerified() {
    setChecking(true)
    setStillWaiting(false)
    try {
      await fetchUser()
      // fetchUser로 emailVerified가 true가 되면 이 컴포넌트는 언마운트되므로 아래는 미인증일 때만 실행된다.
      setStillWaiting(true)
    } finally {
      setChecking(false)
    }
  }

  if (sentTo) {
    return (
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <MailIcon />
        <div>
          <h1 className="text-lg font-bold">{MESSAGES.auth.onboarding.emailSentTitle}</h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
            <strong className="break-all">{sentTo}</strong>
            {MESSAGES.auth.onboarding.emailSentSuffix}
          </p>
          <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            {MESSAGES.auth.onboarding.emailSentContinue}
          </p>
        </div>

        {stillWaiting && (
          <p className="w-full rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
            {MESSAGES.auth.onboarding.stillNotVerified}
          </p>
        )}

        <button
          type="button"
          onClick={handleCheckVerified}
          disabled={checking}
          className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {checking ? '확인 중…' : MESSAGES.auth.onboarding.refreshAfterVerify}
        </button>
        <button
          type="button"
          onClick={() => {
            setSentTo(null)
            setStillWaiting(false)
            setError('')
          }}
          className="text-sm text-neutral-500 hover:underline dark:text-neutral-400"
        >
          다른 이메일로 다시 등록
        </button>
      </div>
    )
  }

  return (
    <>
      <h1 className="mb-2 text-center text-xl font-bold">{MESSAGES.auth.onboarding.introTitle}</h1>
      <p className="mb-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
        {MESSAGES.auth.onboarding.introEmailStep}
      </p>
      <form onSubmit={handleSend} className="flex flex-col gap-4" noValidate>
        <div>
          <input
            type="email"
            placeholder="인증받을 이메일"
            value={email}
            onChange={e => {
              setEmail(e.target.value)
              setError('')
            }}
            autoComplete="email"
            className={inputClass}
          />
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? '전송 중…' : '인증 메일 받기'}
        </button>
      </form>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// 2단계: 아이디·비밀번호 설정 (이메일 인증 완료 유저)
// ─────────────────────────────────────────────────────────────────────────
type CredField = 'loginId' | 'password' | 'passwordConfirm'
type CredErrors = Partial<Record<CredField, string>>

function CredentialsStep({ fetchUser }: { fetchUser: () => Promise<void> }) {
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

  const [touched, setTouched] = useState<Partial<Record<CredField, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [serverErrors, setServerErrors] = useState<CredErrors>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)

  const clientErrors = useMemo<CredErrors>(() => {
    const errs: CredErrors = {}
    const trimmedLoginId = loginId.trim().toLowerCase()
    if (!trimmedLoginId) {
      errs.loginId = MESSAGES.auth.onboarding.loginIdRequired
    } else if (!LOGINID_RE.test(trimmedLoginId)) {
      errs.loginId = MESSAGES.auth.onboarding.loginIdPattern
    }
    if (!password) {
      errs.password = MESSAGES.auth.onboarding.passwordRequired
    } else if (password.length < 8) {
      errs.password = MESSAGES.auth.onboarding.passwordTooShort
    }
    if (!passwordConfirm) {
      errs.passwordConfirm = MESSAGES.auth.onboarding.passwordConfirmRequired
    } else if (password && password !== passwordConfirm) {
      errs.passwordConfirm = MESSAGES.auth.onboarding.passwordMismatch
    }
    return errs
  }, [loginId, password, passwordConfirm])

  function visibleError(field: CredField): string | undefined {
    if (serverErrors[field]) return serverErrors[field]
    if (touched[field] || submitted) return clientErrors[field]
    return undefined
  }

  function markTouched(field: CredField) {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  function clearServerError(field: CredField) {
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
      await authApi.completeOnboarding({
        loginId: loginId.trim().toLowerCase(),
        password,
        passwordConfirm,
      })
      // 전환 완료 → 최신 상태를 받아오면 needsOnboarding=false가 되어
      // 부모(OnboardingClient)가 홈으로 리다이렉트한다. loading은 유지해 폼 재활성을 막는다.
      await fetchUser()
    } catch (err) {
      setLoading(false)
      if (err instanceof ApiError) {
        if (err.code === 'DUPLICATE_LOGIN_ID') {
          setServerErrors(prev => ({ ...prev, loginId: MESSAGES.auth.onboarding.duplicateLoginId }))
        } else if (err.code === 'PASSWORD_MISMATCH') {
          setServerErrors(prev => ({ ...prev, passwordConfirm: MESSAGES.auth.onboarding.passwordMismatch }))
        } else if (err.code === 'EMAIL_VERIFICATION_REQUIRED') {
          // 경쟁 상태(인증이 아직 반영 안 됨). 최신 상태를 받아와 1단계로 되돌린다.
          setApiError(MESSAGES.auth.onboarding.emailVerificationRequired)
          await fetchUser()
        } else if (err.code === 'ALREADY_ASSIGN_LOGIN_ID') {
          // 다른 탭에서 이미 전환을 마친 경우. 최신 상태를 받아오면 홈으로 넘어간다.
          await fetchUser()
        } else {
          setApiError(err.message || MESSAGES.auth.onboarding.genericError)
        }
      } else {
        setApiError(MESSAGES.auth.onboarding.genericError)
      }
    }
  }

  const loginIdError = visibleError('loginId')
  const passwordError = visibleError('password')
  const passwordConfirmError = visibleError('passwordConfirm')

  return (
    <>
      <h1 className="mb-2 text-center text-xl font-bold">{MESSAGES.auth.onboarding.introTitle}</h1>
      <p className="mb-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
        {MESSAGES.auth.onboarding.introLoginIdStep}
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
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
              placeholder="새 비밀번호 (8자 이상)"
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
              placeholder="새 비밀번호 확인"
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
              {MESSAGES.auth.onboarding.passwordMatched}
            </p>
          )}
        </div>

        {apiError && <p className="text-xs text-red-500">{apiError}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? '전환 중…' : '계정 전환 완료'}
        </button>
      </form>
    </>
  )
}

function MailIcon() {
  return (
    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/15">
      <svg className="h-7 w-7 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    </span>
  )
}
