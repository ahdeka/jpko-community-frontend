import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import Header from '@/components/layout/Header'

export const metadata: Metadata = {
  title: 'JPKO Community',
  description: '일본에 관심 있는 한국인 커뮤니티',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          <div className="max-w-4xl mx-auto px-4 py-6">
            <Header />
            <main>{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}