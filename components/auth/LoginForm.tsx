'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { useAuth } from '@/lib/auth-context'

interface FieldErrors {
  email?: string
  password?: string
}

export default function LoginForm() {
  const router = useRouter()
  const { fetchUser } = useAuth()
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
      router.push('/')
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded px-3 py-2 text-sm outline-none focus:border-blue-400 dark:focus:border-blue-500"
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
          className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded px-3 py-2 text-sm outline-none focus:border-blue-400 dark:focus:border-blue-500"
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
        className="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
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
  )
}
