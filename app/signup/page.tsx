import SignupForm from '@/components/auth/SignupForm'

export default function SignupPage() {
  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className="text-xl font-bold mb-6 text-center">회원가입</h1>
      <SignupForm />
    </div>
  )
}
