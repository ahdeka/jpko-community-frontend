import Link from 'next/link'
import { NoticeSummary } from '@/types'
import NoticeBadges from './NoticeBadges'

interface Props {
  notice: NoticeSummary
}

// 게시글 목록 상단에 고정 노출되는 공지 행.
// 카테고리 배지 자리에 "공지" 배지를 넣고 행 배경을 어둡게 깔아 일반 글과 구분한다.
// 게시글 목록에서는 조회수·작성시간을 굳이 노출하지 않고 제목만 한 줄로 보여준다.
// (조회·시간은 공지사항 목록 페이지의 NoticeList에서 확인 가능)
export default function NoticeRow({ notice }: Props) {
  return (
    <li className="bg-neutral-100 hover:bg-neutral-200/70 dark:bg-neutral-800/40 dark:hover:bg-neutral-800/70">
      <Link href={`/notices/${notice.id}`} className="flex items-center justify-between gap-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          {/* 번호 칸의 공지 표시 역할 (PostRow의 카테고리 배지 위치) */}
          <NoticeBadges pinned={notice.pinned} featured={notice.featured} size="md" />
          <span className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {notice.title}
          </span>
        </div>

        {/* 공지 요약에는 작성자가 없어 운영 주체를 고정 표기 */}
        <span className="shrink-0 text-xs text-neutral-500">관리자</span>
      </Link>
    </li>
  )
}
