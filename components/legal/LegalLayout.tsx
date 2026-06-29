import type { ReactNode } from 'react'

interface Props {
  title: string
  effectiveDate: string
  children: ReactNode
}

// 약관/개인정보처리방침 등 정책 문서 공통 레이아웃.
// 상단에 "초안" 안내 배너를 둬, 실제 운영 정보로 확정이 필요함을 명시한다.
export default function LegalLayout({ title, effectiveDate, children }: Props) {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">시행일: {effectiveDate}</p>

      <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
        본 문서는 <strong>초안</strong>입니다. 운영 주체 정보·보유기간·연락처 등 실제 정보로 검토·확정한 뒤 게시하세요. (법률 자문 권장)
      </div>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        {children}
      </div>
    </div>
  )
}

// 정책 문서 내 섹션(제목 + 내용)
export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-base font-bold text-neutral-900 dark:text-neutral-100">{heading}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  )
}
