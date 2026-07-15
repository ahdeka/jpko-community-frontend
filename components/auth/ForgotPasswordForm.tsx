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
  // 미인증 자가복구 안내는 기본으로 접어둔다. 대다수(이미 인증된 사용자)는
  // 성공 안내만 보게 하고, "메일이 오지 않나요?"를 누른 소수에게만 인증 경로를 편다.
  const [showHelp, setShowHelp] = useState(false)

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
    // 폼 검증(빈 값·형식)을 통과해야만 sent=true가 되므로 여기서 trimmedEmail은 항상 유효한 주소다.
    // React가 텍스트를 자동 이스케이프하므로 그대로 렌더해도 XSS 위험이 없고, 매우 긴 주소는
    // break-all로 줄바꿈해 레이아웃이 깨지지 않게 한다.
    const trimmedEmail = email.trim()
    return (
      <div className="flex flex-col gap-4">
        {/* 봉투 아이콘: "메일 관련 화면 → 지금 메일함으로 가야 한다"를 시각적으로 즉시 전달 */}
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/10">
            <svg
              className="h-7 w-7 text-blue-600 dark:text-blue-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-xl font-bold">메일을 보냈어요</h1>
          {/* 입력한 이메일 주소를 강조 → 어느 메일함을 열지 목적지를 구체화한다 */}
          <p className="break-all text-sm font-semibold text-blue-700 dark:text-blue-400">{trimmedEmail}</p>
        </div>

        {/* 상태 보고가 아닌 "다음 행동" 지시형 문구 */}
        <p className="text-center text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          받은 메일함을 열어 <strong>비밀번호 재설정 링크</strong>를 눌러주세요.
        </p>

        {/* 스팸함 안내는 부차 정보로 분리(작은 회색) → 메인 문구를 가볍게 유지 */}
        <p className="text-center text-xs text-neutral-400 dark:text-neutral-500">
          메일이 보이지 않으면 스팸함도 확인해주세요.
        </p>

        {/* 미인증 계정은 재설정 메일이 발송되지 않는다 → 자가 해결 경로.
            기본은 접어두고, "메일이 오지 않나요?"를 누른 사용자에게만 펼쳐 보인다. */}
        {showHelp ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-500/30 dark:bg-amber-500/10">
            <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
              이메일 인증이 완료되지 않은 계정에는 재설정 메일이 발송되지 않습니다. 아래에서 인증 메일을
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
        ) : (
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            aria-expanded={false}
            className="text-center text-xs text-neutral-500 underline-offset-2 hover:underline dark:text-neutral-400"
          >
            메일이 오지 않나요?
          </button>
        )}

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
