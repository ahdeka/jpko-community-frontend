import type { Metadata } from 'next'
import LoginForm from '@/components/auth/LoginForm'

export const metadata: Metadata = { title: '로그인' }

export default function LoginPage() {
  return (
    <div className="max-w-sm mx-auto mt-16 px-4">
      <div className="animate-fade-in-up rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 shadow-sm">
        <LoginForm />
      </div>
    </div>
  )
}
