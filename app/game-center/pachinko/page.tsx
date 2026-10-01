import type { Metadata } from 'next'
import PachinkoGame from '@/components/points/PachinkoGame'
import GameRankingPanel from '@/components/ranking/GameRankingPanel'
import { NOINDEX_ROBOTS } from '@/lib/site'

// 색인 차단 이유는 룰렛 탭 주석 참고(상위 레이아웃이 클라이언트 컴포넌트라 탭마다 붙인다).
export const metadata: Metadata = { title: '파칭코', robots: NOINDEX_ROBOTS }

// 랭킹 패널이 빌드 시점 순위로 굳지 않도록 매 요청 렌더한다(게임 본체는 클라이언트라 영향 없음).
export const revalidate = 0

// 게임센터 > 파칭코 탭. 로그인 게이트·제목은 상위 레이아웃이 처리한다(룰렛 탭과 동일 구조).
export default function GameCenterPachinkoPage() {
  return <PachinkoGame ranking={<GameRankingPanel />} />
}
