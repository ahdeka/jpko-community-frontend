'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

// 본문과 댓글 사이에 놓이는 하단 액션 바.
// 좌측: 목록으로 이동 / 우측: 공유, 더보기(신고하기) 메뉴.
// 공유·신고는 아직 기능이 없어 아이콘과 메뉴 자리만 잡아둔다.
export default function PostActions() {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // 드롭다운이 열려 있을 때 메뉴 바깥을 클릭하면 닫는다.
  // menuOpen이 false일 때는 리스너를 아예 달지 않아 불필요한 비용을 줄인다.
  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  // 아직 구현되지 않은 기능은 준비 중임을 알리는 것으로 대체한다.
  function handleNotReady(label: string) {
    alert(`${label} 기능은 준비 중입니다.`)
  }

  const iconButton =
    'flex h-9 w-9 items-center justify-center rounded text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200'

  return (
    <div className="flex items-center justify-between border-b border-gray-200 py-2 dark:border-neutral-800">
      {/* 목록으로 */}
      <Link href="/posts" aria-label="목록으로" className={iconButton}>
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      </Link>

      <div className="flex items-center gap-1">
        {/* 공유하기 (기능 준비 중) */}
        <button type="button" onClick={() => handleNotReady('공유하기')} aria-label="공유하기" className={iconButton}>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>

        {/* 더보기 메뉴 */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(prev => !prev)}
            aria-label="더보기"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className={iconButton}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="5" cy="12" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="19" cy="12" r="1.5" />
            </svg>
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full z-10 mt-1 w-32 overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false)
                  handleNotReady('신고하기')
                }}
                className="block w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-neutral-200 dark:hover:bg-neutral-700"
              >
                신고하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
