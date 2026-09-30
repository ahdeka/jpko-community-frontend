'use client'

import Link from 'next/link'

// 인증 폼 공용 입력 스타일. (로그인/회원가입/온보딩이 동일하게 사용)
export const inputClass =
  'w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400 dark:focus:border-blue-500'

// 백엔드 검증 미러링:
//  - 아이디: SignupCompleteRequest/SignupMigrationRequest @Pattern — 영문 소문자·숫자·언더바 4~20자.
// 백엔드는 trim()/toLowerCase() 후 검사하므로 프론트도 정규화한 값 기준으로 검사한다.
//
// 닉네임 규칙(NICKNAME_RE)과 금칙어는 가입 폼과 마이페이지가 함께 쓰므로 lib/nickname.ts에 모아뒀다.
export const LOGINID_RE = /^[a-z0-9_]{4,20}$/

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
