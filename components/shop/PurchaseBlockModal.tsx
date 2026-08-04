'use client'

import { useEffect, useRef, useState } from 'react'
import { shopApi } from '@/lib/api/shop'
import { ApiError } from '@/lib/api/client'
import { MESSAGES } from '@/lib/messages'
import type { ShopItem } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  targetUserId: number
  targetNickname: string
}

// 임시 활동 차단권 구매 모달. TransferPointsModal과 동일한 구조
// (오버레이/ESC/스크롤 잠금/열릴 때 초기화/완료 화면)를 따른다.
export default function PurchaseBlockModal({ open, onClose, targetUserId, targetNickname }: Props) {
  const [items, setItems] = useState<ShopItem[] | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    shopApi.getItems()
      .then(res => {
        const blockItems = (res.data ?? []).filter(item => item.type === 'BLOCK')
        setItems(blockItems)
        setSelectedItemId(blockItems[0]?.id ?? null)
      })
      .catch((e: unknown) => setLoadError(e instanceof ApiError ? e.message : MESSAGES.shop.catalog.loadFailed))

    confirmRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, loading, onClose])

  useEffect(() => {
    if (!open) {
      setItems(null)
      setSelectedItemId(null)
      setLoadError(null)
      setError(null)
      setLoading(false)
      setDone(false)
    }
  }, [open])

  if (!open) return null

  const selectedItem = items?.find(item => item.id === selectedItemId) ?? null

  async function handleConfirm() {
    if (loading || !selectedItemId) return
    setError(null)
    setLoading(true)
    try {
      await shopApi.purchaseBlock({ targetUserId, itemId: selectedItemId })
      setDone(true)
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined
      setError((code && MESSAGES.shop.errorCodeMessages[code]) || (err instanceof ApiError ? err.message : MESSAGES.shop.catalog.loadFailed))
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
        aria-label="활동 차단권 사용"
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900"
      >
        {done ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">차단 완료</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {targetNickname}님의 활동을 차단했습니다.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded-md bg-neutral-800 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
            >
              닫기
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">활동 차단권 사용</h2>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                aria-label="닫기"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 disabled:opacity-40 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs leading-relaxed text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              포인트를 지불해 <b>{targetNickname}</b>님의 활동을 일정 시간 제한합니다. 대상은 포인트를 지불해 즉시 해제할 수 있습니다.
            </p>

            {loadError && <p className="mb-3 text-xs text-red-500">{loadError}</p>}

            {!loadError && !items && (
              <p className="py-6 text-center text-sm text-neutral-400">불러오는 중…</p>
            )}

            {items && items.length === 0 && (
              <p className="py-6 text-center text-sm text-neutral-400">현재 판매 중인 차단권이 없습니다.</p>
            )}

            {/* 상품이 2개 이상이면 라디오 카드 목록으로 골라야 한다 — 1개뿐이면 자동 선택된 상세만 보여준다. */}
            {items && items.length > 1 && (
              <div role="radiogroup" aria-label="차단권 선택" className="mb-4 flex flex-col gap-2">
                {items.map(item => {
                  const selected = item.id === selectedItemId
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setSelectedItemId(item.id)}
                      className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${
                        selected
                          ? 'border-red-400 bg-red-50 dark:border-red-500/60 dark:bg-red-500/10'
                          : 'border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50'
                      }`}
                    >
                      <span>
                        <span className="block font-semibold text-neutral-800 dark:text-neutral-100">{item.name}</span>
                        {item.durationMinutes != null && (
                          <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                            {Math.round(item.durationMinutes / 60)}{MESSAGES.shop.catalog.blockItemDurationSuffix}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 font-bold text-red-600 dark:text-red-400">{item.price?.toLocaleString()}P</span>
                    </button>
                  )
                })}
              </div>
            )}

            {selectedItem && items && items.length <= 1 && (
              <div className="mb-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm dark:border-neutral-800 dark:bg-neutral-800/50">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-100">{selectedItem.name}</span>
                  <span className="font-bold text-red-600 dark:text-red-400">{selectedItem.price?.toLocaleString()}P</span>
                </div>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {selectedItem.durationMinutes != null && `${Math.round(selectedItem.durationMinutes / 60)}${MESSAGES.shop.catalog.blockItemDurationSuffix}`}
                </p>
              </div>
            )}

            {error && <p className="mb-3 text-xs text-red-500">{error}</p>}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                취소
              </button>
              <button
                ref={confirmRef}
                type="button"
                onClick={handleConfirm}
                disabled={loading || !selectedItemId}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? '처리 중…' : '차단하기'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
