'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

// 유튜브식 커스텀 공유 모달.
// OS 네이티브 공유창(navigator.share)과 달리 우리가 완전히 제어하므로,
// 배경(바깥) 클릭·ESC로 닫을 수 있다. 데스크탑에서 사용한다(모바일은 네이티브 공유 시트가 UX가 낫다).
export default function ShareModal({
  open,
  onClose,
  url,
  title,
}: {
  open: boolean
  onClose: () => void
  url: string
  title: string
}) {
  const [copied, setCopied] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // 열려 있는 동안: ESC로 닫기 + 배경 스크롤 잠금 + 닫기 버튼에 포커스 이동.
  useEffect(() => {
    if (!open) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    // 모달 뒤 본문이 스크롤되지 않게 잠근다. 닫힐 때 이전 값으로 복원.
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    closeButtonRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  // 닫히면 "복사됨" 상태를 초기화해, 다음에 열 때 깨끗한 상태로 시작한다.
  useEffect(() => {
    if (!open) setCopied(false)
  }, [open])

  if (!open) return null

  function openShareWindow(shareUrl: string) {
    // noopener/noreferrer: 새 창이 window.opener로 원본 탭을 조작하는 것을 차단(보안)
    window.open(shareUrl, '_blank', 'noopener,noreferrer')
  }

  function shareToX() {
    openShareWindow(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
    )
  }

  function shareToLine() {
    openShareWindow(
      `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`
    )
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 비보안 컨텍스트·구형 브라우저 등 clipboard 미지원 시 직접 복사 유도
      window.prompt('아래 링크를 복사하세요', url)
    }
  }

  return (
    <div
      // 배경(backdrop). 이 영역을 클릭하면 닫힌다.
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="공유하기"
        // 카드 내부 클릭이 배경으로 버블링돼 닫히는 것을 막는다.
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-neutral-900"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            공유하기
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 공유 대상 */}
        <div className="flex justify-center gap-6">
          <ShareTarget label="X" onClick={shareToX}>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </span>
          </ShareTarget>

          <ShareTarget label="LINE" onClick={shareToLine}>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#06C755] text-white">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.48 2 2 5.64 2 10.13c0 4.02 3.55 7.39 8.35 8.03.32.07.77.21.88.49.1.25.06.64.03.9l-.14.86c-.04.25-.2.99.87.54 1.07-.45 5.77-3.4 7.87-5.82C21.29 13.5 22 11.9 22 10.13 22 5.64 17.52 2 12 2zM8.13 12.6H6.16a.52.52 0 0 1-.52-.52V8.14a.52.52 0 0 1 1.04 0v3.42h1.45a.52.52 0 0 1 0 1.04zm2.04-.52a.52.52 0 0 1-1.04 0V8.14a.52.52 0 0 1 1.04 0v3.94zm4.7 0a.52.52 0 0 1-.36.5.53.53 0 0 1-.58-.19l-2.02-2.75v2.44a.52.52 0 0 1-1.04 0V8.14a.52.52 0 0 1 .93-.31l2.03 2.76V8.14a.52.52 0 0 1 1.04 0v3.94zm3.24-2.5a.52.52 0 0 1 0 1.04h-1.45v.94h1.45a.52.52 0 0 1 0 1.04h-1.97a.52.52 0 0 1-.52-.52V8.14a.52.52 0 0 1 .52-.52h1.97a.52.52 0 0 1 0 1.04h-1.45v.92z" />
              </svg>
            </span>
          </ShareTarget>

          <ShareTarget label={copied ? '복사됨' : '링크 복사'} onClick={copyLink}>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200">
              {copied ? (
                <svg className="h-5 w-5 text-green-600 dark:text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              )}
            </span>
          </ShareTarget>
        </div>

        {/* URL 표시 + 복사 */}
        <div className="mt-5 flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-2 dark:border-neutral-700 dark:bg-neutral-800">
          <input
            type="text"
            readOnly
            value={url}
            onFocus={e => e.currentTarget.select()}
            className="min-w-0 flex-1 bg-transparent px-1 text-sm text-neutral-700 outline-none dark:text-neutral-300"
          />
          <button
            type="button"
            onClick={copyLink}
            className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            {copied ? '복사됨' : '복사'}
          </button>
        </div>
      </div>
    </div>
  )
}

// 공유 대상 하나(아이콘 + 라벨). 세로 배치.
function ShareTarget({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-1.5">
      {children}
      <span className="text-xs text-neutral-600 dark:text-neutral-400">{label}</span>
    </button>
  )
}
