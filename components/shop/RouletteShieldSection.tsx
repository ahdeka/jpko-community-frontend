'use client'

import { useCallback, useEffect, useState } from 'react'
import { shopApi } from '@/lib/api/shop'
import { notifyPointBalanceChanged } from '@/lib/api/points'
import { ApiError } from '@/lib/api/client'
import { formatDateTime } from '@/lib/format'
import { MESSAGES } from '@/lib/messages'
import type { RouletteShieldStatus, ShopItem } from '@/types'

const T = MESSAGES.shop.shield

// 룰렛 방어권 섹션. RoleAuctionSection과 같은 자기완결형 구조(조회 + 내 상태 배너 + 카드 목록)를
// 따르되, 대상 유저 선택이 필요 없는 자기 자신 대상 구매라 별도 모달 없이 카드에서 바로 구매한다.
export default function RouletteShieldSection() {
  const [items, setItems] = useState<ShopItem[] | null>(null)
  const [myStatus, setMyStatus] = useState<RouletteShieldStatus | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [buyingId, setBuyingId] = useState<number | null>(null)
  const [buyError, setBuyError] = useState<string | null>(null)

  const load = useCallback(() => {
    Promise.all([shopApi.getItems(), shopApi.getMyShieldStatus()])
      .then(([itemsRes, statusRes]) => {
        setItems((itemsRes.data ?? []).filter(item => item.type === 'SHIELD'))
        setMyStatus(statusRes.data ?? null)
      })
      .catch((e: unknown) => setLoadError(e instanceof ApiError ? e.message : T.loadFailed))
  }, [])

  useEffect(() => { load() }, [load])

  async function handleBuy(item: ShopItem) {
    if (buyingId != null) return
    setBuyError(null)
    setBuyingId(item.id)
    try {
      await shopApi.purchaseShield({ itemId: item.id })
      // 방어권 구매는 포인트를 소모하므로 헤더 잔액을 재조회하게 알린다.
      notifyPointBalanceChanged()
      load()
    } catch (e) {
      setBuyError(e instanceof ApiError ? e.message : T.loadFailed)
    } finally {
      setBuyingId(null)
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">방어권</h2>

      {myStatus?.active && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
          {T.myStatusActive(myStatus.expiresAt ? formatDateTime(myStatus.expiresAt) : '')}
        </div>
      )}

      {loadError && <p className="text-sm text-red-500">{loadError}</p>}

      {!loadError && items === null && (
        <p className="py-6 text-center text-sm text-neutral-400">불러오는 중…</p>
      )}

      {items !== null && items.length === 0 && (
        <p className="py-6 text-center text-sm text-neutral-400">{T.empty}</p>
      )}

      {items?.map(item => (
        <div key={item.id} className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-neutral-800 dark:text-neutral-100">{item.name}</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{item.price?.toLocaleString()}P</span>
          </div>
          {item.durationMinutes != null && (
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              {Math.round(item.durationMinutes / 60)}{T.durationSuffix}
            </p>
          )}
          <p className="mt-2 text-xs text-neutral-400">{T.hint}</p>
          <button
            type="button"
            onClick={() => handleBuy(item)}
            disabled={buyingId === item.id}
            className="mt-3 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {buyingId === item.id ? T.buying : T.buy}
          </button>
        </div>
      ))}

      {buyError && <p className="text-sm text-red-500">{buyError}</p>}
    </section>
  )
}
