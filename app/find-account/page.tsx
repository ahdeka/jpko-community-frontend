import type { Metadata } from 'next'
import FindAccountForm from '@/components/auth/FindAccountForm'

// 아이디/비밀번호 찾기 통합 화면. 구 URL(/forgot-password)은 next.config.ts에서 이곳으로 영구 리다이렉트한다.
export const metadata: Metadata = { title: '아이디/비밀번호 찾기' }

export default function FindAccountPage() {
  return (
    <div className="mx-auto mt-16 max-w-sm px-4">
      <div className="animate-fade-in-up rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <FindAccountForm />
      </div>
    </div>
  )
}
