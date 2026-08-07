'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { shopApi } from '@/lib/api/shop'
import { ApiError } from '@/lib/api/client'
import { MESSAGES } from '@/lib/messages'
import RoleAuctionSection from '@/components/shop/RoleAuctionSection'
import RouletteShieldSection from '@/components/shop/RouletteShieldSection'
import type { ShopItem } from '@/types'

const T = MESSAGES.shop.catalog

// 상점 허브 페이지. /roulette와 동일한 패턴(로그인 게이트, 독립 라우트)을 따른다.
export default function ShopPage() {
  const { user, isLoading } = useAuth()
  const [blockItems, setBlockItems] = useState<ShopItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    shopApi.getItems()
      .then(res => setBlockItems((res.data ?? []).filter(item => item.type === 'BLOCK')))
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : T.loadFailed))
  }, [user])

  if (isLoading) return null

  if (!user) {
    return (
      <div className="py-16 text-center text-sm text-neutral-500 dark:text-neutral-400">
        <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400">로그인</Link>
        {' '}{T.loginGateSuffix}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-bold">상점</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{T.description}</p>
      </div>

      <section>
        <h2 className="mb-3 text-base font-bold text-neutral-900 dark:text-neutral-100">활동 차단권</h2>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {!error && blockItems === null && (
          <p className="py-6 text-center text-sm text-neutral-400">불러오는 중…</p>
        )}
        {blockItems?.map(item => (
          <div key={item.id} className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-800 dark:text-neutral-100">{item.name}</span>
              <span className="font-bold text-red-600 dark:text-red-400">{item.price?.toLocaleString()}P</span>
            </div>
            {item.durationMinutes != null && (
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                {Math.round(item.durationMinutes / 60)}{T.blockItemDurationSuffix}
              </p>
            )}
            <p className="mt-2 text-xs text-neutral-400">{T.blockItemHint}</p>
          </div>
        ))}
      </section>

      <RouletteShieldSection />

      <RoleAuctionSection />
    </div>
  )
}
