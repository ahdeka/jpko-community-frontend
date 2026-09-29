import type { Metadata } from 'next'
import FindAccountForm from '@/components/auth/FindAccountForm'

// URL은 기존 링크 호환을 위해 /forgot-password를 유지한다(아이디 찾기도 이 화면에서 함께 처리).
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
