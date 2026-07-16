'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

// 관리자 영역 공통 레이아웃.
// 1) 접근 제어: 로그인 + role === 'ADMIN' 인 경우에만 콘텐츠를 렌더한다.
//    (백엔드도 공지 등록/수정/삭제에 @PreAuthorize("hasRole('ADMIN')")로
//     2차 검증하므로, 이 클라이언트 가드는 UX용이며 보안의 최종 방어선은 서버다.)
// 2) 좌측 사이드바 네비게이션을 모든 /admin/* 페이지에 공유한다.
export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const pathname = usePathname()

  if (isLoading) return null

  if (!user) {
    return (
      <div className="py-16 text-center text-sm text-neutral-500 dark:text-neutral-400">
        <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400">로그인</Link>
        {' '}이 필요합니다.
      </div>
    )
  }

  if (user.role !== 'ADMIN') {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">접근 권한이 없습니다.</p>
        <p className="mt-1 text-xs text-neutral-400">관리자 전용 페이지입니다.</p>
        <Link href="/" className="mt-4 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400">
          홈으로
        </Link>
      </div>
    )
  }

  const navItem = (href: string, label: string, exact = false) => {
    const active = exact ? pathname === href : pathname.startsWith(href)
    return (
      <Link
        key={href}
        href={href}
        className={
          active
            ? 'block rounded-md bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-600 dark:bg-orange-500/10 dark:text-orange-400'
            : 'block rounded-md px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
        }
      >
        {label}
      </Link>
    )
  }

  return (
    <div className="flex flex-col gap-6 sm:flex-row">
      {/* 사이드바 */}
      <aside className="shrink-0 sm:w-44">
        <div className="mb-3 flex items-center gap-2 px-1">
          <span className="inline-block h-2 w-2 rounded-full bg-orange-500" />
          <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">관리자</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto sm:flex-col sm:gap-0.5">
          {navItem('/admin', '대시보드', true)}
          {navItem('/admin/notices', '공지사항 관리')}
          {navItem('/admin/users', '회원 관리')}
          {navItem('/admin/reports', '신고 관리')}
        </nav>
      </aside>

      {/* 콘텐츠 */}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
