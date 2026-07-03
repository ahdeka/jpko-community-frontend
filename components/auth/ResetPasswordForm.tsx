'use client'

import { useState } from 'react'
import Link from 'next/link'
import { authApi } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'

const inputClass =
  'w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-blue-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-blue-500'

// 백엔드 에러 code를 재설정 화면 맥락의 문구로 변환한다.
function resetErrorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return '비밀번호 재설정에 실패했습니다. 잠시 후 다시 시도해주세요.'
  switch (err.code) {
    case 'EXPIRED_VERIFICATION_TOKEN':
      return '재설정 링크가 만료되었습니다. 비밀번호 찾기를 다시 진행해주세요.'
    case 'INVALID_VERIFICATION_TOKEN':
      return '유효하지 않은 재설정 링크입니다. 비밀번호 찾기를 다시 진행해주세요.'
    case 'PASSWORD_MISMATCH':
      return '새 비밀번호가 일치하지 않습니다.'
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
        <h1 className="text-lg font-bold">유효하지 않은 링크</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          재설정 링크가 올바르지 않습니다. 비밀번호 찾기를 다시 진행해주세요.
        </p>
        <Link
          href="/forgot-password"
          className="w-full rounded bg-blue-600 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          비밀번호 찾기
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <h1 className="text-lg font-bold">비밀번호 변경 완료</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          새 비밀번호로 변경되었습니다. 보안을 위해 다른 기기의 로그인은 모두 해제되었습니다.
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
      setError('새 비밀번호는 8~50자 사이여야 합니다.')
      return
    }
    if (newPassword !== newPasswordConfirm) {
      setError('새 비밀번호가 일치하지 않습니다.')
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
