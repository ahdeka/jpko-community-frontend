'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

interface Props {
  // 스크린리더용 버튼 이름. "포인트 안내 보기"처럼 무엇에 대한 설명인지 밝힌다.
  label: string
  // 팝오버 안에 그릴 내용.
  children: ReactNode
  // 패널 가로폭 클래스. 기본 w-64가 좁은 내용에는 과할 때만 바꾼다.
  widthClass?: string
  // 패널이 열리는 방향. 기본은 아래(top-full)다.
  //
  // 'top'은 스크롤되는 좁은 컨테이너(예: 모달) 안에서 쓴다. 패널이 absolute라 레이아웃 자리는
  // 차지하지 않지만, 아래로 열리면 컨테이너의 '스크롤 가능 영역'은 늘어난다. 그러면 없던
  // 스크롤바가 생기고 그만큼 콘텐츠 폭이 줄면서 화면 전체가 미세하게 밀린다.
  // 위로 열면 이미 그려진 영역 위에 겹치므로 스크롤 영역이 커지지 않는다.
  placement?: 'bottom' | 'top'
}

// "?" 아이콘 하나로 열리는 안내 팝오버의 공통 껍데기.
// hover/탭/키보드 포커스로 열리고, 바깥 클릭·Esc·포커스 이탈·마우스 이탈로 닫힌다
// (모바일 탭에서도 focus→click 순서로 바로 닫히지 않게 클릭은 "열기"로만 동작).
//
// 내용만 다르고 이 여닫는 규칙은 어디서나 같아야 하므로 껍데기를 여기로 모았다 —
// 접근성 처리(aria-expanded·Esc·포커스 이탈)를 화면마다 다시 짜면 하나씩 빠지기 때문이다.
export default function InfoPopover({
  label,
  children,
  widthClass = 'w-64',
  placement = 'bottom',
}: Props) {
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
        aria-label={label}
        className="flex h-4 w-4 items-center justify-center rounded-full border border-neutral-300 text-[10px] font-bold leading-none text-neutral-400 outline-none hover:border-neutral-400 hover:text-neutral-500 focus-visible:ring-2 focus-visible:ring-orange-400/60 dark:border-neutral-600 dark:text-neutral-500 dark:hover:border-neutral-500 dark:hover:text-neutral-300"
      >
        ?
      </button>

      {open && (
        <div
          role="tooltip"
          className={`absolute right-0 z-50 ${
            placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          } ${widthClass} rounded-lg border border-neutral-200 bg-white p-3 text-left shadow-lg dark:border-neutral-700 dark:bg-neutral-900`}
        >
          {children}
        </div>
      )}
    </span>
  )
}
