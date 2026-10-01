import { Suspense } from 'react'
import Link from 'next/link'
import { rankingApi } from '@/lib/api/points'
import { MESSAGES } from '@/lib/messages'

// 게임센터 각 게임(룰렛·파칭코·슬롯) 오른쪽 칸 맨 위의 작은 포인트 랭킹(상위 top-size명). 서버 컴포넌트.
// 아래에 오는 확률 공개 패널(GameOddsPanel)과 같은 카드 스타일을 써서 한 칸으로 읽히게 한다.
//
// 데이터 흐름: 게임 페이지(page.tsx, 서버)가 <GameRankingPanel />을 만들어 클라이언트 게임 컴포넌트에
// ReactNode prop으로 넘긴다. 서버 컴포넌트는 서버에서 렌더된 결과만 전달되므로, 게임이 클라이언트
// 컴포넌트여도 랭킹 조회는 서버에서 1번 일어나고 브라우저는 추가 요청을 하지 않는다.
//
// 성능: 백엔드는 활성 유저 상위 5명을 랭킹 인덱스(idx_points_ranking)로 LIMIT 조회하는 쿼리 1개라 가볍다.
// Suspense로 감싸서, 랭킹 조회를 기다리는 동안에도 게임 화면은 먼저 그려진다(조회가 느려도 게임을 막지 않음).
//
// 갱신 시점: 탭에 들어올 때(페이지 요청) 기준이다. 게임을 돌려 잔액이 바뀌어도 이 패널은 즉시 바뀌지 않는다
// — 순위표를 매 판마다 다시 부르면 게임 1판 = 랭킹 쿼리 1회가 되어, 얻는 것에 비해 비용이 크다.
export default function GameRankingPanel() {
  return (
    <Suspense fallback={null}>
      <RankingList />
    </Suspense>
  )
}

async function RankingList() {
  // 조회 실패면 빈 카드 대신 패널을 숨긴다(확률 표는 그대로 보인다).
  const res = await rankingApi.getTop().catch(() => null)
  if (!res) return null
  const entries = res.data?.entries ?? []

  return (
    <aside className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">포인트 랭킹</h2>
        <Link
          href="/mypage?tab=ranking"
          className="text-[11px] text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
        >
          내 순위
        </Link>
      </div>

      {entries.length === 0 ? (
        <p className="py-3 text-center text-xs text-neutral-400 dark:text-neutral-500">
          {MESSAGES.ranking.empty}
        </p>
      ) : (
        <ol className="mt-2 flex flex-col">
          {entries.map(entry => (
            <li
              key={entry.userId}
              className="flex items-center gap-2 border-t border-neutral-100 py-1.5 text-xs first:border-t-0 dark:border-neutral-800"
            >
              <span className="w-3 shrink-0 text-right font-semibold tabular-nums text-neutral-400 dark:text-neutral-500">
                {entry.rank}
              </span>
              {/* 칸 폭이 15rem으로 좁아 긴 닉네임은 말줄임 처리한다(포인트 숫자는 항상 다 보이게). */}
              <span className="min-w-0 flex-1 truncate text-neutral-700 dark:text-neutral-200">
                {entry.nickname}
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-orange-600 dark:text-orange-400">
                {entry.balance.toLocaleString()}
              </span>
            </li>
          ))}
        </ol>
      )}
    </aside>
  )
}
