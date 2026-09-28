import type { Metadata } from 'next'
import SlotGame from '@/components/points/SlotGame'
import { NOINDEX_ROBOTS } from '@/lib/site'

// 색인 차단 이유는 룰렛 탭 주석 참고(상위 레이아웃이 클라이언트 컴포넌트라 탭마다 붙인다).
export const metadata: Metadata = { title: '슬롯', robots: NOINDEX_ROBOTS }

// 게임센터 > 슬롯 탭. 로그인 게이트·제목은 상위 레이아웃이 처리한다(룰렛 탭과 동일 구조).
export default function GameCenterSlotPage() {
  return <SlotGame />
}
