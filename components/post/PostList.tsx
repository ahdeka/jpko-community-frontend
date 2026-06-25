import { PostSummary, NoticeSummary } from '@/types'
import PostRow from './PostRow'
import NoticeRow from '@/components/notice/NoticeRow'

interface Props {
  posts: PostSummary[]
  // 목록 상단에 고정 노출할 공지(0페이지에서만 전달). 같은 테이블 안에서
  // 게시글 행보다 위에, 어두운 배경으로 렌더된다.
  pinnedNotices?: NoticeSummary[]
  showCategory?: boolean
  compact?: boolean
}

export default function PostList({ posts, pinnedNotices = [], showCategory = false, compact = false }: Props) {
  // 공지·게시글이 모두 없을 때만 빈 상태 문구를 보여준다.
  if (posts.length === 0 && pinnedNotices.length === 0) {
    return <p className="text-neutral-500 text-center py-10">게시글이 없습니다.</p>
  }

  return (
    <ul className="divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
      {pinnedNotices.map(notice => (
        <NoticeRow key={`notice-${notice.id}`} notice={notice} />
      ))}
      {posts.map(post => (
        <PostRow key={post.id} post={post} showCategory={showCategory} compact={compact} />
      ))}
    </ul>
  )
}
