import type { NoticeDetail as NoticeDetailData } from '@/types'
import { formatDate } from '@/lib/format'
import NoticeBadges from './NoticeBadges'
import PostActions from '@/components/post/PostActions'
import AuthorName from '@/components/common/AuthorName'

interface Props {
  notice: NoticeDetailData
}

export default function NoticeDetail({ notice }: Props) {
  return (
    <article>
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-4 mb-4">
        {/* 공지·중요 배지는 좌측에 나란히 (fragment 두 배지가 한 덩어리로 묶이도록 단순 flex) */}
        <div className="mb-2 flex items-center gap-2">
          <NoticeBadges pinned={notice.pinned} featured={notice.featured} />
        </div>
        <h1 className="mb-3 text-xl font-bold">{notice.title}</h1>
        <div className="flex items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
          <AuthorName author={notice.author} />
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

      {/* 게시글 상세와 동일한 하단 액션 바. 목록 아이콘은 공지 목록(/notices)으로 이동. */}
      <PostActions listHref="/notices" shareTitle={notice.title} />
    </article>
  )
}
