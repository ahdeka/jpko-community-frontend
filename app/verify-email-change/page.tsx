import type { Metadata } from 'next'
import VerifyEmailChangeClient from '@/components/auth/VerifyEmailChangeClient'

export const metadata: Metadata = {
  title: '이메일 인증',
  // 개인 토큰 링크이므로 색인 차단.
  robots: { index: false, follow: false },
}

// SES 이메일 변경/등록 인증 메일의 링크(https://www.jpkocommunity.site/verify-email-change?token=...)가 여는 페이지.
export default async function VerifyEmailChangePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  return (
    <div className="mx-auto mt-16 max-w-sm px-4">
      <div className="animate-fade-in-up rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <VerifyEmailChangeClient token={token ?? ''} />
      </div>
    </div>
  )
}
