import Link from 'next/link'
import type { ReactNode } from 'react'

interface Props {
  title: string
  bulletColor: string
  href?: string
  linkLabel?: string
  children: ReactNode
}

export default function SectionCard({ title, bulletColor, href, linkLabel, children }: Props) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`inline-block h-2 w-2 rounded-full ${bulletColor}`} />
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">{title}</h2>
        </div>
        {href && linkLabel && (
          <Link href={href} className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
            {linkLabel}
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}
