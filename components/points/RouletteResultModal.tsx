'use client'

import { useEffect, useRef } from 'react'
import type { RouletteInfo } from '@/types'

interface Props {
  // null이면 닫힘. spun=false(오늘 이미 돌렸거나 대상자 없음)는 AuthProvider가 애초에
  // 이 prop을 세팅하지 않으므로 여기서는 항상 spun=true인 결과만 받는다.
  info: RouletteInfo | null
  onClose: () => void
}

// 로그인 직후 일일 포인트 룰렛 결과를 안내하는 모달.
// SuspendedAccountModal과 동일한 모달 셸(ESC 닫기, 배경 스크롤 잠금, 포커스 이동)을 쓰되
// 경고성이 아니라 긍정적인 톤(오렌지/에메랄드)으로 꾸민다.
export default function RouletteResultModal({ info, onClose }: Props) {
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
  const won = amount > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="roulette-title"
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl outline-none dark:bg-neutral-900"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-full ${
              won
                ? 'bg-orange-100 dark:bg-orange-500/20'
                : 'bg-neutral-100 dark:bg-neutral-800'
            }`}
          >
            <svg
              className={`h-6 w-6 ${won ? 'text-orange-600 dark:text-orange-400' : 'text-neutral-400 dark:text-neutral-500'}`}
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

          <h2 id="roulette-title" className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            오늘의 포인트 룰렛
          </h2>

          {won ? (
            <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
              다른 회원의 포인트 중{' '}
              <span className="font-semibold text-orange-600 dark:text-orange-400">
                {amount.toLocaleString()}P
              </span>
              를 획득했습니다!
            </p>
          ) : (
            <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
              오늘의 포인트 룰렛을 돌렸지만 아쉽게도 포인트를 얻지 못했습니다.
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
