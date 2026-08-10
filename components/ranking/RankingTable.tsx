import type { RankingListItem } from '@/lib/ranking'

// 순위·닉네임·포인트 3열을 고정폭 그리드로 정렬해 "표" 느낌을 낸다. 헤더 + 행들이 같은 그리드
// 정의(GRID)를 공유하므로 열이 정확히 맞아떨어진다. 서버·클라이언트 양쪽에서 렌더하므로
// ('use client' 없음) 상태 없이 props만으로 그린다.
const GRID = 'grid grid-cols-[2.25rem_1fr_auto] items-center gap-3'

// 행 배경색. 본인 행만 배경으로 강조한다(별도 배지/텍스트 색 강조는 쓰지 않는다).
function rowBgClass(isMe: boolean): string {
  return isMe ? 'bg-orange-100 dark:bg-orange-500/20' : ''
}

interface Props {
  items: RankingListItem[]
  // 본인 식별용. 넘기면 userId가 일치하는 행을 배경색으로 강조한다. 메인 상위 랭킹처럼 본인을
  // 특정할 수 없는 곳(서버 컴포넌트)에서는 넘기지 않으므로 강조가 생기지 않는다.
  myUserId?: number | null
}

export default function RankingTable({ items, myUserId }: Props) {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
      {/* 헤더 행 */}
      <div
        className={`${GRID} border-b border-neutral-200 bg-neutral-100 px-3 py-2 text-[11px] font-medium text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-400`}
      >
        <span>순위</span>
        <span>닉네임</span>
        <span className="text-right">포인트</span>
      </div>

      {/* 본문: 행 사이 구분선으로 표 느낌을 강화한다 */}
      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {items.map(item => {
          // 생략(…) 행: "순위" 칸에만 표시하고 닉네임·포인트 칸은 비워, 위/아래로 데이터가
          // 더 있다는 느낌만 준다.
          if (item.kind === 'gap') {
            return (
              <div
                key={item.id}
                className={`${GRID} px-3 py-1.5 text-neutral-400 dark:text-neutral-500`}
                aria-hidden
              >
                <span className="text-sm font-bold tracking-widest">⋯</span>
                <span />
                <span />
              </div>
            )
          }

          const { entry } = item
          const isMe = myUserId != null && entry.userId === myUserId

          return (
            <div key={entry.userId} className={`${GRID} px-3 py-2 ${rowBgClass(isMe)}`}>
              {/* 순위 (숫자만) */}
              <span className="text-sm font-semibold tabular-nums text-neutral-500 dark:text-neutral-400">
                {entry.rank}
              </span>

              {/* 닉네임. grid 셀이 줄어들 수 있게 min-w-0, block truncate로 넘침 처리 */}
              <span className="block min-w-0 truncate text-sm text-neutral-700 dark:text-neutral-200">
                {entry.nickname}
              </span>

              {/* 포인트 (헤더가 단위를 알려주므로 값은 숫자만, 우측 정렬) */}
              <span className="text-right text-sm font-bold tabular-nums text-neutral-600 dark:text-neutral-300">
                {entry.balance.toLocaleString()}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
