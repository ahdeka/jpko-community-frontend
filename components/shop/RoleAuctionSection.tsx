'use client'

import { useCallback, useEffect, useState } from 'react'
import { shopApi } from '@/lib/api/shop'
import { ApiError } from '@/lib/api/client'
import { formatDateTime } from '@/lib/format'
import { roleLabel } from '@/lib/shop'
import { MESSAGES } from '@/lib/messages'
import PlaceBidModal from '@/components/shop/PlaceBidModal'
import type { RoleAuctionRound, RolePurchaseStatus } from '@/types'

const T = MESSAGES.shop.roleAuction

// 포인트 기반 ADMIN 권한 경매 섹션. 회차를 카드로 나열하고, "참여하기"를 누르면
// PlaceBidModal이 열려 그 안에서 입찰/재입찰/입찰취소를 처리한다.
//
// ⚠️ 백엔드가 "내가 이 회차에 이미 입찰했는지/얼마인지"를 조회하는 API를 제공하지 않는다
// (GET /api/shop/role-auctions/current는 집계값만 준다). 그래서 "입찰 취소" 버튼은 서버에 물어보는 대신
// 이번 세션에서 성공적으로 입찰한 회차만 로컬로 기억해 보여준다 — 새로고침하면 다시 숨겨지지만,
// 입찰/재입찰 자체는 언제든 다시 낼 수 있어 기능상 막히지 않는다.
export default function RoleAuctionSection() {
  const [rounds, setRounds] = useState<RoleAuctionRound[] | null>(null)
  const [myStatus, setMyStatus] = useState<RolePurchaseStatus | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [biddedRoundIds, setBiddedRoundIds] = useState<Set<number>>(new Set())
  const [activeRoundId, setActiveRoundId] = useState<number | null>(null)

  const load = useCallback(() => {
    Promise.all([shopApi.getCurrentRounds(), shopApi.getMyRoleStatus()])
      .then(([roundsRes, statusRes]) => {
        setRounds(roundsRes.data ?? [])
        setMyStatus(statusRes.data ?? null)
      })
      .catch((e: unknown) => setLoadError(e instanceof ApiError ? e.message : T.loadFailed))
  }, [])

  useEffect(() => { load() }, [load])

  const activeRound = rounds?.find(r => r.id === activeRoundId) ?? null

  function handleBidPlaced() {
    if (activeRoundId != null) {
      setBiddedRoundIds(prev => new Set(prev).add(activeRoundId))
    }
    load()
  }

  function handleBidCancelled() {
    if (activeRoundId != null) {
      setBiddedRoundIds(prev => {
        const next = new Set(prev)
        next.delete(activeRoundId)
        return next
      })
    }
    load()
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

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveRoundId(round.id)}
                className="rounded-md bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700"
              >
                참여하기
              </button>
              {hasBid && (
                <span className="text-xs text-neutral-400">입찰하셨습니다.</span>
              )}
            </div>
          </div>
        )
      })}

      <PlaceBidModal
        open={activeRoundId != null}
        onClose={() => setActiveRoundId(null)}
        round={activeRound}
        hasBid={activeRoundId != null && biddedRoundIds.has(activeRoundId)}
        onBidPlaced={handleBidPlaced}
        onBidCancelled={handleBidCancelled}
      />
    </section>
  )
}
