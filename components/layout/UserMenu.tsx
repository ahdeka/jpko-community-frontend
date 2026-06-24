'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  nickname: string
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

// 닉네임(왼쪽) + 프로필 아이콘(오른쪽). 아이콘을 누르면 설정/로그아웃 메뉴가 열린다.
// 마이페이지·설정은 아직 백엔드 기능이 없어 자리만 잡아두고 준비 중임을 안내한다.
export default function UserMenu({ nickname, onLogout }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // 메뉴가 열려 있을 때만 바깥 클릭 리스너를 달아 닫는다.
  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function handleNotReady(label: string) {
    setOpen(false)
    alert(`${label} 기능은 준비 중입니다.`)
  }

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
        <span className="text-sm text-neutral-600 dark:text-neutral-400">{nickname}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-700 text-white hover:bg-neutral-600 dark:bg-neutral-600 dark:hover:bg-neutral-500">
          <UserIcon />
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-2 w-44 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
        >
          <div className="border-b border-neutral-100 px-4 py-2.5 dark:border-neutral-700">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{nickname}</p>
          </div>
          <button type="button" role="menuitem" onClick={() => handleNotReady('마이페이지')} className={menuItem}>
            마이페이지
          </button>
          <button type="button" role="menuitem" onClick={() => handleNotReady('설정')} className={menuItem}>
            설정
          </button>
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
