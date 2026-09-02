'use client'

import { useEffect, useRef } from 'react'
import type { CheckInInfo } from '@/types'
import { MESSAGES } from '@/lib/messages'

interface Props {
  // null이면 닫힘. checkedIn=false(오늘 이미 했음)는 AuthProvider가 애초에
  // 이 prop을 세팅하지 않으므로 여기서는 항상 checkedIn=true인 결과만 받는다.
  info: CheckInInfo | null
  onClose: () => void
}

// 로그인(또는 회원가입 직후 자동 로그인) 직후 출첵 결과를 안내하는 모달.
// 다른 모달들과 동일한 셸(ESC 닫기, 배경 스크롤 잠금, 포커스 이동)을 쓰되
// 경고성이 아니라 중립적인 톤(오렌지/뉴트럴)으로 꾸민다. amount는 음수(차감)일 수도 있다.
export default function CheckInResultModal({ info, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const open = info !== null

  useEffect(() => {
    if (!open) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    dialogRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!info) return null

  const amount = info.amount ?? 0
  const gained = amount > 0
  const lost = amount < 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkin-title"
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl outline-none dark:bg-neutral-900"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-full ${
              gained
                ? 'bg-orange-100 dark:bg-orange-500/20'
                : lost
                  ? 'bg-red-100 dark:bg-red-500/20'
                  : 'bg-neutral-100 dark:bg-neutral-800'
            }`}
          >
            <svg
              className={`h-6 w-6 ${
                gained
                  ? 'text-orange-600 dark:text-orange-400'
                  : lost
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-neutral-400 dark:text-neutral-500'
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="3" />
              <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
            </svg>
          </span>

          <h2 id="checkin-title" className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            오늘의 출첵
          </h2>

          {gained && (
            <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
              {MESSAGES.points.checkin.gainedPrefix}
              <span className="font-semibold text-orange-600 dark:text-orange-400">
                {amount.toLocaleString()}P
              </span>
              {MESSAGES.points.checkin.gainedSuffix}
            </p>
          )}
          {lost && (
            <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
              {MESSAGES.points.checkin.lostPrefix}
              <span className="font-semibold text-red-600 dark:text-red-400">
                {Math.abs(amount).toLocaleString()}P
              </span>
              {MESSAGES.points.checkin.lostSuffix}
            </p>
          )}
          {!gained && !lost && (
            <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
              {MESSAGES.points.checkin.neutral}
            </p>
          )}

          <button
            type="button"
            onClick={onClose}
            className="mt-2 w-full rounded-lg bg-orange-500 py-2.5 text-sm font-medium text-white hover:bg-orange-600"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  )
}
