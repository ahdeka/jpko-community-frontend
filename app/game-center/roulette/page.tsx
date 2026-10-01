import type { Metadata } from 'next'
import RouletteGame from '@/components/points/RouletteGame'
import GameRankingPanel from '@/components/ranking/GameRankingPanel'
import { NOINDEX_ROBOTS } from '@/lib/site'

// 상위 레이아웃이 'use client'라 metadata를 export할 수 없어, 색인 차단은 탭 페이지마다 붙인다.
// (게임센터 루트 /game-center는 곧바로 이 경로로 redirect되므로 따로 붙일 필요가 없다)
export const metadata: Metadata = { title: '룰렛', robots: NOINDEX_ROBOTS }

// 랭킹 패널이 빌드 시점 순위로 굳지 않도록 매 요청 렌더한다(게임 본체는 클라이언트라 영향 없음).
export const revalidate = 0

// 게임센터 > 룰렛 탭. 로그인 게이트·제목은 상위 레이아웃(app/game-center/layout.tsx)이 처리하므로
// 이 페이지는 게임 본체만 렌더한다(서버 컴포넌트가 클라이언트 게임을 감쌈).
export default function GameCenterRoulettePage() {
  return <RouletteGame ranking={<GameRankingPanel />} />
}
