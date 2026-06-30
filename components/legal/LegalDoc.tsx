import Link from 'next/link'
import type { ReactNode } from 'react'

// 세그먼트 탭 스타일 (각 탭은 /terms·/privacy 라우트로 이동)
const tabActive =
  'rounded-md bg-white px-4 py-1.5 text-sm font-medium text-neutral-900 shadow-sm dark:bg-neutral-950 dark:text-white'
const tabInactive =
  'rounded-md px-4 py-1.5 text-sm text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'

interface Props {
  active: 'terms' | 'privacy'
  effectiveDate: string
  children: ReactNode
}

// 약관/개인정보처리방침 공통 레이아웃.
// 상단 탭으로 두 문서를 오가고, 본문은 옅은 카드에 담는다.
export default function LegalDoc({ active, effectiveDate, children }: Props) {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="sr-only">{active === 'terms' ? '이용약관' : '개인정보처리방침'}</h1>

      <div className="inline-flex gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
        <Link href="/terms" className={active === 'terms' ? tabActive : tabInactive}>이용약관</Link>
        <Link href="/privacy" className={active === 'privacy' ? tabActive : tabInactive}>개인정보처리방침</Link>
      </div>

      <div className="mt-5 rounded-lg border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-800/40 sm:p-6">
        <p className="mb-5 text-xs text-neutral-400 dark:text-neutral-500">시행일: {effectiveDate}</p>
        <div className="space-y-5 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          {children}
        </div>
      </div>
    </div>
  )
}

// 문서 내 섹션(소제목 + 내용)
export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-1.5 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{heading}</h2>
      <div className="space-y-1.5">{children}</div>
    </section>
  )
}

// 항목 라벨(예: "회원가입 시:")
export function Label({ children }: { children: ReactNode }) {
  return <strong className="font-medium text-neutral-800 dark:text-neutral-100">{children}</strong>
}

// 연락처 등 강조 박스 (회색 카드 위에서 흰 배경으로 떠 보이게)
export function Callout({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-neutral-200 bg-white px-4 py-3 text-xs text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
      {children}
    </div>
  )
}
