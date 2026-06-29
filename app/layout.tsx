import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { categoriesApi } from '@/lib/api/categories'
import type { Category } from '@/types'
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, INDEXING_ENABLED } from '@/lib/site'

const SITE_TITLE = `${SITE_NAME} - 일본 생활·취업·유학 한국인 커뮤니티`

export const metadata: Metadata = {
  // 상대 OG/canonical URL을 절대경로로 만들기 위한 기준
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    // 하위 페이지는 "글 제목 | JPKO Community" 형태로 자동 구성
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ['일본', '일본생활', '일본취업', '일본유학', '워킹홀리데이', '일본 커뮤니티', '한국인'],
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'ko_KR',
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  // 보안·법령 게이트 전(기본)에는 색인을 차단한다. 게이트 통과 후 환경변수로 개방.
  robots: INDEXING_ENABLED
    ? { index: true, follow: true }
    : { index: false, follow: false },
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  let categories: Category[] = []

  try {
    const res = await categoriesApi.getAll()
    categories = (res.data ?? []).slice().sort((a, b) => a.displayOrder - b.displayOrder)
  } catch {}

  return (
    <html lang="ko">
      <body className="flex min-h-screen flex-col bg-neutral-100 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <AuthProvider>
          <Header categories={categories} />
          {/* flex-1로 본문이 남은 높이를 채워, 짧은 페이지에서도 footer가 하단에 붙는다 */}
          <div className="mx-auto w-full max-w-5xl flex-1 px-4 pb-6">
            <main className="rounded-b-lg border border-t-0 border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
              {children}
            </main>
          </div>
        </AuthProvider>
        <Footer />
        {/* 사용자 방문/페이지뷰 추적용 */}
        <Analytics />
        {/* Core Web Vitals(로딩 성능) 측정용 */}
        <SpeedInsights />
      </body>
    </html>
  )
}