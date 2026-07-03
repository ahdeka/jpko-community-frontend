'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { authApi } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'

// 마이페이지 상단의 이메일 미인증 경고 배너.
// 인증은 "권장"일 뿐 필수가 아니므로(모든 기능 이용 가능), 차단이 아닌 노란 경고 톤으로 안내한다.
// 인증된 사용자에게는 아무것도 렌더하지 않는다.
export default function EmailVerificationBanner() {
  const { user, fetchUser } = useAuth()

  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  // 이미 인증된 경우 배너 숨김. (부모에서도 걸러지지만 컴포넌트 단독으로도 안전하게 방어)
  if (!user || user.emailVerified) return null

  async function handleSend() {
    setError('')
    setLoading(true)
    try {
      await authApi.requestEmailVerification()
      setSent(true)
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.code === 'ALREADY_VERIFIED_EMAIL') {
          // 다른 탭/기기에서 이미 인증을 마친 경우. 최신 상태를 다시 받아오면 배너가 사라진다.
          await fetchUser()
          return
        }
        if (e.code === 'INVALID_EMAIL_DOMAIN') {
          setError('메일을 받을 수 없는 이메일 주소입니다. 이메일을 다시 확인해주세요.')
        } else {
          setError(e.message)
        }
      } else {
        setError('인증 메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/10 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2.5">
        <svg
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-500 dark:text-amber-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">이메일 인증이 필요합니다</p>
          {sent ? (
            <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
              <strong>{user.email}</strong> 으로 인증 메일을 보냈습니다. 메일함(스팸함 포함)의 링크를
              눌러 인증을 완료해주세요.
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
              모든 기능은 이용할 수 있지만, 비밀번호 찾기 등 계정 보호를 위해 이메일 인증을 권장합니다.
            </p>
          )}
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
      </div>

      {!sent && (
        <button
          type="button"
          onClick={handleSend}
          disabled={loading}
          className="shrink-0 self-start rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          {loading ? '전송 중…' : '인증 메일 보내기'}
        </button>
      )}
      {sent && (
        <button
          type="button"
          onClick={handleSend}
          disabled={loading}
          className="shrink-0 self-start text-xs font-medium text-amber-700 underline underline-offset-2 hover:text-amber-800 disabled:opacity-50 dark:text-amber-400 sm:self-auto"
        >
          {loading ? '전송 중…' : '다시 보내기'}
        </button>
      )}
    </div>
  )
}
