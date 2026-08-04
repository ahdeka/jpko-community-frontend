'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { authApi } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { useRedirectIfAuthenticated } from '@/lib/use-auth-guard'
import { MESSAGES } from '@/lib/messages'
import RedirectingOverlay from './RedirectingOverlay'
import Turnstile, { type TurnstileHandle } from './Turnstile'
import { inputClass } from './_shared'

type FieldName = 'email' | 'turnstile'
type FieldErrors = Partial<Record<FieldName, string>>

// 신규 회원가입 1단계 화면.
//   이메일 + 보안문자(Turnstile) → POST /api/auth/signup/init → 인증 메일 발송.
// 실제 가입(아이디·닉네임·비밀번호)은 메일 링크(/signup/{token})가 여는 2단계에서 마무리한다.
export default function SignupInitForm() {
  // 이미 로그인한 사용자는 홈으로 돌려보낸다(뒤로가기·주소창 직접 진입 차단).
  const { blocked } = useRedirectIfAuthenticated()

  const [email, setEmail] = useState('')
  // Cloudflare Turnstile 통과 시 발급되는 1회용 토큰. 백엔드 @NotBlank 미러링.
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileRef = useRef<TurnstileHandle>(null)

  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<FieldErrors>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  // 발송 완료 화면. 메일을 보낸 주소를 함께 보여준다.
  const [sentTo, setSentTo] = useState<string | null>(null)

  // 클라이언트 검증(현재 입력값에서 매 렌더 파생). 백엔드 SignupInitRequest @Valid 미러링.
  const clientErrors = useMemo<FieldErrors>(() => {
    const errs: FieldErrors = {}
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      errs.email = MESSAGES.auth.signupInit.emailRequired
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = MESSAGES.auth.signupInit.emailInvalid
    }
    if (!turnstileToken) {
      errs.turnstile = MESSAGES.auth.signupInit.turnstileRequired
    }
    return errs
  }, [email, turnstileToken])

  function visibleError(field: FieldName): string | undefined {
    if (serverError[field]) return serverError[field]
    if (touched[field] || submitted) return clientErrors[field]
    return undefined
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    setApiError('')

    if (Object.keys(clientErrors).length > 0) return

    setLoading(true)
    const normalizedEmail = email.trim().toLowerCase()
    try {
      await authApi.signupInit({ email: normalizedEmail, turnstileToken })
      setSentTo(normalizedEmail)
    } catch (err) {
      // 제출 실패 시 방금 쓴 Turnstile 토큰은 소비/무효화된 것으로 본다(1회용). 위젯을 리셋해 새 챌린지를 돌린다.
      setTurnstileToken('')
      turnstileRef.current?.reset()
      if (err instanceof ApiError) {
        if (err.code === 'DUPLICATE_EMAIL') {
          setServerError({ email: MESSAGES.auth.signupInit.duplicateEmail })
        } else if (err.code === 'INVALID_EMAIL_DOMAIN') {
          setServerError({ email: MESSAGES.auth.signupInit.invalidDomain })
        } else {
          setApiError(err.message || MESSAGES.auth.signupInit.genericError)
        }
      } else {
        setApiError(MESSAGES.auth.signupInit.genericError)
      }
    } finally {
      setLoading(false)
    }
  }

  if (blocked) {
    return <RedirectingOverlay />
  }

  // 발송 완료 화면. (재전송은 이메일을 그대로 두고 다시 제출하면 되므로 별도 버튼 대신 안내만 노출)
  if (sentTo) {
    return (
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <MailIcon />
        <div>
          <h1 className="text-lg font-bold">{MESSAGES.auth.signupInit.sentTitle}</h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
            <strong className="break-all">{sentTo}</strong>
          </p>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
            {MESSAGES.auth.signupInit.sentInstructionPrefix}
            <strong>{MESSAGES.auth.signupInit.sentInstructionEmphasis}</strong>
            {MESSAGES.auth.signupInit.sentInstructionSuffix}
          </p>
        </div>
        <div className="w-full rounded-md bg-neutral-50 px-3 py-2 text-xs text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
          <p>{MESSAGES.auth.signupInit.spamHint}</p>
          <p className="mt-1">{MESSAGES.auth.signupInit.linkValidity}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            // 다른 이메일로 다시 시도. 위젯 토큰은 만료됐을 수 있어 상태를 초기화한다.
            setSentTo(null)
            setTurnstileToken('')
            setSubmitted(false)
            turnstileRef.current?.reset()
          }}
          className="text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          다른 이메일로 다시 시도
        </button>
      </div>
    )
  }

  const emailError = visibleError('email')
  const turnstileError = visibleError('turnstile')

  return (
    <>
      <h1 className="mb-2 text-center text-xl font-bold">회원가입</h1>
      <p className="mb-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
        가입하실 이메일을 입력하면 인증 메일을 보내드립니다.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div>
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={e => {
              setEmail(e.target.value)
              setServerError({})
            }}
            onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
            autoComplete="email"
            className={inputClass}
          />
          {emailError && <p className="mt-1 text-xs text-red-500">{emailError}</p>}
        </div>

        {/* 봇 방지(Cloudflare Turnstile). 통과 시 토큰을 저장하고, 만료/오류 시 비운다. */}
        <div>
          <Turnstile
            ref={turnstileRef}
            onVerify={setTurnstileToken}
            onExpire={() => setTurnstileToken('')}
            onError={() => setTurnstileToken('')}
          />
          {turnstileError && <p className="mt-1 text-xs text-red-500">{turnstileError}</p>}
        </div>

        {apiError && <p className="text-xs text-red-500">{apiError}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? '전송 중…' : '인증 메일 받기'}
        </button>

        <p className="text-center text-xs text-gray-500 dark:text-neutral-400">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400">
            로그인
          </Link>
        </p>
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
