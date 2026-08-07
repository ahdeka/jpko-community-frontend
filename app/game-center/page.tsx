import { redirect } from 'next/navigation'

// /game-center 진입 시 기본 탭(룰렛)으로 보낸다. 탭 UI가 항상 URL과 1:1로 맞아떨어지도록,
// 게임센터 루트는 자체 화면을 갖지 않고 첫 게임 경로로 즉시 치환(replace)한다.
export default function GameCenterPage() {
  redirect('/game-center/roulette')
}
