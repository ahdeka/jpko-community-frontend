'use client'

import { useEffect, useRef, useState } from 'react'
import { shopApi } from '@/lib/api/shop'
import { notifyPointBalanceChanged } from '@/lib/api/points'
import { ApiError } from '@/lib/api/client'
import { formatDateTime } from '@/lib/format'
import { roleLabel } from '@/lib/shop'
import { MESSAGES } from '@/lib/messages'
import type { RoleAuctionRound } from '@/types'

const T = MESSAGES.shop.roleAuction

interface Props {
  open: boolean
  onClose: () => void
  round: RoleAuctionRound | null
  // 이번 세션에서 이 회차에 성공적으로 입찰했는지 — 백엔드가 "내 입찰 조회" API를 제공하지 않아
  // RoleAuctionSection이 로컬로 기억한 값을 그대로 전달받는다.
  hasBid: boolean
  // 입찰/취소 성공 시 부모(RoleAuctionSection)가 회차 목록을 재조회하고 hasBid 상태를 갱신한다.
  onBidPlaced: () => void
  onBidCancelled: () => void
}

// 경매 참여 모달. PurchaseBlockModal과 동일한 구조(오버레이/ESC/스크롤 잠금/열릴 때 초기화/완료 화면)를 따른다.
// 회차 카드를 클릭해 열리며, 안에서 금액 입력 → 입찰/재입찰/입찰취소를 모두 처리한다.
export default function PlaceBidModal({ open, onClose, round, hasBid, onBidPlaced, onBidCancelled }: Props) {
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState<'bid' | 'cancel' | null>(null)

  const amountRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    amountRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, loading, onClose])

  useEffect(() => {
    if (!open) {
      setAmount('')
      setError(null)
      setLoading(false)
      setDone(null)
    }
  }, [open])

  if (!open || !round) return null

  function resolveError(e: unknown): string {
    const code = e instanceof ApiError ? e.code : undefined
    return (code && MESSAGES.shop.errorCodeMessages[code]) || (e instanceof ApiError ? e.message : T.loadFailed)
  }

  async function handleBid() {
    const parsed = Number(amount)
    if (!amount || !Number.isInteger(parsed) || parsed <= 0) {
      setError(T.amountRequired)
      return
    }

    setError(null)
    setLoading(true)
    try {
      await shopApi.placeBid(round!.id, { amount: parsed })
      // 입찰은 포인트를 예탁(차감)하므로 헤더 잔액을 재조회하게 알린다(응답에 잔액이 없어 값은 생략).
      notifyPointBalanceChanged()
      onBidPlaced()
      setDone('bid')
    } catch (e) {
      setError(resolveError(e))
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel() {
    setError(null)
    setLoading(true)
    try {
      await shopApi.cancelBid(round!.id)
      // 입찰 취소는 예탁 포인트가 환불되므로 헤더 잔액을 재조회하게 알린다.
      notifyPointBalanceChanged()
      onBidCancelled()
      setDone('cancel')
    } catch (e) {
      setError(resolveError(e))
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
        aria-label="경매 참여"
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900"
      >
        {done ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-500/20">
              <svg className="h-6 w-6 text-orange-600 dark:text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              {done === 'bid' ? '입찰 완료' : '취소 완료'}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {done === 'bid' ? T.bidSuccess : T.cancelSuccess}
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
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">경매 참여</h2>
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

            <div className="mb-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm dark:border-neutral-800 dark:bg-neutral-800/50">
              <div className="flex items-center justify-between">
                <span className="rounded bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">
                  {roleLabel(round.targetRole)}
                </span>
                <span className="text-xs text-neutral-400">{T.quantityLabel(round.quantity)}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-neutral-400">{T.minPriceLabel}</p>
                  <p className="font-semibold text-neutral-800 dark:text-neutral-100">{round.minPrice.toLocaleString()}P</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">{T.topBidLabel}</p>
                  <p className="font-semibold text-neutral-800 dark:text-neutral-100">
                    {round.topBidAmount != null ? `${round.topBidAmount.toLocaleString()}P` : T.noBidYet}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">{T.bidCountLabel(round.activeBidCount)}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">{T.endsAtLabel}</p>
                  <p className="text-neutral-600 dark:text-neutral-300">{formatDateTime(round.endAt)}</p>
                </div>
              </div>
            </div>

            <input
              ref={amountRef}
              type="number"
              min={round.minPrice}
              step={1}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder={T.amountPlaceholder}
              disabled={loading}
              className="mb-3 w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-orange-400 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />

            {error && <p className="mb-3 text-xs text-red-500">{error}</p>}

            <div className="flex justify-end gap-2">
              {hasBid && (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  {T.cancelBid}
                </button>
              )}
              <button
                type="button"
                onClick={handleBid}
                disabled={loading}
                className="rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? T.bidding : hasBid ? T.raiseBid : T.placeBid}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
