import Link from 'next/link'
import type { NoticeDetail as NoticeDetailData } from '@/types'
import { formatDate } from '@/lib/format'
import NoticeBadges from './NoticeBadges'

interface Props {
  notice: NoticeDetailData
}

export default function NoticeDetail({ notice }: Props) {
  return (
    <article>
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-4 mb-4">
        <div className="mb-2 flex items-center gap-2">
          <NoticeBadges pinned={notice.pinned} featured={notice.featured} />
        </div>
        <h1 className="mb-3 text-xl font-bold">{notice.title}</h1>
        <div className="flex items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
          <span>{notice.author}</span>
          <span>{formatDate(notice.createdAt)}</span>
          <span>조회 {notice.viewCount}</span>
        </div>
      </div>

      {/*
        content는 백엔드가 Jsoup으로 sanitize한 HTML이다(게시글 본문과 동일 정책).
        서버에서 sanitize된 신뢰값이라는 전제로 dangerouslySetInnerHTML로 렌더한다.
      */}
      <div
        className="post-content min-h-40 py-6 text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: notice.content }}
      />

      <div className="mt-6 flex justify-center border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <Link
          href="/notices"
          className="rounded-md border border-neutral-300 px-4 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          목록
        </Link>
      </div>
    </article>
  )
}
