import Link from 'next/link'
import { NoticeSummary } from '@/types'
import { formatRelativeTime } from '@/lib/format'
import NoticeBadges from './NoticeBadges'

interface Props {
  notice: NoticeSummary
}

// 게시글 목록 상단에 고정 노출되는 공지 행.
// PostRow와 동일한 레이아웃(py-2.5, 좌측 본문 / 우측 메타)을 그대로 따르되,
// 카테고리 배지 자리에 "공지" 배지를 넣고 행 배경을 어둡게 깔아 일반 글과 구분한다.
export default function NoticeRow({ notice }: Props) {
  return (
    <li className="bg-neutral-100 hover:bg-neutral-200/70 dark:bg-neutral-800/40 dark:hover:bg-neutral-800/70">
      <Link href={`/notices/${notice.id}`} className="flex items-center justify-between gap-3 py-2.5">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex min-w-0 items-center gap-2">
            {/* 번호 칸의 공지 표시 역할 (PostRow의 카테고리 배지 위치) */}
            <NoticeBadges pinned={notice.pinned} featured={notice.featured} size="md" />
            <span className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {notice.title}
            </span>
          </div>

          {/* PostRow의 좋아요·시간 줄과 동일한 위치의 메타(조회수·작성시간) */}
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span>조회 {notice.viewCount}</span>
            <span>{formatRelativeTime(notice.createdAt)}</span>
          </div>
        </div>

        {/* PostRow의 작성자 칸 위치. 공지 요약에는 작성자가 없어 운영 주체를 고정 표기 */}
        <span className="shrink-0 text-xs text-neutral-500">관리자</span>
      </Link>
    </li>
  )
}
