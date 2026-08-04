'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { useAuth } from '@/lib/auth-context'
import { useRedirectIfAuthenticated } from '@/lib/use-auth-guard'
import { MESSAGES } from '@/lib/messages'
import RedirectingOverlay from './RedirectingOverlay'

interface FieldErrors {
  // 로그인 식별자(아이디 또는 이메일) 입력 칸의 에러.
  loginId?: string
  password?: string
}

const inputClass =
  'w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400 dark:focus:border-blue-500'

export default function LoginForm() {
  const router = useRouter()
  const { fetchUser, notifyCheckInResult } = useAuth()
  // 이미 로그인한 사용자는 홈으로 돌려보낸다(뒤로가기·주소창 직접 진입 차단)
  const { blocked } = useRedirectIfAuthenticated()
  // 아이디 또는 이메일 둘 다 받는 로그인 식별자.
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  function validate(): FieldErrors {
    const errs: FieldErrors = {}
    if (!loginId.trim()) errs.loginId = MESSAGES.auth.login.identifierRequired
    if (!password) errs.password = MESSAGES.auth.login.passwordRequired
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError('')

    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      return
    }
    setFieldErrors({})

    setLoading(true)
    try {
      // 백엔드 LoginRequest가 loginId를 trim().toLowerCase()로 정규화하므로(아이디·이메일 공통),
      // 저장된 값과 확실히 매칭되도록 전송값도 동일하게 맞춘다(대소문자·공백 차이로 인한 실패 방지).
      // 정지(SUSPENDED)된 계정도 여기서 막히지 않는다 — 로그인은 되고, fetchUser() 이후 AuthProvider가
      // 전역 SuspendedScreen으로 전환한다(정지된 계정도 출첵은 처리되고, 그 화면에서 포인트로 즉시 해제할 수 있다).
      const res = await authApi.login({ loginId: loginId.trim().toLowerCase(), password })
      await fetchUser()
      if (res.data?.checkIn) notifyCheckInResult(res.data.checkIn)
      // 아직 계정 전환(온보딩)이 필요한 기존 유저는 홈이 아니라 온보딩 화면으로 보낸다.
      // (전역 가드도 동일하게 막지만, 여기서 곧바로 보내 깜빡임을 없앤다.)
      // replace로 이동해 히스토리에 로그인 페이지를 남기지 않는다.
      router.replace(res.data?.needsOnboarding ? '/onboarding' : '/')
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.code === 'WRONG_PASSWORD' || e.code === 'USER_NOT_FOUND') {
          setApiError(MESSAGES.auth.login.invalidCredentials)
        } else {
          setApiError(e.message)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  // 로그인 직후(또는 다른 탭에서 로그인) 리다이렉트 진행 중에는 폼 대신
  // 전체 화면 로딩 오버레이만 잠깐 보여준다. 좁은 카드 안에 문구를 넣지 않고
  // 뷰포트 전체를 덮어, 자연스러운 페이지 전환처럼 보이게 한다.
  if (blocked) {
    return <RedirectingOverlay />
  }

  return (
    <>
      <h1 className="mb-6 text-center text-xl font-bold">로그인</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <input
          type="text"
          placeholder="아이디 또는 이메일"
          value={loginId}
          onChange={e => setLoginId(e.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="username"
          className={inputClass}
        />
        {fieldErrors.loginId && (
          <p className="text-xs text-red-500 mt-1">{fieldErrors.loginId}</p>
        )}
      </div>

      <div>
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className={inputClass}
        />
        {fieldErrors.password && (
          <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>
        )}
      </div>

      {apiError && (
        <p className="text-xs text-red-500">{apiError}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '로그인 중...' : '로그인'}
      </button>

      <div className="flex items-center justify-center gap-3 text-sm">
        <Link
          href="/signup"
          className="text-center text-blue-600 hover:underline dark:text-blue-400"
        >
          계정 만들기
        </Link>
        <span className="text-neutral-300 dark:text-neutral-700">|</span>
        <Link
          href="/forgot-password"
          className="text-center text-neutral-500 hover:underline dark:text-neutral-400"
        >
          비밀번호를 잊으셨나요?
        </Link>
      </div>
      </form>
    </>
  )
}
