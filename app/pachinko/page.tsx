import { redirect } from 'next/navigation'

// 파칭코는 게임센터 허브(/game-center/pachinko)로 통합되었다. 기존 링크·북마크 보존용 임시 리다이렉트.
export default function PachinkoPage() {
  redirect('/game-center/pachinko')
}
