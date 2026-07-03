'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { authApi } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { useAuth } from '@/lib/auth-context'

type Status = 'verifying' | 'success' | 'error'

const inputClass =
  'w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-blue-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-blue-500'

export default function VerifyEmailClient({ token }: { token: string }) {
  const { fetchUser } = useAuth()

  const [status, setStatus] = useState<Status>(token ? 'verifying' : 'error')
  const [errorMsg, setErrorMsg] = useState(
    token ? '' : '유효하지 않은 인증 링크입니다. 메일의 링크를 다시 확인해주세요.'
  )

  // React 19 dev(Strict Mode)에서 effect가 두 번 실행돼 confirm이 중복 호출되는 것을 막는다.
  // 토큰은 1회용이라 두 번째 호출은 항상 "유효하지 않음"으로 실패하기 때문에 반드시 가드가 필요하다.
  const requested = useRef(false)

  useEffect(() => {
    if (!token || requested.current) return
    requested.current = true

    authApi
      .confirmEmailVerification(token)
      .then(async () => {
        setStatus('success')
        // 같은 브라우저에서 로그인 상태라면 헤더/마이페이지의 인증 상태(emailVerified)를 즉시 갱신.
        // 비로그인(401)이면 fetchUser 내부에서 조용히 무시되므로 안전하다.
        await fetchUser()
      })
      .catch((e) => {
        setStatus('error')
        if (e instanceof ApiError && e.code === 'EXPIRED_VERIFICATION_TOKEN') {
          setErrorMsg('인증 링크가 만료되었습니다. 아래에서 인증 메일을 다시 받아주세요.')
        } else {
          setErrorMsg('유효하지 않거나 이미 사용된 인증 링크입니다. 아래에서 인증 메일을 다시 받아주세요.')
        }
      })
  }, [token, fetchUser])

  if (status === 'verifying') {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <Spinner />
        <p className="text-sm text-neutral-600 dark:text-neutral-300">이메일 인증을 확인하고 있습니다…</p>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <CheckIcon />
        <div>
          <h1 className="text-lg font-bold">이메일 인증 완료</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
            이메일 인증이 정상적으로 완료되었습니다.
          </p>
        </div>
        <Link
          href="/"
          className="mt-1 w-full rounded bg-blue-600 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          홈으로 이동
        </Link>
      </div>
    )
  }

  // status === 'error'
  return (
    <div className="flex flex-col items-center gap-4 py-2 text-center">
      <WarnIcon />
      <div>
        <h1 className="text-lg font-bold">인증에 실패했습니다</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{errorMsg}</p>
      </div>
      <ResendForm inputClass={inputClass} />
      <Link
        href="/"
        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
      >
        홈으로 돌아가기
      </Link>
    </div>
  )
}

// 인증 링크가 만료/무효일 때, 로그인 여부와 무관하게 이메일만으로 재발송할 수 있는 폼.
// 백엔드 resend는 계정 열거 방지를 위해 항상 성공 응답을 주므로 프론트도 동일한 안내만 노출한다.
function ResendForm({ inputClass }: { inputClass: string }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    try {
      await authApi.resendEmailVerification(email.trim())
    } catch {
      // 열거 방지 정책상 성공/실패를 구분하지 않는다. 네트워크 오류여도 동일 안내로 처리.
    } finally {
      setSent(true)
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <p className="w-full rounded-md bg-green-50 px-3 py-2 text-xs text-green-700 dark:bg-green-500/10 dark:text-green-400">
        입력하신 이메일이 가입되어 있고 미인증 상태라면, 인증 메일을 보내드렸습니다. 메일함을 확인해주세요.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-2">
      <input
        type="email"
        placeholder="가입한 이메일"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={inputClass}
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? '전송 중…' : '인증 메일 다시 받기'}
      </button>
    </form>
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
