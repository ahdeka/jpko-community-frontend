'use client'

import { useEffect, useState } from 'react'
import { usersApi } from '@/lib/api/users'
import { authApi } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { formatDateTime } from '@/lib/format'
import { CONTACT_EMAIL, SITE_NAME } from '@/lib/site'
import { MESSAGES } from '@/lib/messages'
import type { SuspensionStatus } from '@/types'

const T = MESSAGES.auth.suspendedAccount

interface Props {
  // 정지가 해제됐을 때(직접 해제 성공, 또는 조회 시점에 이미 스케줄러가 먼저 풀어놓은 경우) 호출된다.
  // 하드 네비게이션으로 앱 전체 상태를 리셋한다 — ActivityBlockScreen과 같은 이유.
  onResolved: () => void
}

// 관리자 정지(SUSPENDED) 상태 전체화면 안내. ActivityBlockScreen과 같은 fixed inset-0
// 풀페이지 패턴을 쓴다 — 정지된 계정도 로그인은 되고(출첵도 그대로 처리됨), SuspendAllowedPaths로
// 제한된 이 화면의 API(정지 현황 조회, 포인트로 즉시 해제, 로그아웃)만 계속 쓸 수 있는 상태이기 때문에
// "닫으면 그만"인 모달보다는 그 안에서 해제까지 끝낼 수 있는 화면이 맞다.
export default function SuspendedScreen({ onResolved }: Props) {
  const [status, setStatus] = useState<SuspensionStatus | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [unlocking, setUnlocking] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    usersApi.getMySuspensionStatus()
      .then(res => {
        if (cancelled) return
        const data = res.data
        // 조회 시점에 이미 풀려 있으면(1분 주기 스케줄러가 먼저 자동 해제한 경쟁 상황) 정상 화면으로 복귀.
        if (!data || !data.suspended) {
          onResolved()
          return
        }
        setStatus(data)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setLoadError(e instanceof ApiError ? e.message : T.loadFailed)
      })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleUnlock() {
    if (unlocking) return
    setActionError(null)
    setUnlocking(true)
    try {
      await usersApi.unlockSuspension()
      onResolved()
    } catch (e) {
      // 해제 시도 사이에 정지가 이미 풀렸으면(스케줄러 경쟁) 에러가 아니라 정상 복귀로 처리한다.
      if (e instanceof ApiError && e.code === 'NOT_SUSPENDED') {
        onResolved()
        return
      }
      setActionError(e instanceof ApiError ? e.message : T.actionFailed)
      setUnlocking(false)
    }
  }

  async function handleLogout() {
    try {
      await authApi.logout()
    } catch {}
    window.location.href = '/login'
  }

  // 문의 메일 프리필 — 이 화면은 로그인된 상태이므로 이메일을 따로 입력받지 않아도 된다.
  const subject = T.mailSubject(SITE_NAME)
  const body = [T.mailBody, '', '- 닉네임: ', '- 문의 내용: ', ''].join('\n')
  const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-neutral-100 p-4 dark:bg-neutral-950"
      role="alert"
      aria-label={T.title}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
            <svg className="h-6 w-6 text-red-600 dark:text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <line x1="12" y1="8" x2="12" y2="13" />
              <line x1="12" y1="16.5" x2="12" y2="16.5" />
            </svg>
          </span>
          <h1 className="text-base font-bold text-neutral-900 dark:text-neutral-100">{T.title}</h1>

          {!status && !loadError && (
            <p className="text-sm text-neutral-400">{T.loading}</p>
          )}

          {loadError && (
            <p className="text-sm text-red-500">{loadError}</p>
          )}

          {status && (
            <>
              <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{T.description}</p>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                {status.suspendedUntil ? `${T.untilPrefix}${formatDateTime(status.suspendedUntil)}` : T.indefinite}
              </p>
            </>
          )}
        </div>

        {status && (
          <>
            {/* 해제 카드 — 무기한 정지도 가격만 있으면 동일하게 포인트로 즉시 해제할 수 있다. */}
            {status.unlockPrice != null && (
              <div className="mt-5 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/60">
                <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">{T.unlockTitle}</p>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {T.unlockDescription(status.unlockPrice)}
                </p>
                <button
                  type="button"
                  onClick={handleUnlock}
                  disabled={unlocking}
                  className="mt-3 w-full rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {unlocking ? T.unlocking : T.unlockButton}
                </button>
              </div>
            )}

            {/* 문의 안내 */}
            <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/60">
              <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">{T.inquiryTitle}</p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                {T.inquiryDescriptionPrefix}
                <b className="font-semibold text-neutral-600 dark:text-neutral-300">{T.inquiryDescriptionEmphasis}</b>
                {T.inquiryDescriptionSuffix}
              </p>
              <a
                href={mailtoHref}
                className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                {CONTACT_EMAIL}
              </a>
            </div>

            {actionError && <p className="mt-3 text-xs text-red-500">{actionError}</p>}
          </>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="mt-5 w-full rounded-lg border border-neutral-300 py-2 text-sm text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          {T.logout}
        </button>
      </div>
    </div>
  )
}
