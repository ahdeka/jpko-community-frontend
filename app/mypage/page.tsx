import { Suspense } from 'react'
import MyPageContent from '@/components/mypage/MyPageContent'

// MyPageContent는 딥링크 초기 탭을 위해 useSearchParams(클라이언트 훅)를 쓴다.
// Next는 static page에서 useSearchParams를 쓰면 가장 가까운 Suspense 경계까지 CSR로 넘기며,
// 경계가 없으면 프로덕션 빌드가 실패한다. 그래서 여기서 <Suspense>로 감싼다.
// fallback은 null — 본문도 인증 확인(isLoading) 동안 아무것도 그리지 않으므로 깜빡임이 없다.
export default function MyPage() {
  return (
    <Suspense fallback={null}>
      <MyPageContent />
    </Suspense>
  )
}
