'use client'

import { useEffect, useRef, useState } from 'react'
import type { UserGrade } from '@/types'
import { GRADES } from '@/lib/grade'

// 등급 설명 팝오버. 등급 표기 옆에 독립된 "?" 버튼으로 존재하며,
// hover/탭/키보드 포커스로 열리면 5단계 계급 사다리(낮은→높은)를 뜻과 함께 보여주고
// 현재 등급을 강조한다. 단순 정보 표시라 "열림"에 초점을 두고, 닫힘은 바깥 클릭·Esc·
// 포커스 이탈·마우스 이탈로 처리한다(모바일 탭에서도 focus→click 순서로 바로 닫히지 않게).
export default function GradeInfoPopover({ grade }: { grade: UserGrade }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLSpanElement>(null)

  // 열려 있는 동안에만 바깥 클릭/Esc 리스너를 붙여 불필요한 전역 리스너를 최소화한다.
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
      // 포커스가 컨테이너 밖으로 나가면 닫는다(키보드 접근성).
      onBlur={e => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false)
      }}
    >
      <button
        type="button"
        // 클릭/탭·포커스는 "열기"로만 동작 — 탭 시 focus→click 순서로 토글돼 바로 닫히는 문제를 피한다.
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        aria-expanded={open}
        aria-label="회원 등급 설명 보기"
        className="flex h-4 w-4 items-center justify-center rounded-full border border-neutral-300 text-[10px] font-bold leading-none text-neutral-400 outline-none hover:border-neutral-400 hover:text-neutral-500 focus-visible:ring-2 focus-visible:ring-orange-400/60 dark:border-neutral-600 dark:text-neutral-500 dark:hover:border-neutral-500 dark:hover:text-neutral-300"
      >
        ?
      </button>

      {open && (
        <div
          role="tooltip"
          // 라벨 우측(카드 우상단)에 놓이므로 오른쪽 기준으로 펼쳐 화면 밖으로 넘치지 않게 한다.
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-neutral-200 bg-white p-2 text-left shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
        >
          <p className="px-1 pb-1.5 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500">
            회원 등급
          </p>
          <ul className="flex flex-col gap-0.5">
            {/* 높은 계급이 위로 오도록 역순 표시(사다리 느낌) */}
            {[...GRADES].reverse().map(g => {
              const current = g.value === grade
              return (
                <li
                  key={g.value}
                  className={
                    current
                      ? 'flex items-start gap-2 rounded-md bg-orange-50 px-1.5 py-1 dark:bg-orange-500/10'
                      : 'flex items-start gap-2 rounded-md px-1.5 py-1'
                  }
                >
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${g.dot}`} aria-hidden="true" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-semibold ${current ? 'text-orange-600 dark:text-orange-400' : 'text-neutral-800 dark:text-neutral-200'}`}>
                        {g.label}
                      </span>
                      {current && (
                        <span className="rounded bg-orange-500 px-1 py-px text-[9px] font-bold text-white">현재</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] leading-snug text-neutral-500 dark:text-neutral-400">
                      {g.meaning}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </span>
  )
}
