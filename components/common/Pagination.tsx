import Link from 'next/link'

const PAGE_WINDOW = 5

interface Props {
  currentPage: number // 0-based
  totalPages: number
  basePath: string
  searchParams?: Record<string, string>
  // 페이지 번호를 담을 쿼리 키. 기본은 'page'(게시글 목록용).
  // 상세 페이지의 댓글 목록은 상세 자체의 쿼리와 섞이지 않도록 'cpage'를 쓴다.
  pageParam?: string
  // 이동 후 스크롤을 맞출 앵커 id(예: 'comments'). 지정하면 링크에 '#id'를 붙여
  // 페이지 전환 후 해당 영역으로 스크롤되게 한다. 목록 페이지에선 쓰지 않는다.
  hash?: string
}

export default function Pagination({ currentPage, totalPages, basePath, searchParams, pageParam = 'page', hash }: Props) {
  if (totalPages <= 1) return null

  const windowStart = Math.floor(currentPage / PAGE_WINDOW) * PAGE_WINDOW
  const windowEnd = Math.min(totalPages, windowStart + PAGE_WINDOW)
  const pages = Array.from({ length: windowEnd - windowStart }, (_, i) => windowStart + i)

  const hrefFor = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set(pageParam, String(page))
    return `${basePath}?${params.toString()}${hash ? `#${hash}` : ''}`
  }

  return (
    <nav className="flex justify-center items-center gap-1 mt-6 text-sm">
      {windowStart > 0 && (
        <Link href={hrefFor(windowStart - 1)} className="px-2 py-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200">
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
              : 'px-2.5 py-1 rounded text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
          }
        >
          {page + 1}
        </Link>
      ))}
      {windowEnd < totalPages && (
        <Link href={hrefFor(windowEnd)} className="px-2 py-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200">
          다음
        </Link>
      )}
    </nav>
  )
}
