import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import Header from '@/components/layout/Header'
import { categoriesApi } from '@/lib/api/categories'
import type { Category } from '@/types'

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
      <body className="bg-neutral-950 text-neutral-100">
        <AuthProvider>
          <div className="max-w-6xl mx-auto px-4 py-6">
            <Header categories={categories} />
            <main>{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}