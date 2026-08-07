'use client'

import Link from 'next/link'
import Form from 'next/form'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import UserMenu from './UserMenu'
import NotificationBell from './NotificationBell'
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
  const { user, isLoading, logout } = useAuth()
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
            {isLoading ? (
              // 인증 확인 중에는 중립 스켈레톤을 보여, 로그인 사용자가 "로그인 아이콘 → 닉네임"으로
              // 깜빡이는 것을 막는다. (로그아웃 사용자도 동일 자리에 부드럽게 로그인 아이콘이 들어옴)
              <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-700" aria-hidden="true" />
            ) : user ? (
              <>
                <NotificationBell />
                <UserMenu user={user} onLogout={handleLogout} />
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

        {/*
          카테고리 라인. 왼쪽은 가로 스크롤되는 카테고리 목록, 오른쪽 끝에 "게임센터 입장" 진입점을 고정한다.
          - 바깥 div가 정렬 기준(스크롤 X)이고, 안쪽 nav만 overflow-x-auto로 스크롤한다.
            (게임센터 링크까지 스크롤 컨테이너에 넣으면 카테고리가 많을 때 링크가 화면 밖으로 밀려나 안 보임)
          - flex-1 + min-w-0: 카테고리 nav가 남은 폭을 차지하되, min-w-0이 있어야 자식이 넘칠 때 실제로 스크롤된다.
        */}
        <div className="flex items-center gap-3">
          <nav className="flex flex-1 items-center gap-4 overflow-x-auto py-3 text-sm min-w-0">
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
          {/*
            게임센터 진입점. 카테고리 링크와 동일한 텍스트 스타일을 쓰되, shrink-0으로 스크롤에 눌리지 않고
            항상 우측에 노출된다. 게임센터 하위(룰렛/파칭코/슬롯) 어디에 있든 활성 강조가 유지되도록 startsWith로 판정한다.
          */}
          <Link
            href="/game-center"
            aria-current={pathname.startsWith('/game-center') ? 'page' : undefined}
            className={
              pathname.startsWith('/game-center')
                ? 'mr-2 shrink-0 whitespace-nowrap text-sm font-semibold text-neutral-900 dark:text-white'
                : 'mr-2 shrink-0 whitespace-nowrap text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
            }
          >
            게임센터
          </Link>
        </div>
      </div>
    </header>
  )
}
