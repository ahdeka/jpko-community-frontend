'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { authApi } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { MESSAGES } from '@/lib/messages'
import Turnstile, { type TurnstileHandle } from './Turnstile'
import { inputClass } from './_shared'

type FieldName = 'email' | 'turnstile'
type FieldErrors = Partial<Record<FieldName, string>>

// 이메일 형식 1차 검증(백엔드 @Email 미러링). 통과 못 하면 요청 자체를 보내지 않는다.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// 아이디/비밀번호 찾기 화면.
//   이메일 + 보안문자(Turnstile) → POST /api/auth/find-account → 안내 메일 발송.
// 메일에는 가입된 아이디와 비밀번호 재설정 링크(/reset-password?token=)가 함께 담긴다.
//
// 계정 열거 방지: 백엔드는 가입 여부와 무관하게 200을 준다(미가입 이메일엔 "계정 없음" 메일이 간다).
// 즉 응답 자체로는 가입 여부를 알 수 없으므로, 에러(캡차 실패·발송 실패 등)는 숨기지 않고 그대로 안내한다.
// 에러를 삼키고 "보냈어요" 화면을 띄우면, 캡차 실패처럼 재시도로 해결되는 상황에서도 메일이 오지 않아 혼란만 준다.
export default function FindAccountForm() {
  const [email, setEmail] = useState('')
  // Cloudflare Turnstile 통과 시 발급되는 1회용 토큰. 백엔드 FindAccountRequest @NotBlank 미러링.
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileRef = useRef<TurnstileHandle>(null)

  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  // 발송 완료 화면. 메일을 보낸 주소를 함께 보여준다.
  const [sentTo, setSentTo] = useState<string | null>(null)

  // 클라이언트 검증(현재 입력값에서 매 렌더 파생). 백엔드 FindAccountRequest @Valid 미러링.
  const clientErrors = useMemo<FieldErrors>(() => {
    const errs: FieldErrors = {}
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      errs.email = MESSAGES.auth.findAccount.emailRequired
    } else if (!EMAIL_RE.test(trimmedEmail)) {
      errs.email = MESSAGES.auth.findAccount.emailInvalid
    }
    if (!turnstileToken) {
      errs.turnstile = MESSAGES.auth.findAccount.turnstileRequired
    }
    return errs
  }, [email, turnstileToken])

  // 입력 전부터 빨간 글씨가 뜨지 않도록, 필드를 벗어났거나(blur) 제출을 시도한 뒤에만 노출한다.
  function visibleError(field: FieldName): string | undefined {
    if (touched[field] || submitted) return clientErrors[field]
    return undefined
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // 로딩 중 Enter 연타로 인한 중복 제출 차단(버튼 disabled는 Enter 제출을 막지 못한다).
    if (loading) return
    setSubmitted(true)
    setApiError('')

    if (Object.keys(clientErrors).length > 0) return

    setLoading(true)
    // 백엔드가 trim().toLowerCase()로 정규화하므로 전송값·완료 화면 표시값도 동일하게 맞춘다.
    const normalizedEmail = email.trim().toLowerCase()
    try {
      await authApi.findAccount({ email: normalizedEmail, turnstileToken })
      setSentTo(normalizedEmail)
    } catch (err) {
      // ⚠️ 실패 원인과 무관하게 항상 위젯을 리셋한다.
      //    Turnstile 토큰은 1회용이고 백엔드는 가장 먼저 캡차를 검증한다. 이후 단계(메일 발송 등)에서
      //    실패해도 토큰은 이미 소진됐으므로, 리셋하지 않으면 재시도가 계속 CAPTCHA_FAILED로 끝난다.
      setTurnstileToken('')
      turnstileRef.current?.reset()

      if (err instanceof ApiError) {
        if (err.code === 'CAPTCHA_FAILED') {
          setApiError(MESSAGES.auth.findAccount.captchaFailed)
        } else if (err.code === 'EMAIL_SEND_FAILED') {
          setApiError(MESSAGES.auth.findAccount.genericError)
        } else {
          // INVALID_INPUT(Bean Validation) 등. 백엔드가 걸린 필드의 구체적인 문구를 실어주므로 그대로 쓴다.
          setApiError(err.message || MESSAGES.auth.findAccount.genericError)
        }
      } else {
        // ApiError가 아닌 예외(네트워크 단절, 타임아웃 등).
        setApiError(MESSAGES.auth.findAccount.networkError)
      }
    } finally {
      setLoading(false)
    }
  }

  if (sentTo) {
    // React가 텍스트를 자동 이스케이프하므로 이메일을 그대로 렌더해도 XSS 위험이 없고,
    // 매우 긴 주소는 break-all로 줄바꿈해 레이아웃이 깨지지 않게 한다.
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
          <h1 className="text-xl font-bold">{MESSAGES.auth.findAccount.sentTitle}</h1>
          {/* 입력한 이메일 주소를 강조 → 어느 메일함을 열지 목적지를 구체화한다 */}
          <p className="break-all text-sm font-semibold text-blue-700 dark:text-blue-400">{sentTo}</p>
        </div>

        <p className="text-center text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          {MESSAGES.auth.findAccount.linkValidity}
        </p>

        {/* 스팸함 안내는 부차 정보로 분리(작은 회색) → 메인 문구를 가볍게 유지 */}
        <p className="text-center text-xs text-neutral-400 dark:text-neutral-500">
          {MESSAGES.auth.findAccount.spamHint}
        </p>

        <Link href="/login" className="text-center text-sm text-blue-600 hover:underline dark:text-blue-400">
          로그인으로 돌아가기
        </Link>
      </div>
    )
  }

  const emailError = visibleError('email')
  const turnstileError = visibleError('turnstile')

  return (
    <>
      <h1 className="mb-2 text-center text-xl font-bold">아이디/비밀번호 찾기</h1>
      <p className="mb-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
        입력하신 이메일로 안내 메일을 보내드립니다.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div>
          <input
            type="email"
            placeholder="가입한 이메일"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
            autoComplete="email"
            className={inputClass}
          />
          {emailError && <p className="mt-1 text-xs text-red-500">{emailError}</p>}
        </div>

        {/* 봇 방지(Cloudflare Turnstile). 통과 시 토큰을 저장하고, 만료/오류 시 비운다.
            site key가 없으면 위젯 대신 안내 문구가 렌더된다(fail-closed — 요청 불가). */}
        <div>
          <Turnstile
            ref={turnstileRef}
            onVerify={setTurnstileToken}
            onExpire={() => setTurnstileToken('')}
            onError={() => setTurnstileToken('')}
            fallbackMessage={MESSAGES.auth.findAccount.turnstileMisconfigured}
          />
          {turnstileError && <p className="mt-1 text-xs text-red-500">{turnstileError}</p>}
        </div>

        {apiError && <p className="text-xs text-red-500">{apiError}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? '전송 중…' : '안내 메일 받기'}
        </button>
        <Link href="/login" className="text-center text-sm text-blue-600 hover:underline dark:text-blue-400">
          로그인으로 돌아가기
        </Link>
      </form>
    </>
  )
}
