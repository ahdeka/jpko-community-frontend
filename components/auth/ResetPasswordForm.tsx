'use client'

import { useState } from 'react'
import Link from 'next/link'
import { authApi } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { MESSAGES } from '@/lib/messages'

const inputClass =
  'w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-blue-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-blue-500'

// 백엔드 에러 code를 재설정 화면 맥락의 문구로 변환한다.
function resetErrorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return MESSAGES.auth.resetPassword.genericError
  switch (err.code) {
    case 'EXPIRED_VERIFICATION_TOKEN':
      return MESSAGES.auth.resetPassword.expiredToken
    case 'INVALID_VERIFICATION_TOKEN':
      return MESSAGES.auth.resetPassword.invalidToken
    case 'PASSWORD_MISMATCH':
      return MESSAGES.auth.resetPassword.passwordMismatch
    default:
      return err.message
  }
}

export default function ResetPasswordForm({ token }: { token: string }) {
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  // 토큰 자체가 없으면(링크가 잘못됨) 폼을 그리지 않고 즉시 안내한다.
  if (!token) {
    return (
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <h1 className="text-lg font-bold">{MESSAGES.auth.resetPassword.missingTokenTitle}</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          {MESSAGES.auth.resetPassword.missingTokenDescription}
        </p>
        <Link
          href="/forgot-password"
          className="w-full rounded bg-blue-600 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          아이디/비밀번호 찾기
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <h1 className="text-lg font-bold">{MESSAGES.auth.resetPassword.doneTitle}</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          {MESSAGES.auth.resetPassword.doneDescription}
        </p>
        <Link
          href="/login"
          className="w-full rounded bg-blue-600 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          로그인하러 가기
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // 백엔드(@Size 8~50)와 동일 기준으로 클라이언트에서 먼저 검증한다.
    if (newPassword.length < 8 || newPassword.length > 50) {
      setError(MESSAGES.auth.resetPassword.passwordLength)
      return
    }
    if (newPassword !== newPasswordConfirm) {
      setError(MESSAGES.auth.resetPassword.passwordMismatch)
      return
    }

    setLoading(true)
    try {
      await authApi.confirmPasswordReset({ token, newPassword, newPasswordConfirm })
      setDone(true)
    } catch (err) {
      setError(resetErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1 className="mb-6 text-center text-xl font-bold">새 비밀번호 설정</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <input
          type="password"
          placeholder="새 비밀번호 (8~50자)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          className={inputClass}
        />
        <input
          type="password"
          placeholder="새 비밀번호 확인"
          value={newPasswordConfirm}
          onChange={(e) => setNewPasswordConfirm(e.target.value)}
          autoComplete="new-password"
          className={inputClass}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? '변경 중…' : '비밀번호 변경'}
        </button>
      </form>
    </>
  )
}
