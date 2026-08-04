import type { Metadata } from 'next'
import OnboardingClient from '@/components/auth/OnboardingClient'

export const metadata: Metadata = {
  title: '계정 전환',
  // 로그인 사용자 전용 전환 화면이므로 색인 대상이 아니다.
  robots: { index: false, follow: false },
}

// 기존 유저 온보딩(마이그레이션) 화면. 접근 제어·단계 판단은 전적으로 클라이언트에서 한다
// (useAuth().user 기준). 전역 가드(AuthProvider)가 needsOnboarding 유저를 이 경로로 모은다.
export default function OnboardingPage() {
  return (
    <div className="mx-auto mt-16 max-w-sm px-4">
      <div className="animate-fade-in-up rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <OnboardingClient />
      </div>
    </div>
  )
}
