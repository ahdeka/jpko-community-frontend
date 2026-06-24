import PostList from './PostList'
import SectionCard from '@/components/common/SectionCard'
import type { PostSummary } from '@/types'

interface Props {
  posts: PostSummary[]
}

// 데이터는 상위(app/page.tsx)에서 게시글 목록을 한 번만 조회해 내려준다.
// (같은 /api/posts 응답에서 고정 공지도 함께 쓰기 위함 — 중복 요청 방지)
export default function RecentPostsSection({ posts }: Props) {
  return (
    <SectionCard title="최신 글" bulletColor="bg-blue-500" href="/posts" linkLabel="전체보기">
      <PostList posts={posts} showCategory compact />
    </SectionCard>
  )
}
