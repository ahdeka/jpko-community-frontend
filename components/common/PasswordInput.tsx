'use client'

import { useState, type ComponentProps } from 'react'

// 비밀번호 표시/숨김 토글 버튼.
// type="button" 필수 — 기본값(submit)이면 클릭 시 폼이 제출돼버린다.
// positioned=true 면 input 우측에 단독 배치, false 면 부모 flex 안에 들어간다(체크 아이콘과 나란히).
export function PasswordToggle({
  visible,
  onToggle,
  positioned = true,
}: {
  visible: boolean
  onToggle: () => void
  positioned?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? '비밀번호 숨기기' : '비밀번호 표시'}
      aria-pressed={visible}
      className={`${
        positioned ? 'absolute right-2 top-1/2 -translate-y-1/2 ' : ''
      }text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200`}
    >
      {visible ? (
        // eye-off
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      ) : (
        // eye
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  )
}

// 눈 아이콘 토글이 달린 비밀번호 입력란. type 외의 input 속성(value/onChange/ref/autoComplete 등)은 그대로 전달된다.
// 표시 상태는 입력란마다 독립적이다(새 비밀번호/확인 칸을 따로 켜고 끌 수 있음).
// pr-10: 긴 비밀번호가 아이콘 밑으로 파고들지 않도록 우측 여백 확보.
export default function PasswordInput({
  className = '',
  ...props
}: Omit<ComponentProps<'input'>, 'type'>) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={`${className} pr-10`}
      />
      <PasswordToggle visible={visible} onToggle={() => setVisible(v => !v)} />
    </div>
  )
}
