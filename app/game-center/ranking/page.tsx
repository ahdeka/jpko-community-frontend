import type { Metadata } from 'next'
import PointRankingSection from '@/components/ranking/PointRankingSection'
import { NOINDEX_ROBOTS } from '@/lib/site'

// 색인 차단 이유는 룰렛 탭 주석 참고(상위 레이아웃이 클라이언트 컴포넌트라 탭마다 붙인다).
export const metadata: Metadata = { title: '포인트 랭킹', robots: NOINDEX_ROBOTS }

// 랭킹은 게임 결과로 수시로 바뀌므로 빌드 시 정적으로 굳지 않게 매 요청 렌더한다(메인 페이지와 동일).
export const revalidate = 0

// 게임센터 > 랭킹 탭. 로그인 게이트·제목은 상위 레이아웃이 처리한다.
export default function GameCenterRankingPage() {
  return <PointRankingSection />
}
