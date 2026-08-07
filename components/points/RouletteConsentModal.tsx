'use client'

import { useEffect, useRef, useState } from 'react'
import { rouletteApi } from '@/lib/api/roulette'
import { ApiError } from '@/lib/api/client'
import { MESSAGES } from '@/lib/messages'

interface Props {
  open: boolean
  onAgree: () => void
  onClose: () => void
}

// 룰렛 최초 참여 동의 모달. PurchaseBlockModal과 같은 구조(오버레이/ESC/스크롤 잠금)를 따르되
// 상품 목록 없이 안내문 + 동의 버튼만 있는 단순한 형태다. 동의는 계정에 영구히 남으므로
// 한 번 동의하면 이 모달은 다시 뜨지 않는다.
export default function RouletteConsentModal({ open, onAgree, onClose }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const agreeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    agreeRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, loading, onClose])

  useEffect(() => {
    if (!open) {
      setError(null)
      setLoading(false)
    }
  }, [open])

  if (!open) return null

  async function handleAgree() {
    if (loading) return
    setError(null)
    setLoading(true)
    try {
      await rouletteApi.agree()
      onAgree()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : MESSAGES.points.rouletteConsent.agreeFailed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => { if (!loading) onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={MESSAGES.points.rouletteConsent.title}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900"
      >
        <h2 className="mb-3 text-base font-bold text-neutral-900 dark:text-neutral-100">
          {MESSAGES.points.rouletteConsent.title}
        </h2>

        <p className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-3 text-xs leading-relaxed text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300">
          {MESSAGES.points.rouletteConsent.body}
        </p>

        {error && <p className="mb-3 text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            {MESSAGES.points.rouletteConsent.cancel}
          </button>
          <button
            ref={agreeRef}
            type="button"
            onClick={handleAgree}
            disabled={loading}
            className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? '처리 중…' : MESSAGES.points.rouletteConsent.agree}
          </button>
        </div>
      </div>
    </div>
  )
}
