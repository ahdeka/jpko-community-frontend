'use client'

import { useCallback, useEffect, useState } from 'react'
import { shopApi } from '@/lib/api/shop'
import { ApiError } from '@/lib/api/client'
import { formatDateTime } from '@/lib/format'
import { roleLabel } from '@/lib/shop'
import { MESSAGES } from '@/lib/messages'
import type { RoleAuctionRound, RolePurchaseStatus } from '@/types'

const T = MESSAGES.shop.roleAuction

// 포인트 기반 ADMIN 권한 경매 섹션. 회차 목록 + 입찰 폼 + 내 보유 현황을 보여준다.
//
// ⚠️ 백엔드가 "내가 이 회차에 이미 입찰했는지/얼마인지"를 조회하는 API를 제공하지 않는다
// (GET /api/shop/role-auctions/current는 집계값만 준다). 그래서 "입찰 취소" 버튼은 서버에 물어보는 대신
// 이번 세션에서 성공적으로 입찰한 회차만 로컬로 기억해 보여준다 — 새로고침하면 다시 숨겨지지만,
// 입찰/재입찰 자체는 언제든 다시 낼 수 있어 기능상 막히지 않는다.
export default function RoleAuctionSection() {
  const [rounds, setRounds] = useState<RoleAuctionRound[] | null>(null)
  const [myStatus, setMyStatus] = useState<RolePurchaseStatus | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [amounts, setAmounts] = useState<Record<number, string>>({})
  const [busyRoundId, setBusyRoundId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [biddedRoundIds, setBiddedRoundIds] = useState<Set<number>>(new Set())

  const load = useCallback(() => {
    Promise.all([shopApi.getCurrentRounds(), shopApi.getMyRoleStatus()])
      .then(([roundsRes, statusRes]) => {
        setRounds(roundsRes.data ?? [])
        setMyStatus(statusRes.data ?? null)
      })
      .catch((e: unknown) => setLoadError(e instanceof ApiError ? e.message : T.loadFailed))
  }, [])

  useEffect(() => { load() }, [load])

  function resolveError(e: unknown): string {
    const code = e instanceof ApiError ? e.code : undefined
    return (code && MESSAGES.shop.errorCodeMessages[code]) || (e instanceof ApiError ? e.message : T.loadFailed)
  }

  async function handleBid(round: RoleAuctionRound) {
    const raw = amounts[round.id]
    const amount = Number(raw)
    if (!raw || !Number.isInteger(amount) || amount <= 0) {
      setActionError(T.amountRequired)
      return
    }

    setActionError(null)
    setBusyRoundId(round.id)
    try {
      await shopApi.placeBid(round.id, { amount })
      setBiddedRoundIds(prev => new Set(prev).add(round.id))
      load()
    } catch (e) {
      setActionError(resolveError(e))
    } finally {
      setBusyRoundId(null)
    }
  }

  async function handleCancel(round: RoleAuctionRound) {
    setActionError(null)
    setBusyRoundId(round.id)
    try {
      await shopApi.cancelBid(round.id)
      setBiddedRoundIds(prev => {
        const next = new Set(prev)
        next.delete(round.id)
        return next
      })
      load()
    } catch (e) {
      setActionError(resolveError(e))
    } finally {
      setBusyRoundId(null)
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">권한 경매</h2>

      {myStatus?.active && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300">
          {T.myStatusActive(roleLabel(myStatus.targetRole!), myStatus.expiresAt ? formatDateTime(myStatus.expiresAt) : '')}
        </div>
      )}

      {loadError && <p className="text-sm text-red-500">{loadError}</p>}

      {!loadError && rounds === null && (
        <p className="py-6 text-center text-sm text-neutral-400">불러오는 중…</p>
      )}

      {rounds !== null && rounds.length === 0 && (
        <p className="py-6 text-center text-sm text-neutral-400">{T.empty}</p>
      )}

      {rounds?.map(round => {
        const busy = busyRoundId === round.id
        const hasBid = biddedRoundIds.has(round.id)

        return (
          <div key={round.id} className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">
                {roleLabel(round.targetRole)}
              </span>
              <span className="text-xs text-neutral-400">{T.quantityLabel(round.quantity)}</span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
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

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                type="number"
                min={round.minPrice}
                step={1}
                value={amounts[round.id] ?? ''}
                onChange={e => setAmounts(prev => ({ ...prev, [round.id]: e.target.value }))}
                placeholder={T.amountPlaceholder}
                disabled={busy}
                className="w-32 rounded border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 outline-none focus:border-orange-400 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              />
              <button
                type="button"
                onClick={() => handleBid(round)}
                disabled={busy}
                className="rounded-md bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {busy ? T.bidding : hasBid ? T.raiseBid : T.placeBid}
              </button>
              {hasBid && (
                <button
                  type="button"
                  onClick={() => handleCancel(round)}
                  disabled={busy}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  {T.cancelBid}
                </button>
              )}
            </div>
          </div>
        )
      })}

      {actionError && <p className="text-xs text-red-500">{actionError}</p>}
    </section>
  )
}
