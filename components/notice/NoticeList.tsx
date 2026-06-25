import Link from 'next/link'
import type { NoticeSummary } from '@/types'
import { formatDate } from '@/lib/format'
import NoticeBadges from './NoticeBadges'

interface Props {
  notices: NoticeSummary[]
}

// 공지 목록 테이블. 고정(pinned) 공지는 상단에 "공지" 배지와 함께 강조한다.
// 백엔드가 이미 pinned 우선 정렬해 내려주면 그대로, 아니더라도 시각적으로 구분된다.
export default function NoticeList({ notices }: Props) {
  if (notices.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-neutral-400 dark:text-neutral-500">
        등록된 공지사항이 없습니다.
      </div>
    )
  }

  return (
    <ul className="divide-y divide-neutral-100 dark:divide-neutral-800 border-y border-neutral-200 dark:border-neutral-800">
      {notices.map(notice => (
        <li key={notice.id}>
          <Link
            href={`/notices/${notice.id}`}
            className="flex items-center gap-3 px-1 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
          >
            <NoticeBadges pinned={notice.pinned} featured={notice.featured} />
            <span className="min-w-0 flex-1 truncate text-sm text-neutral-800 dark:text-neutral-100">
              {notice.title}
            </span>
            <span className="shrink-0 text-xs text-neutral-400 dark:text-neutral-500">
              조회 {notice.viewCount}
            </span>
            <span className="hidden shrink-0 text-xs text-neutral-400 dark:text-neutral-500 sm:inline">
              {formatDate(notice.createdAt)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
