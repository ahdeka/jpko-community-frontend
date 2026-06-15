import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import Header from '@/components/layout/Header'
import { categoriesApi } from '@/lib/api/categories'
import type { Category } from '@/types'
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata: Metadata = {
  title: 'JPKO Community',
  description: '일본에 관심 있는 한국인 커뮤니티',
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
      <body className="bg-neutral-100 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <AuthProvider>
          <Header categories={categories} />
          <div className="max-w-5xl mx-auto px-4 pb-6">
            <main className="rounded-b-lg border border-t-0 border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
              {children}
            </main>
          </div>
        </AuthProvider>
        {/* 사용자 방문/페이지뷰 추적용 */}
        <Analytics />
        {/* Core Web Vitals(로딩 성능) 측정용 */}
        <SpeedInsights />
      </body>
    </html>
  )
}