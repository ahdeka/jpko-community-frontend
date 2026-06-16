'use client'

import Link from 'next/link'
import Form from 'next/form'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import type { Category } from '@/types'

interface Props {
  categories: Category[]
}

// 비로그인 상태 프로필(로그인) 아이콘
function UserIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.42 3.58-7 8-7s8 2.58 8 7" />
    </svg>
  )
}

// 검색 아이콘
function SearchIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

export default function Header({ categories }: Props) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    await logout()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="w-full border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex justify-between items-center gap-3 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <Link href="/" className="font-extrabold text-xl text-orange-500 shrink-0">JPKO</Link>
          <Form action="/posts/search" className="flex-1 max-w-xs">
            <div className="relative">
              <input
                type="search"
                name="keyword"
                placeholder="검색"
                minLength={2}
                required
                className="w-full rounded-full border border-neutral-200 bg-neutral-100 py-1.5 pl-3 pr-9 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
              <button
                type="submit"
                aria-label="검색"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <SearchIcon />
              </button>
            </div>
          </Form>
          <nav className="flex items-center gap-3 text-sm shrink-0">
            {user ? (
              <>
                <Link href="/posts/new" className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200">
                  글쓰기
                </Link>
                <span className="text-neutral-600 dark:text-neutral-400">{user.nickname}</span>
                <button
                  onClick={handleLogout}
                  className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <Link
                href="/login"
                aria-label="로그인"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-700 text-white hover:bg-neutral-600 dark:bg-neutral-600 dark:hover:bg-neutral-500"
              >
                <UserIcon />
              </Link>
            )}
          </nav>
        </div>

        <nav className="flex items-center gap-4 text-sm overflow-x-auto py-3">
          <Link
            href="/posts"
            className={
              pathname === '/posts'
                ? 'font-semibold text-neutral-900 dark:text-white whitespace-nowrap'
                : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 whitespace-nowrap'
            }
          >
            전체
          </Link>
          {categories.map(category => {
            const href = `/posts/category/${category.slug}`
            const active = pathname === href
            return (
              <Link
                key={category.id}
                href={href}
                className={
                  active
                    ? 'font-semibold text-neutral-900 dark:text-white whitespace-nowrap'
                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 whitespace-nowrap'
                }
              >
                {category.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
