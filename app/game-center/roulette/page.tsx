import RouletteGame from '@/components/points/RouletteGame'

// 게임센터 > 룰렛 탭. 로그인 게이트·제목은 상위 레이아웃(app/game-center/layout.tsx)이 처리하므로
// 이 페이지는 게임 본체만 렌더한다(서버 컴포넌트가 클라이언트 게임을 감쌈).
export default function GameCenterRoulettePage() {
  return <RouletteGame />
}
