import type { Metadata } from 'next'
import SignupForm from '@/components/auth/SignupForm'

export const metadata: Metadata = { title: '회원가입' }

export default function SignupPage() {
  return (
    <div className="max-w-sm mx-auto mt-16">
      <SignupForm />
    </div>
  )
}
