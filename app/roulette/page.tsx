import { redirect } from 'next/navigation'

// 룰렛은 게임센터 허브(/game-center/roulette)로 통합되었다. 기존 링크·북마크가 깨지지 않도록
// 이 경로는 새 위치로 임시(307) 리다이렉트만 한다. (아직 개발 중이라 영구 리다이렉트는 보류)
export default function RoulettePage() {
  redirect('/game-center/roulette')
}
