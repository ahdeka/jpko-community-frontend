'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import type { User } from '@/types'

interface Props {
  user: User
  onLogout: () => void
}

// 로그인 상태의 프로필 아이콘. 비로그인 아이콘과 같은 형태로 통일한다.
function UserIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.42 3.58-7 8-7s8 2.58 8 7" />
    </svg>
  )
}

// 닉네임(왼쪽) + 프로필 아이콘(오른쪽). 아이콘을 누르면 메뉴가 열린다.
// 관리자(role === 'ADMIN')에게만 "관리자 페이지" 항목을 추가로 노출한다.
export default function UserMenu({ user, onLogout }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const isAdmin = user.role === 'ADMIN'

  // 메뉴가 열려 있을 때만 바깥 클릭 리스너를 달아 닫는다.
  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const menuItem =
    'block w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(prev => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="내 메뉴"
        className="flex items-center gap-2"
      >
        <span className="text-sm text-neutral-600 dark:text-neutral-400">{user.nickname}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-700 text-white hover:bg-neutral-600 dark:bg-neutral-600 dark:hover:bg-neutral-500">
          <UserIcon />
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
        >
          {/* 헤더: 닉네임 + 관리자 배지 */}
          <div className="border-b border-neutral-100 px-4 py-2.5 dark:border-neutral-700">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {user.nickname}
              </p>
              {isAdmin && (
                <span className="shrink-0 rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                  관리자
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-neutral-400 dark:text-neutral-500">{user.email}</p>
          </div>

          <Link href="/mypage" role="menuitem" className={menuItem} onClick={() => setOpen(false)}>
            마이페이지
          </Link>

          {isAdmin && (
            <Link href="/admin" role="menuitem" className={menuItem} onClick={() => setOpen(false)}>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-500" />
                관리자 페이지
              </span>
            </Link>
          )}

          <div className="my-1 border-t border-neutral-100 dark:border-neutral-700" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onLogout()
            }}
            className={menuItem}
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  )
}
