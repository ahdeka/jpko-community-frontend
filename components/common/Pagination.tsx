import Link from 'next/link'

const PAGE_WINDOW = 5

interface Props {
  currentPage: number // 0-based
  totalPages: number
  basePath: string
}

export default function Pagination({ currentPage, totalPages, basePath }: Props) {
  if (totalPages <= 1) return null

  const windowStart = Math.floor(currentPage / PAGE_WINDOW) * PAGE_WINDOW
  const windowEnd = Math.min(totalPages, windowStart + PAGE_WINDOW)
  const pages = Array.from({ length: windowEnd - windowStart }, (_, i) => windowStart + i)

  const hrefFor = (page: number) => `${basePath}?page=${page}`

  return (
    <nav className="flex justify-center items-center gap-1 mt-6 text-sm">
      {windowStart > 0 && (
        <Link href={hrefFor(windowStart - 1)} className="px-2 py-1 text-neutral-500 hover:text-neutral-200">
          이전
        </Link>
      )}
      {pages.map(page => (
        <Link
          key={page}
          href={hrefFor(page)}
          className={
            page === currentPage
              ? 'px-2.5 py-1 rounded bg-orange-500 text-white font-medium'
              : 'px-2.5 py-1 rounded text-neutral-400 hover:bg-neutral-800'
          }
        >
          {page + 1}
        </Link>
      ))}
      {windowEnd < totalPages && (
        <Link href={hrefFor(windowEnd)} className="px-2 py-1 text-neutral-500 hover:text-neutral-200">
          다음
        </Link>
      )}
    </nav>
  )
}
