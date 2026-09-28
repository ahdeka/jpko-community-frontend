import type { ReactNode } from 'react'

// 소개·문의처럼 "탭 없이 단독으로 서는" 정적 안내 문서의 공통 껍데기.
// 약관/개인정보처리방침(LegalDoc)과 카드 스타일을 맞추되, 두 문서를 오가는 탭과 시행일은 없다.
// 본문 조판은 LegalDoc의 Section·Callout을 그대로 가져다 쓴다(한 곳만 고치면 전부 반영되도록).
export default function InfoDoc({
  title,
  lead,
  children,
}: {
  title: string
  lead?: string
  children: ReactNode
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{title}</h1>
      {lead && <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">{lead}</p>}

      <div className="mt-5 rounded-lg border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-800/40 sm:p-6">
        <div className="space-y-5 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          {children}
        </div>
      </div>
    </div>
  )
}
