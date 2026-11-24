import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ArchiveBanner from '@/components/layout/ArchiveBanner'
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
  // 정본 URL 선언. './'는 Next가 "현재 라우트 경로"로 치환하므로(resolveRelativeUrl),
  // 각 페이지가 자기 경로의 canonical을 자동으로 갖는다. (예: /posts/34 → {metadataBase}/posts/34)
  // 하위 페이지가 alternates를 따로 정의하지 않는 한 이 설정이 상속된다.
  // 목적: apex·vercel.app·쿼리스트링이 붙은 주소로 들어와도 정본(www)을 한 곳으로 모은다.
  // types: 모든 페이지 <head>에 <link rel="alternate" type="application/rss+xml">를 넣어
  // 검색 로봇·RSS 리더가 피드 주소(/rss.xml)를 스스로 찾게 한다.
  alternates: { canonical: './', types: { 'application/rss+xml': '/rss.xml' } },
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
  // 검색엔진·광고 사이트 소유확인 토큰.
  // verification.other는 키를 meta name으로 그대로 쓰므로
  // <meta name="naver-site-verification" content="..."> 가 모든 페이지에 렌더된다.
  // 네이버는 HTML 파일 방식(public/naver...html)도 함께 두어 이중으로 대비한다.
  //
  // google-adsense-account: AdSense 사이트 소유권 확인용(광고 게재용 스크립트와는 별개).
  // 게시자 ID는 페이지 소스에 그대로 노출되는 공개 값이라 하드코딩해도 된다.
  // 참고: 이 버전 Next는 동적 페이지(게시글 상세 등)에서 일반 브라우저에는 메타데이터를
  // <body> 끝에 스트리밍하지만, Google 크롤러(Mediapartners-Google 등 htmlLimitedBots)와
  // 홈(/)에는 <head>로 내보낸다. AdSense 확인은 이 경로로 이뤄지므로 문제없다.
  verification: {
    other: {
      'naver-site-verification': '346693e372af463e0e73cf3b3cd1067ece082a76',
      'google-adsense-account': 'ca-pub-9994919174977368',
    },
  },
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
          {/* flex-1로 본문이 남은 높이를 채워, 짧은 페이지에서도 footer가 하단에 붙는다.
              모바일(sm 미만)은 본문 카드를 화면 끝까지 붙인다(full-bleed): 바깥 여백(px-4) + 카드 테두리 +
              안쪽 여백(p-4)이 겹쳐 양옆 약 33px씩 버려졌고, 헤더 로고(16px)와 본문 시작선(33px)도 어긋났다.
              바깥 여백과 좌우 테두리·둥근 모서리를 없애 본문 시작선을 헤더와 같은 16px에 맞춘다.
              데스크탑(sm 이상)은 기존의 떠 있는 카드 모양 그대로다. */}
          <div className="mx-auto w-full max-w-5xl flex-1 pb-6 sm:px-4">
            <main className="border-b border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 sm:rounded-b-lg sm:border-x sm:p-6">
              <ArchiveBanner />
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