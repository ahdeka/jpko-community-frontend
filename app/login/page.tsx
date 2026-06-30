import type { Metadata } from 'next'
import LoginForm from '@/components/auth/LoginForm'

export const metadata: Metadata = { title: '로그인' }

export default function LoginPage() {
  return (
    <div className="max-w-sm mx-auto mt-16">
      <LoginForm />
    </div>
  )
}
