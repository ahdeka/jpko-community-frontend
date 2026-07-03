'use client'

import { useState } from 'react'
import Link from 'next/link'
import { authApi } from '@/lib/api/auth'

const inputClass =
  'w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-blue-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-blue-500'

// 이메일 형식 1차 검증(백엔드 @Email 미러링). 통과 못 하면 요청 자체를 보내지 않는다.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  // 재설정 메일이 안 오는 가장 흔한 원인은 "이메일 미인증"이다.
  // 백엔드는 보안(계정 열거 방지)상 인증 여부를 알려주지 않으므로, 사용자가 직접
  // 인증 메일을 받아 문제를 해결할 수 있도록 같은 이메일로 재발송 경로를 제공한다.
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifySent, setVerifySent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const trimmed = email.trim()
    if (!trimmed) {
      setError('이메일을 입력해주세요.')
      return
    }
    if (!EMAIL_RE.test(trimmed)) {
      setError('이메일 형식이 올바르지 않습니다.')
      return
    }

    setLoading(true)
    try {
      await authApi.requestPasswordReset(trimmed)
    } catch {
      // 계정 열거 방지 정책상 백엔드는 항상 성공을 주지만, 네트워크 오류 등으로 실패해도
      // 존재 여부를 노출하지 않기 위해 동일한 안내 화면으로 넘어간다.
    } finally {
      setSent(true)
      setLoading(false)
    }
  }

  async function handleResendVerification() {
    setVerifyLoading(true)
    try {
      await authApi.resendEmailVerification(email.trim())
    } catch {
      // 위와 동일하게 성공/실패를 구분하지 않는다.
    } finally {
      setVerifySent(true)
      setVerifyLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-center text-xl font-bold">메일을 확인해주세요</h1>
        <p className="rounded-md bg-blue-50 px-3 py-2 text-xs leading-relaxed text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
          입력하신 이메일이 가입되어 있고 <strong>이메일 인증이 완료된 계정</strong>이라면, 비밀번호
          재설정 링크를 보내드렸습니다. 메일함(스팸함 포함)을 확인해주세요.
        </p>

        {/* 미인증 계정은 재설정 메일이 발송되지 않는다 → 자가 해결 경로 안내 */}
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-500/30 dark:bg-amber-500/10">
          <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
            메일이 오지 않나요? 이메일 인증이 완료되지 않은 계정일 수 있습니다. 아래에서 인증 메일을
            먼저 받아 인증을 완료한 뒤 다시 시도해주세요.
          </p>
          {verifySent ? (
            <p className="mt-2 text-xs font-medium text-amber-800 dark:text-amber-300">
              인증 메일을 보냈습니다(가입·미인증 계정인 경우). 인증 완료 후 다시 시도해주세요.
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={verifyLoading}
              className="mt-2 rounded bg-amber-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {verifyLoading ? '전송 중…' : '인증 메일 받기'}
            </button>
          )}
        </div>

        <Link href="/login" className="text-center text-sm text-blue-600 hover:underline dark:text-blue-400">
          로그인으로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <>
      <h1 className="mb-2 text-center text-xl font-bold">비밀번호 찾기</h1>
      <p className="mb-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
        가입한 이메일로 비밀번호 재설정 링크를 보내드립니다.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div>
          <input
            type="email"
            placeholder="가입한 이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? '전송 중…' : '재설정 링크 받기'}
        </button>
        <Link href="/login" className="text-center text-sm text-blue-600 hover:underline dark:text-blue-400">
          로그인으로 돌아가기
        </Link>
      </form>
    </>
  )
}
