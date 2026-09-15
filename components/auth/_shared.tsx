'use client'

import Link from 'next/link'

// 인증 폼 공용 입력 스타일. (로그인/회원가입/온보딩이 동일하게 사용)
export const inputClass =
  'w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400 dark:focus:border-blue-500'

// 백엔드 검증 미러링:
//  - 닉네임: SignupCompleteRequest @Pattern — 한글(완성형)·영문·숫자만(공백·특수문자 불가).
//  - 아이디: SignupCompleteRequest/SignupMigrationRequest @Pattern — 영문 소문자·숫자·언더바 4~20자.
// 백엔드는 trim()/toLowerCase() 후 검사하므로 프론트도 정규화한 값 기준으로 검사한다.
export const NICKNAME_RE = /^[가-힣a-zA-Z0-9]+$/
export const LOGINID_RE = /^[a-z0-9_]{4,20}$/

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

// 필수 동의 항목 한 줄. 체크박스 + [필수] 배지 + 약관 본문 링크(새 탭).
// 라벨 텍스트를 클릭하면 체크가 토글되지만, 링크 클릭은 페이지 이동만 하도록 분리한다.
export function AgreementRow({
  checked,
  onChange,
  error,
  href,
  label,
}: {
  checked: boolean
  onChange: () => void
  error?: string
  // 없으면 링크 없이 label 문장을 그대로 보여준다(예: "만 14세 이상입니다.")
  href?: string
  label: string
}) {
  return (
    <div>
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="h-4 w-4 accent-blue-600"
        />
        <span className="text-sm text-neutral-700 dark:text-neutral-300">
          <span className="text-red-500">[필수]</span>{' '}
          {href ? (
            <>
              <Link
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                // 링크 클릭이 라벨로 버블링돼 체크박스가 토글되는 것을 막는다
                onClick={e => e.stopPropagation()}
                className="text-blue-600 dark:text-blue-400 underline underline-offset-2"
              >
                {label}
              </Link>
              에 동의합니다.
            </>
          ) : (
            label
          )}
        </span>
      </label>
      {error && <p className="text-xs text-red-500 mt-1 ml-6">{error}</p>}
    </div>
  )
}
