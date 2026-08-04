'use client'

import { useEffect, useState } from 'react'
import { shopApi } from '@/lib/api/shop'
import { authApi } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { formatDateTime } from '@/lib/format'
import { MESSAGES } from '@/lib/messages'
import type { BlockStatus } from '@/types'

const T = MESSAGES.shop.blockScreen

interface Props {
  // 차단이 해제됐을 때(직접 해제 성공, 또는 조회 시점에 이미 만료됨) 호출된다.
  // 하드 네비게이션으로 앱 전체 상태를 리셋한다 — SuspendedScreen과 같은 이유.
  onResolved: () => void
}

// 임시 활동 차단(#6) 상태 전체화면 안내. RedirectingOverlay와 같은 fixed inset-0 풀페이지 패턴을 쓰되,
// 모달이 아닌 이유: 정지(SUSPENDED)와 달리 세션이 유효하고 허용된 몇 개 API만 계속 동작하는 상태라
// "닫으면 그만"인 모달보다는, 그 안에서 해제·이의제기까지 끝낼 수 있는 화면이 맞다.
export default function ActivityBlockScreen({ onResolved }: Props) {
  const [status, setStatus] = useState<BlockStatus | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [unblocking, setUnblocking] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [sendingAppeal, setSendingAppeal] = useState(false)
  const [appealSent, setAppealSent] = useState(false)

  useEffect(() => {
    let cancelled = false
    shopApi.getMyBlockStatus()
      .then(res => {
        if (cancelled) return
        const data = res.data
        // 조회 시점에 이미 만료됐으면(만료 직후 다른 API가 먼저 403을 던진 경쟁 상황) 정상 화면으로 복귀.
        if (!data || !data.blocked) {
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

  async function handleUnblock() {
    if (unblocking) return
    setActionError(null)
    setUnblocking(true)
    try {
      await shopApi.unblockSelf()
      onResolved()
    } catch (e) {
      const code = e instanceof ApiError ? e.code : undefined
      setActionError((code && MESSAGES.shop.errorCodeMessages[code]) || (e instanceof ApiError ? e.message : T.actionFailed))
      setUnblocking(false)
    }
  }

  async function handleAppeal(e: React.FormEvent) {
    e.preventDefault()
    if (sendingAppeal || !message.trim()) return
    setActionError(null)
    setSendingAppeal(true)
    try {
      await shopApi.appeal({ message: message.trim() })
      setAppealSent(true)
      setMessage('')
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined
      setActionError((code && MESSAGES.shop.errorCodeMessages[code]) || (err instanceof ApiError ? err.message : T.actionFailed))
    } finally {
      setSendingAppeal(false)
    }
  }

  async function handleLogout() {
    try {
      await authApi.logout()
    } catch {}
    window.location.href = '/login'
  }

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
              <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{status.reason}</p>
              {status.expiresAt && (
                <p className="text-xs text-neutral-400">{T.expiresAtLabel} {formatDateTime(status.expiresAt)}</p>
              )}
            </>
          )}
        </div>

        {status && (
          <>
            {/* 해제 카드 */}
            <div className="mt-5 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/60">
              <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">{T.unblockTitle}</p>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                {T.unblockDescription(status.unblockItemName, status.unblockPrice)}
              </p>
              <button
                type="button"
                onClick={handleUnblock}
                disabled={unblocking}
                className="mt-3 w-full rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {unblocking ? T.unblocking : T.unblockButton}
              </button>
            </div>

            {/* 이의제기 폼 */}
            <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/60">
              <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">{T.appealTitle}</p>
              {appealSent ? (
                <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">{T.appealSent}</p>
              ) : (
                <form onSubmit={handleAppeal} className="mt-2 flex flex-col gap-2">
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder={T.appealPlaceholder}
                    rows={3}
                    disabled={sendingAppeal}
                    className="w-full resize-none rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-red-400 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  />
                  <button
                    type="submit"
                    disabled={sendingAppeal || !message.trim()}
                    className="self-end rounded-md bg-neutral-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
                  >
                    {sendingAppeal ? T.sendingAppeal : T.sendAppeal}
                  </button>
                </form>
              )}
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
