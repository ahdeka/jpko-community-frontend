'use client'

import { useEffect, useRef, useState } from 'react'
import { MESSAGES } from '@/lib/messages'

// 포인트 안내 팝오버. hover/탭/키보드 포커스로 열리고, 바깥 클릭·Esc·포커스 이탈·마우스 이탈로 닫힌다
// (모바일 탭에서도 focus→click 순서로 바로 닫히지 않게 클릭은 "열기"로만 동작).
export default function PointInfoPopover() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return

    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <span
      ref={containerRef}
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={e => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false)
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        aria-expanded={open}
        aria-label="포인트 안내 보기"
        className="flex h-4 w-4 items-center justify-center rounded-full border border-neutral-300 text-[10px] font-bold leading-none text-neutral-400 outline-none hover:border-neutral-400 hover:text-neutral-500 focus-visible:ring-2 focus-visible:ring-orange-400/60 dark:border-neutral-600 dark:text-neutral-500 dark:hover:border-neutral-500 dark:hover:text-neutral-300"
      >
        ?
      </button>

      {open && (
        <div
          role="tooltip"
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-neutral-200 bg-white p-3 text-left shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
        >
          <p className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500">
            출첵
          </p>
          <p className="mt-1 text-[11px] leading-snug text-neutral-600 dark:text-neutral-300">
            {MESSAGES.points.pointInfo.checkinDescription}
          </p>
          <p className="mt-2 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500">
            룰렛
          </p>
          <p className="mt-1 text-[11px] leading-snug text-neutral-600 dark:text-neutral-300">
            {MESSAGES.points.pointInfo.rouletteDescription}
          </p>
        </div>
      )}
    </span>
  )
}
