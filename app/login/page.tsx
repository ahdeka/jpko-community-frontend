import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className="text-xl font-bold mb-6 text-center">로그인</h1>
      <LoginForm />
    </div>
  )
}
