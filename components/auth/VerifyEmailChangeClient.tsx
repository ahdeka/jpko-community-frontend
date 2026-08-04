'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { authApi } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { useAuth } from '@/lib/auth-context'
import { MESSAGES } from '@/lib/messages'

type Status = 'verifying' | 'success' | 'error'

// 이메일 변경/등록(EMAIL_CHANGE) 인증 링크(/verify-email-change?token=)가 여는 결과 화면.
// 온보딩 1단계에서 등록한 이메일을 확정(계정 이메일 교체 + emailVerified=true)한다.
// 인증 자체는 토큰 기반이라 로그인 여부와 무관하게 동작한다.
export default function VerifyEmailChangeClient({ token }: { token: string }) {
  const { user, fetchUser } = useAuth()

  const [status, setStatus] = useState<Status>(token ? 'verifying' : 'error')
  const [errorMsg, setErrorMsg] = useState(token ? '' : MESSAGES.auth.emailChange.missingToken)

  // 토큰은 1회용이라 두 번째 호출은 항상 실패한다. StrictMode 이중 실행을 반드시 가드한다.
  const requested = useRef(false)

  useEffect(() => {
    if (!token || requested.current) return
    requested.current = true

    authApi
      .confirmEmailChange(token)
      .then(async () => {
        setStatus('success')
        // 같은 브라우저에서 로그인 상태라면 emailVerified를 즉시 갱신한다.
        // 비로그인(401)이면 fetchUser 내부에서 조용히 무시된다.
        await fetchUser()
      })
      .catch((e) => {
        setStatus('error')
        if (e instanceof ApiError) {
          if (e.code === 'EXPIRED_VERIFICATION_TOKEN') {
            setErrorMsg(MESSAGES.auth.emailChange.expiredToken)
          } else if (e.code === 'DUPLICATE_EMAIL') {
            setErrorMsg(MESSAGES.auth.emailChange.duplicateEmail)
          } else {
            setErrorMsg(MESSAGES.auth.emailChange.invalidToken)
          }
        } else {
          setErrorMsg(MESSAGES.auth.emailChange.invalidToken)
        }
      })
  }, [token, fetchUser])

  if (status === 'verifying') {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <Spinner />
        <p className="text-sm text-neutral-600 dark:text-neutral-300">{MESSAGES.auth.emailChange.verifying}</p>
      </div>
    )
  }

  if (status === 'success') {
    // 인증만 끝났을 뿐 아직 계정 전환(아이디·비밀번호 설정)이 남아 있으므로 온보딩으로 이어준다.
    // 이 브라우저에서 비로그인 상태라면 온보딩 진입 시 로그인이 필요하므로 로그인으로 보낸다.
    const continueHref = user ? '/onboarding' : '/login'
    return (
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <CheckIcon />
        <div>
          <h1 className="text-lg font-bold">{MESSAGES.auth.emailChange.successTitle}</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
            {MESSAGES.auth.emailChange.successDescription}
          </p>
        </div>
        <Link
          href={continueHref}
          className="mt-1 w-full rounded bg-blue-600 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          {MESSAGES.auth.emailChange.continueOnboarding}
        </Link>
      </div>
    )
  }

  // status === 'error'
  return (
    <div className="flex flex-col items-center gap-4 py-2 text-center">
      <WarnIcon />
      <div>
        <h1 className="text-lg font-bold">{MESSAGES.auth.emailChange.failTitle}</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{errorMsg}</p>
      </div>
      <Link
        href={user ? '/onboarding' : '/login'}
        className="w-full rounded bg-blue-600 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700"
      >
        {MESSAGES.auth.emailChange.continueOnboarding}
      </Link>
    </div>
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

function CheckIcon() {
  return (
    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/15">
      <svg className="h-7 w-7 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
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
