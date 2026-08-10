import type { MyRanking, RankingEntry } from '@/types'

// 마이페이지 통합 순위표에서 그릴 아이템 한 개.
//  - kind:'entry' : 실제 랭킹 한 줄
//  - kind:'gap'   : 상위권 블록과 내 주변 블록 사이가 떨어져 있을 때 넣는 "…" 생략 표시
//    (id는 React key 전용 — 앞뒤 rank로 만들어 유일성을 보장한다)
export type RankingListItem =
  | { kind: 'entry'; entry: RankingEntry }
  | { kind: 'gap'; id: string }

// topEntries(상위 N명)와 neighbors(내 위 k + 나 + 아래 k)를 하나의 정렬된 순위표로 합친다.
//
// 왜 프론트에서 합치나: 백엔드는 두 블록을 따로 내려준다(중복 전송 최소화). 내가 상위권이면
// 두 블록이 겹치고, 멀리 있으면 사이가 비므로 그 처리를 화면단에서 한다.
//
// 규칙(엣지케이스 명시):
//  1) userId 기준 dedupe — 내가 3위처럼 상위권이면 topEntries와 neighbors에 같은 유저가 중복된다.
//     같은 유저는 백엔드 정렬이 일관돼 rank도 항상 같으므로, 어느 쪽 항목을 남겨도 무방하다.
//     (rank가 아니라 userId로 dedupe하는 이유: 향후 tie-break 정책이 바뀌어도 안전하게 하려고.)
//  2) rank 오름차순 정렬 — dedupe 후 뒤섞인 순서를 순위대로 정렬한다. rank는 유니크(공동순위 없음)라
//     정렬 결과가 결정적이다.
//  3) 인접한 두 줄의 rank 차이가 2 이상이면 그 사이에 gap('…')을 하나 끼운다.
//     - 내가 3위(연속: …,2,3,4,…): 인접 차이가 모두 1이라 gap 없음.
//     - 내가 100위(1~5위 / 95~105위): 5위와 95위 사이 차이가 크므로 gap 1개.
//     - 전체 인원이 top-size 이하: top과 neighbors가 사실상 같아 dedupe 후 연속 → gap 없음.
//
// myRank가 null(랭킹 대상 아님)이면 neighbors가 빈 배열이라, 결과는 topEntries만 rank순으로 남는다
// (top은 1..N 연속이라 gap도 생기지 않는다).
export function buildMyRankingList(my: MyRanking): RankingListItem[] {
  // 1) userId 기준 dedupe. Map은 나중에 넣은 값으로 덮어쓰므로, 어느 블록을 먼저 넣든 결과는 같다.
  const byUserId = new Map<number, RankingEntry>()
  for (const entry of [...my.topEntries, ...my.neighbors]) {
    byUserId.set(entry.userId, entry)
  }

  // 2) rank 오름차순 정렬
  const sorted = [...byUserId.values()].sort((a, b) => a.rank - b.rank)

  // 3) 인접 rank 차이가 2 이상인 지점에 gap 삽입
  const items: RankingListItem[] = []
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i]
    if (i > 0) {
      const prev = sorted[i - 1]
      if (current.rank - prev.rank >= 2) {
        items.push({ kind: 'gap', id: `gap-${prev.rank}-${current.rank}` })
      }
    }
    items.push({ kind: 'entry', entry: current })
  }

  // 맨 아래: 목록의 마지막 순위 밑으로 아직 유저가 더 있으면(예: 내가 16위이고 전체가 30명)
  // 하단에도 생략(…)을 넣어 "아래로 더 있다"는 느낌을 준다. totalRanked로 판단한다.
  // (상단은 topEntries가 항상 1위부터 포함하므로 생략 표시가 필요 없다.)
  const last = sorted[sorted.length - 1]
  if (last && last.rank < my.totalRanked) {
    items.push({ kind: 'gap', id: `gap-${last.rank}-end` })
  }

  return items
}
