'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'

interface FieldErrors {
  email?: string
  password?: string
  nickname?: string
}

export default function SignupForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  function validate(): FieldErrors {
    const errs: FieldErrors = {}

    if (!email) {
      errs.email = '이메일을 입력해주세요.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = '이메일 형식이 올바르지 않습니다.'
    }

    if (!password) {
      errs.password = '비밀번호를 입력해주세요.'
    } else if (password.length < 8) {
      errs.password = '비밀번호는 8자 이상이어야 합니다.'
    }

    if (!nickname) {
      errs.nickname = '닉네임을 입력해주세요.'
    } else if (nickname.length < 2 || nickname.length > 20) {
      errs.nickname = '닉네임은 2자 이상 20자 이하여야 합니다.'
    }

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
      await authApi.signup({ email, password, nickname })
      router.push('/login')
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.code === 'DUPLICATE_EMAIL') {
          setFieldErrors(prev => ({ ...prev, email: '이미 사용 중인 이메일입니다.' }))
        } else if (e.code === 'DUPLICATE_NICKNAME') {
          setFieldErrors(prev => ({ ...prev, nickname: '이미 사용 중인 닉네임입니다.' }))
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
          placeholder="비밀번호 (8자 이상)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded px-3 py-2 text-sm outline-none focus:border-blue-400 dark:focus:border-blue-500"
        />
        {fieldErrors.password && (
          <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>
        )}
      </div>

      <div>
        <input
          type="text"
          placeholder="닉네임 (2~20자)"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded px-3 py-2 text-sm outline-none focus:border-blue-400 dark:focus:border-blue-500"
        />
        {fieldErrors.nickname && (
          <p className="text-xs text-red-500 mt-1">{fieldErrors.nickname}</p>
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
        {loading ? '가입 중...' : '회원가입'}
      </button>

      <p className="text-xs text-center text-gray-500 dark:text-neutral-400">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
          로그인
        </Link>
      </p>
    </form>
  )
}
