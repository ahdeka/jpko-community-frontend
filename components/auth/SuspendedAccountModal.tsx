'use client'

import { useEffect, useRef } from 'react'
import { CONTACT_EMAIL, SITE_NAME } from '@/lib/site'
import { MESSAGES } from '@/lib/messages'

interface Props {
  open: boolean
  onClose: () => void
  // 정지된 계정으로 로그인 시도할 때 유저가 입력한 이메일.
  // 문의 메일 본문에 미리 채워 넣어, 운영진이 어떤 계정인지 바로 확인할 수 있게 한다.
  email?: string
}

// 정지(SUSPENDED)된 계정으로 로그인 시도했을 때 뜨는 안내 모달.
//
// 왜 빨간 한 줄이 아니라 모달인가:
//  - "비밀번호 틀림"처럼 다시 시도하면 되는 오류와 성격이 전혀 다르다(유저가 할 수 있는 게 없다).
//    폼 밑 에러 줄에 섞이면 유저가 입력 실수로 오해하므로, 시각적으로 확실히 분리한다.
//
// 문구를 일반적으로 쓰는 이유:
//  - 백엔드는 정지 사유·기간을 내려주지 않는다(SUSPENDED_ACCOUNT 코드만 옴). 그래서 "왜/언제까지"를
//    특정할 수 없다. 확인·해제 요청은 이메일 문의로 유도한다. (추후 백엔드가 사유/해제일을 주면 구체화)
export default function SuspendedAccountModal({ open, onClose, email }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // 열려 있는 동안: ESC로 닫기 + 배경 스크롤 잠금 + 모달에 포커스 이동.
  useEffect(() => {
    if (!open) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    dialogRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  // mailto 프리필: 유저는 로그인을 못 하므로 시스템이 이메일을 모른다 → 본문에 직접 적도록 안내한다.
  // 시도한 이메일이 있으면 미리 채워, 유저가 다시 타이핑하지 않아도 되게 한다.
  const subject = MESSAGES.auth.suspendedAccount.mailSubject(SITE_NAME)
  const body = [
    MESSAGES.auth.suspendedAccount.mailBody,
    '',
    `- 가입 이메일: ${email ?? ''}`,
    '- 닉네임: ',
    '- 문의 내용: ',
    '',
  ].join('\n')
  const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="suspended-title"
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl outline-none dark:bg-neutral-900"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          {/* 경고 아이콘 — 위반/제한 상태를 색으로 즉시 전달(빨강 계열) */}
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
            <svg className="h-6 w-6 text-red-600 dark:text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <line x1="12" y1="8" x2="12" y2="13" />
              <line x1="12" y1="16.5" x2="12" y2="16.5" />
            </svg>
          </span>

          <h2 id="suspended-title" className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            {MESSAGES.auth.suspendedAccount.title}
          </h2>

          <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            {MESSAGES.auth.suspendedAccount.description}
          </p>

          {/* 이의/해제 안내 박스 — 유저가 다음에 뭘 하면 되는지 명확히 제시한다. */}
          <div className="mt-1 w-full rounded-lg bg-neutral-50 p-4 text-left dark:bg-neutral-800/60">
            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
              {MESSAGES.auth.suspendedAccount.inquiryTitle}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
              {MESSAGES.auth.suspendedAccount.inquiryDescriptionPrefix}
              <b className="font-semibold text-neutral-600 dark:text-neutral-300">{MESSAGES.auth.suspendedAccount.inquiryDescriptionEmphasis}</b>
              {MESSAGES.auth.suspendedAccount.inquiryDescriptionSuffix}
            </p>
            <a
              href={mailtoHref}
              className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              {CONTACT_EMAIL}
            </a>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-2 w-full rounded-lg bg-neutral-800 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-700 dark:hover:bg-neutral-600"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  )
}
