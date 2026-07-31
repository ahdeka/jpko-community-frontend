'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import ReportModal from '@/components/common/ReportModal'
import { useAuth } from '@/lib/auth-context'
import { MESSAGES } from '@/lib/messages'

// 공개 프로필 헤더에 붙는 "더보기 → 신고하기" 메뉴.
// 게시글 하단(PostActions)의 더보기 메뉴와 같은 UI·동작을 회원 신고용으로 맞춘 것이다.
//
// 노출 규칙:
//  - 본인 프로필에서는 아예 렌더하지 않는다(백엔드도 SELF_REPORT_NOT_ALLOWED로 거부).
//  - 인증 상태 확정 전(isLoading)에는 렌더를 보류한다 — 본인인데 신고 버튼이 깜빡 보였다
//    사라지는 것을 막기 위함이다(useAuth는 초기 user=null로 시작한다).
//  - 비로그인은 버튼을 숨기지 않고, 클릭 시 로그인으로 안내한다
//    (숨기면 "신고할 수단이 없는 사이트"로 보이므로 — PostActions와 동일한 판단).
export default function ProfileReportButton({ targetUserId }: { targetUserId: number }) {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // 드롭다운이 열려 있을 때만 바깥 클릭 리스너를 달아 닫는다(닫힌 동안엔 비용 0).
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

  // 인증 판단 전, 또는 본인 프로필이면 신고 진입점을 두지 않는다.
  if (isLoading || user?.id === targetUserId) return null

  // 신고하기 클릭. 비로그인이면 로그인으로 안내한다.
  // (로그인 폼이 성공 후 홈으로 replace하므로 redirect 파라미터는 붙이지 않는다 — PostActions와 동일.)
  function handleReportClick() {
    setMenuOpen(false)
    if (!user) {
      alert(MESSAGES.common.loginRequiredToReport)
      router.push('/login')
      return
    }
    setReportOpen(true)
  }

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen(prev => !prev)}
        aria-label="더보기"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="flex h-9 w-9 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-neutral-200/70 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-700/60 dark:hover:text-neutral-300"
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
          className="absolute right-0 top-full z-10 mt-1 w-32 overflow-hidden rounded-md border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleReportClick}
            className="block w-full px-3 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            신고하기
          </button>
        </div>
      )}

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="USER"
        targetId={targetUserId}
      />
    </div>
  )
}
