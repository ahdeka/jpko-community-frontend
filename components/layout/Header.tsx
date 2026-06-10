'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import type { Category } from '@/types'

interface Props {
  categories: Category[]
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
    <header className="border-b border-neutral-800 pb-4 mb-6">
      <div className="flex justify-between items-center mb-3">
        <Link href="/" className="font-extrabold text-xl text-orange-500">JPKO</Link>
        <nav className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <Link href="/posts/new" className="text-neutral-400 hover:text-neutral-200">
                글쓰기
              </Link>
              <span className="text-neutral-400">{user.nickname}</span>
              <button
                onClick={handleLogout}
                className="text-neutral-500 hover:text-neutral-300"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-neutral-400 hover:text-neutral-200">
                로그인
              </Link>
              <Link
                href="/signup"
                className="bg-orange-500 text-white px-3 py-1 rounded text-xs hover:bg-orange-600"
              >
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>

      <nav className="flex items-center gap-4 text-sm overflow-x-auto">
        <Link
          href="/"
          className={
            pathname === '/'
              ? 'font-semibold text-white whitespace-nowrap'
              : 'text-neutral-400 hover:text-neutral-200 whitespace-nowrap'
          }
        >
          전체
        </Link>
        {categories.map(category => {
          const href = `/posts/category/${category.id}`
          const active = pathname === href
          return (
            <Link
              key={category.id}
              href={href}
              className={
                active
                  ? 'font-semibold text-white whitespace-nowrap'
                  : 'text-neutral-400 hover:text-neutral-200 whitespace-nowrap'
              }
            >
              {category.name}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
