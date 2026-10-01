import SectionCard from '@/components/common/SectionCard'
import { rankingApi } from '@/lib/api/points'
import { MESSAGES } from '@/lib/messages'

// 포인트 상위 랭킹(top-size명). 서버 컴포넌트로 렌더한다.
// 예전엔 메인 사이드바에 있었으나, 포인트가 게임 전용 재화가 되면서 게임센터 > 랭킹 탭으로 옮겼다
// (메인 그 자리는 엔화 환율 위젯).
//  - /api/points/ranking/top은 비로그인도 조회 가능하므로 인증 헤더가 필요 없다.
//  - "내 순위 보기" 링크는 마이페이지 랭킹 탭으로 딥링크한다(비로그인이면 마이페이지가 로그인으로 유도).
//  - 조회 실패/빈 랭킹이어도 사이드바 나머지는 그려야 하므로 catch로 부분 실패를 흡수한다
//    (page.tsx의 인기글 조회와 동일한 패턴).
export default async function PointRankingSection() {
  const res = await rankingApi.getTop().catch(() => null)
  const entries = res?.data?.entries ?? []

  return (
    <SectionCard
      title="포인트 랭킹"
      bulletColor="bg-yellow-500"
      href="/mypage?tab=ranking"
      linkLabel="내 순위 보기"
    >
      {entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-400 dark:text-neutral-500">
          {MESSAGES.ranking.empty}
        </p>
      ) : (
        // 메인은 표 대신 깔끔한 리스트로 — 순위·닉네임·포인트만 한 줄씩.
        <ul className="flex flex-col">
          {entries.map(entry => (
            <li key={entry.userId} className="flex items-center gap-2.5 py-1.5 text-sm">
              <span className="w-4 shrink-0 text-right font-semibold tabular-nums text-neutral-400 dark:text-neutral-500">
                {entry.rank}
              </span>
              <span className="min-w-0 flex-1 truncate text-neutral-700 dark:text-neutral-200">
                {entry.nickname}
              </span>
              <span className="shrink-0 font-bold tabular-nums text-orange-600 dark:text-orange-400">
                {entry.balance.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}
