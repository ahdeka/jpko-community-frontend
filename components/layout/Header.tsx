'use client'

import Link from 'next/link'
import Form from 'next/form'
import { usePathname } from 'next/navigation'
import ScrollFadeNav from '@/components/common/ScrollFadeNav'
import type { Category } from '@/types'

interface Props {
  categories: Category[]
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
  const pathname = usePathname()

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
          {/* 아카이브: 로그인·알림이 없으므로 사용자 영역 대신 보관 상태를 표시한다. */}
          <span className="shrink-0 rounded-full border border-neutral-300 px-2.5 py-0.5 text-xs text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
            아카이브
          </span>
        </div>

        {/*
          카테고리 라인. 왼쪽은 가로 스크롤되는 카테고리 목록, 오른쪽 끝에 "게임센터 입장" 진입점을 고정한다.
          - 바깥 div가 정렬 기준(스크롤 X)이고, 안쪽 nav만 overflow-x-auto로 스크롤한다.
            (게임센터 링크까지 스크롤 컨테이너에 넣으면 카테고리가 많을 때 링크가 화면 밖으로 밀려나 안 보임)
          - flex-1 + min-w-0: 카테고리 nav가 남은 폭을 차지하되, min-w-0이 있어야 자식이 넘칠 때 실제로 스크롤된다.
        */}
        {/*
          ScrollFadeNav: 폰에서 카테고리가 넘칠 때 잘린 쪽 가장자리를 흐리게 해 "옆으로 더 있음"을 알리고,
          현재 카테고리(aria-current)가 화면 밖이면 보이는 위치로 자동 스크롤한다. (activeKey=pathname)
        */}
        <div className="flex items-center gap-3">
          <ScrollFadeNav
            aria-label="카테고리"
            activeKey={pathname}
            className="flex flex-1 items-center gap-4 overflow-x-auto py-3 text-sm min-w-0"
          >
            <Link
              href="/posts"
              aria-current={pathname === '/posts' ? 'page' : undefined}
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
                  aria-current={active ? 'page' : undefined}
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
          </ScrollFadeNav>
          {/* 아카이브: 게임센터가 없어진 자리에 공지사항 진입점을 둔다. */}
          <Link
            href="/notices"
            aria-current={pathname.startsWith('/notices') ? 'page' : undefined}
            className={
              pathname.startsWith('/notices')
                ? 'mr-2 shrink-0 whitespace-nowrap border-l border-neutral-200 pl-3 text-sm font-semibold text-neutral-900 dark:border-neutral-700 dark:text-white sm:border-l-0 sm:pl-0'
                : 'mr-2 shrink-0 whitespace-nowrap border-l border-neutral-200 pl-3 text-sm text-neutral-600 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 sm:border-l-0 sm:pl-0'
            }
          >
            공지사항
          </Link>
        </div>
      </div>
    </header>
  )
}
