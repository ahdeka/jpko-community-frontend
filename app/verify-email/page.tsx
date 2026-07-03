import type { Metadata } from 'next'
import VerifyEmailClient from '@/components/auth/VerifyEmailClient'

export const metadata: Metadata = {
  title: '이메일 인증',
  // 인증 결과 페이지는 색인 대상이 아니다(개인 토큰 링크).
  robots: { index: false, follow: false },
}

// SES 인증 메일의 링크(https://www.jpkocommunity.site/verify-email?token=...)가 여는 페이지.
// 토큰은 서버에서 searchParams로 읽어 클라이언트 컴포넌트에 넘긴다.
// (useSearchParams는 Suspense 경계가 필요하므로, page의 searchParams prop로 전달하는 방식이 더 단순하다.)
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  return (
    <div className="mx-auto mt-16 max-w-sm px-4">
      <div className="animate-fade-in-up rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <VerifyEmailClient token={token ?? ''} />
      </div>
    </div>
  )
}
