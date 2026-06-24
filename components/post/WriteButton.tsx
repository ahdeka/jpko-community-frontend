'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

// 글쓰기 버튼. 글 작성은 로그인이 필요하므로 비로그인 사용자에게는 표시하지 않는다.
// 여러 위치(목록 우측 상단·하단)에서 재사용하므로 바깥 여백은 className으로 주입받는다.
export default function WriteButton({ className = '' }: { className?: string }) {
  const { user } = useAuth()
  if (!user) return null

  return (
    <Link
      href="/posts/new"
      className={`inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800 ${className}`}
    >
      {/* 아이콘만 브랜드 컬러(오렌지)로 포인트를 준다. 글씨는 검은색 계열. */}
      <svg className="h-3.5 w-3.5 text-orange-500 dark:text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
      글쓰기
    </Link>
  )
}
