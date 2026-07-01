'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { useAuth } from '@/lib/auth-context'
import { useRedirectIfAuthenticated } from '@/lib/use-auth-guard'
import RedirectingOverlay from './RedirectingOverlay'

interface FieldErrors {
  email?: string
  password?: string
}

const inputClass =
  'w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400 dark:focus:border-blue-500'

export default function LoginForm() {
  const router = useRouter()
  const { fetchUser } = useAuth()
  // 이미 로그인한 사용자는 홈으로 돌려보낸다(뒤로가기·주소창 직접 진입 차단)
  const { blocked } = useRedirectIfAuthenticated()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  function validate(): FieldErrors {
    const errs: FieldErrors = {}
    if (!email) errs.email = '이메일을 입력해주세요.'
    if (!password) errs.password = '비밀번호를 입력해주세요.'
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
      await authApi.login({ email, password })
      await fetchUser()
      // replace로 이동해 히스토리에 로그인 페이지를 남기지 않는다
      router.replace('/')
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.code === 'WRONG_PASSWORD' || e.code === 'USER_NOT_FOUND') {
          setApiError('이메일 또는 비밀번호가 올바르지 않습니다.')
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
          type="email"
          placeholder="이메일"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className={inputClass}
        />
        {fieldErrors.email && (
          <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>
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

      <Link
        href="/signup"
        className="text-sm text-center text-blue-600 dark:text-blue-400 hover:underline"
      >
        계정 만들기
      </Link>
      </form>
    </>
  )
}
