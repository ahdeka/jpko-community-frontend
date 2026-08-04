import type { Metadata } from 'next'
import SignupCompleteForm from '@/components/auth/SignupCompleteForm'

export const metadata: Metadata = {
  title: '회원가입',
  // 개인 토큰 링크이므로 색인 차단.
  robots: { index: false, follow: false },
}

// SES 가입 인증 메일의 링크(https://www.jpkocommunity.site/signup/{token})가 여는 페이지.
// 토큰은 경로 파라미터로 전달되며, 클라이언트 컴포넌트가 검증 후 가입 폼을 그린다.
export default async function SignupCompletePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  return (
    <div className="mx-auto mt-16 max-w-sm px-4">
      <div className="animate-fade-in-up rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <SignupCompleteForm token={token ?? ''} />
      </div>
    </div>
  )
}
