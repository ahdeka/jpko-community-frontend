'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ShareModal from './ShareModal'
import ReportModal from '@/components/common/ReportModal'
import { useAuth } from '@/lib/auth-context'

// 본문과 댓글 사이에 놓이는 하단 액션 바.
// 좌측: 목록으로 이동 / 우측: 공유, 더보기(신고하기) 메뉴.
//
// listHref: 좌측 "목록" 아이콘의 이동 경로(게시글=/posts, 공지=/notices 등).
// reportPostId: 신고 대상 게시글 id. 이 값이 없으면 더보기(신고) 메뉴 자체를 렌더하지 않는다.
//   공지사항(Notice)이 그런 경우다 — 백엔드 ReportTargetType은 POST/COMMENT만 지원하므로
//   공지는 애초에 신고할 수 없고, 메뉴를 띄우면 무조건 실패하는 동작이 된다.
// isOwner: 본인 글이면 신고 메뉴를 숨긴다(백엔드도 SELF_REPORT_NOT_ALLOWED로 거부).
export default function PostActions({
  listHref = '/posts',
  shareTitle,
  reportPostId,
  isOwner = false,
}: {
  listHref?: string
  shareTitle?: string
  reportPostId?: number
  isOwner?: boolean
}) {
  const router = useRouter()
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  // 공유 모달에 넘길 데이터. null이면 닫힘. (데스크탑에서만 사용)
  const [share, setShare] = useState<{ url: string; title: string } | null>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // 신고 메뉴 노출 조건:
  //  - 신고 가능한 대상일 것(reportPostId 있음 = 게시글이며 공지가 아님)
  //  - 본인 글이 아닐 것 — 어차피 서버가 거부한다.
  // 비로그인은 여기서 거르지 않는다. 메뉴를 아예 숨기면 "신고할 수단이 없는 사이트"로 보이므로,
  // 노출은 하되 클릭 시 로그인으로 안내한다.
  const canReport = reportPostId !== undefined && !isOwner

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

  // 신고하기 클릭. 비로그인이면 로그인으로 안내한다.
  // (로그인 폼이 성공 후 무조건 홈으로 replace하므로 redirect 파라미터는 붙이지 않는다 —
  //  동작하지 않는 파라미터를 넘기면 '돌아올 것'이라는 잘못된 기대만 만든다.)
  function handleReportClick() {
    setMenuOpen(false)
    if (!user) {
      alert('신고하려면 로그인이 필요합니다.')
      router.push('/login')
      return
    }
    setReportOpen(true)
  }

  // 공유하기: 모바일/터치 기기에서는 네이티브 공유 시트(Web Share API),
  // 데스크탑에서는 우리가 만든 커스텀 공유 모달(ShareModal)을 띄운다.
  //
  // 데스크탑(Windows/Chrome 등)에서도 navigator.share가 존재하지만, 호출하면 OS가 그리는
  // 공유창이 떠서 바깥 클릭으로 닫히지 않는 등 UX가 나쁘다(제어 불가 — OS 소유 UI).
  // 그래서 "주 입력이 터치인 기기"(pointer: coarse)로만 네이티브 공유를 한정하고,
  // 데스크탑은 배경 클릭·ESC로 닫히는 자체 모달을 쓴다.
  async function handleShare() {
    const url = window.location.href
    const title = shareTitle ?? document.title

    const isTouchPrimary =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: coarse)').matches

    if (typeof navigator.share === 'function' && isTouchPrimary) {
      try {
        await navigator.share({ title, url })
      } catch {
        // 사용자가 공유를 취소(AbortError)한 경우 등 — 조용히 무시
      }
      return
    }

    // 데스크탑: 커스텀 공유 모달 열기
    setShare({ url, title })
  }

  const iconButton =
    'flex h-9 w-9 items-center justify-center rounded text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200'

  return (
    <div className="flex items-center justify-between border-b border-gray-200 py-2 dark:border-neutral-800">
      {/* 목록으로 */}
      <Link href={listHref} aria-label="목록으로" className={iconButton}>
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
        {/* 공유하기: 모바일=네이티브 공유, 데스크탑=커스텀 모달 */}
        <button type="button" onClick={handleShare} aria-label="공유하기" className={iconButton}>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>

        {/* 더보기 메뉴 — 지금은 신고하기가 유일한 항목이라, 신고할 수 없는 대상(공지·본인 글)에서는
            빈 메뉴가 뜨지 않도록 버튼 자체를 렌더하지 않는다. */}
        {canReport && (
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
                  onClick={handleReportClick}
                  className="block w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-neutral-200 dark:hover:bg-neutral-700"
                >
                  신고하기
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 데스크탑 공유 모달 (모바일은 네이티브 공유라 열리지 않음) */}
      <ShareModal
        open={share !== null}
        onClose={() => setShare(null)}
        url={share?.url ?? ''}
        title={share?.title ?? ''}
      />

      {/* 신고 모달. reportPostId가 있을 때만 canReport가 true이므로 여기서 값은 항상 존재한다. */}
      {canReport && (
        <ReportModal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          targetType="POST"
          targetId={reportPostId}
        />
      )}
    </div>
  )
}
