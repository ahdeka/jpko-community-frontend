import { PostSummary, NoticeSummary } from '@/types'
import PostRow, { POST_GRID, type PostRowVariant } from './PostRow'
import NoticeRow from '@/components/notice/NoticeRow'

interface Props {
  posts: PostSummary[]
  // 목록 상단에 고정 노출할 공지(0페이지에서만 전달). 같은 테이블 안에서
  // 게시글 행보다 위에, 어두운 배경으로 렌더된다.
  pinnedNotices?: NoticeSummary[]
  showCategory?: boolean
  compact?: boolean
  // 'card'(기본): 2줄 카드형 / 'table': 데스크탑 표형. 추후 뷰 토글로 전환 가능.
  variant?: PostRowVariant
  // 상세 진입 링크에 붙일 "보던 목록" 컨텍스트(각 행으로 전달).
  listContext?: string
}

export default function PostList({
  posts,
  pinnedNotices = [],
  showCategory = false,
  compact = false,
  variant = 'card',
  listContext,
}: Props) {
  // 공지·게시글이 모두 없을 때만 빈 상태 문구를 보여준다.
  if (posts.length === 0 && pinnedNotices.length === 0) {
    return <p className="text-neutral-500 text-center py-10">게시글이 없습니다.</p>
  }

  const rows = (
    <>
      {pinnedNotices.map(notice => (
        <NoticeRow key={`notice-${notice.id}`} notice={notice} />
      ))}
      {posts.map(post => (
        <PostRow
          key={post.id}
          post={post}
          showCategory={showCategory}
          compact={compact}
          variant={variant}
          listContext={listContext}
        />
      ))}
    </>
  )

  // 표형(table): 데스크탑 컬럼 헤더 + 목록. (글이 많아졌을 때를 위한 옵션)
  if (variant === 'table' && !compact) {
    return (
      <div>
        {/* 데스크탑 전용 컬럼 헤더 (모바일에서는 hidden) */}
        <div className={`hidden ${POST_GRID} border-b border-neutral-200 pb-2 text-xs font-medium text-neutral-400 dark:border-neutral-800`}>
          <span>제목</span>
          <span className="text-center">글쓴이</span>
          <span className="text-center">작성일</span>
          <span className="text-center">조회</span>
          <span className="text-center">추천</span>
        </div>
        {/* 모바일은 상단 테두리를 직접, 데스크탑은 헤더가 상단 경계라 md에서 제거 */}
        <ul className="divide-y divide-neutral-200 border-b border-t border-neutral-200 md:border-t-0 dark:divide-neutral-800 dark:border-neutral-800">
          {rows}
        </ul>
      </div>
    )
  }

  // card(기본)·compact: 헤더 없는 단순 목록
  return (
    <ul className="divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
      {rows}
    </ul>
  )
}
