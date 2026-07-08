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
    // data-theme 기본값은 "light"(SSR 결과). 아래 인라인 스크립트가 첫 페인트 전에
    // localStorage/시스템 설정에 맞춰 값을 고쳐 넣으므로, 그 불일치는 정상이라
    // suppressHydrationWarning으로 React 경고를 끈다.
    <html lang="ko" data-theme="light" suppressHydrationWarning>
      <head>
        {/*
          테마 깜빡임(FOUC) 방지: 브라우저가 HTML을 파싱하는 동안 "동기적으로" 실행되어
          React 하이드레이션·첫 페인트보다 먼저 data-theme을 확정한다.
          우선순위: 저장된 사용자 선택(localStorage) > 시스템 설정(prefers-color-scheme).
          try/catch는 localStorage 접근이 막힌 환경(시크릿 모드 등)에서의 예외를 삼킨다.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
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