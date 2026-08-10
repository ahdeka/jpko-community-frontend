'use client'

import { useEffect, useState } from 'react'
import { rankingApi } from '@/lib/api/points'
import { ApiError } from '@/lib/api/client'
import { useAuth } from '@/lib/auth-context'
import { MESSAGES } from '@/lib/messages'
import { buildMyRankingList } from '@/lib/ranking'
import RankingTable from '@/components/ranking/RankingTable'
import type { MyRanking } from '@/types'

// 마이페이지 "랭킹" 탭. 내 순위 + 주변(위/아래 k명) + 상위 top-size명을 하나의 순위표로 보여준다.
// 부모(MyPage)가 로그인 사용자에게만 이 탭을 렌더하므로 user는 존재한다고 보되, 방어적으로 가드한다.
export default function MyRankingTab() {
  const { user } = useAuth()
  const [data, setData] = useState<MyRanking | null>(null)
  // 이 탭은 user에만 의존하는 "마운트 시 1회 로드"라, loading/error를 effect 본문에서 동기로
  // 리셋하지 않고 초기 state(로딩 true·에러 없음)로 둔다. 이렇게 하면 set-state-in-effect 규칙
  // (마운트 직후 동기 setState로 인한 연쇄 렌더 방지)에 걸리지 않는다. 실제 값 전환은 fetch의
  // then/catch/finally 콜백(=외부 시스템 응답)에서만 일어난다.
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    rankingApi
      .getMine()
      .then(res => {
        if (!cancelled) setData(res.data ?? null)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof ApiError ? e.message : MESSAGES.ranking.loadFailed)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  if (loading) {
    return <p className="py-12 text-center text-sm text-neutral-400">불러오는 중…</p>
  }
  if (error) {
    return <p className="py-12 text-center text-sm text-red-500">{error}</p>
  }
  if (!data) {
    return (
      <p className="py-12 text-center text-sm text-neutral-400 dark:text-neutral-500">
        {MESSAGES.ranking.empty}
      </p>
    )
  }

  // 랭킹 대상이 아니면 myRank가 null이고 neighbors도 비어, 리스트는 상위 랭킹만 남는다.
  const notRanked = data.myRank === null
  const items = buildMyRankingList(data)

  return (
    <div className="flex flex-col gap-4">
      {/* 요약 헤더: 내 순위를 크게 강조하거나, 아직 랭킹 밖이면 안내한다. */}
      <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-center dark:border-orange-500/30 dark:bg-orange-500/10">
        {notRanked ? (
          <p className="text-sm text-neutral-600 dark:text-neutral-300">{MESSAGES.ranking.notRanked}</p>
        ) : (
          <>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">내 순위</p>
            <p className="mt-1 text-3xl font-extrabold text-orange-600 dark:text-orange-400">
              {/* notRanked=false이므로 myRank는 non-null */}
              {data.myRank!.toLocaleString()}
              <span className="ml-0.5 text-lg font-bold">위</span>
            </p>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              {MESSAGES.ranking.totalCount(data.totalRanked)}
            </p>
          </>
        )}
      </div>

      {/* 통합 순위표: 상위권 블록 + (떨어져 있으면 순위칸에 …) + 내 주변 블록. 본인 행은 강조된다. */}
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-400 dark:text-neutral-500">
          {MESSAGES.ranking.empty}
        </p>
      ) : (
        <RankingTable items={items} myUserId={data.myUserId} />
      )}
    </div>
  )
}
