import Link from 'next/link'
import type { NoticeSummary } from '@/types'

interface Props {
  notices: NoticeSummary[]
}

// 메인(홈) 최상단에 노출하는 중요 공지 띠. featured=true 공지만 받는다.
// 이 띠에 올라온 것 자체가 이미 "중요"를 의미하므로, 배지는 "공지" 하나만 단다.
// (featured/pinned 구분 배지는 게시글 목록·공지 목록 등 다른 화면에서만 노출)
// 표시할 공지가 없으면 빈 카드 대신 아무것도 렌더하지 않는다.
export default function FeaturedNoticeBar({ notices }: Props) {
  if (notices.length === 0) return null

  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
      <ul className="flex flex-col gap-1.5">
        {notices.map(notice => (
          <li key={notice.id} className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              공지
            </span>
            <Link
              href={`/notices/${notice.id}`}
              className="truncate text-sm text-neutral-800 hover:underline dark:text-neutral-100"
            >
              {notice.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
