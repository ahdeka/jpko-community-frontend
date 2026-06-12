import { postsApi } from '@/lib/api/posts'
import PostList from './PostList'
import SectionCard from '@/components/common/SectionCard'
import type { PostSummary } from '@/types'

const RECENT_POSTS_LIMIT = 6

export default async function RecentPostsSection() {
  let posts: PostSummary[] = []

  try {
    const res = await postsApi.getAll(0, RECENT_POSTS_LIMIT)
    posts = res.data?.posts?.content ?? []
  } catch {}

  return (
    <SectionCard title="최신 글" bulletColor="bg-blue-500" href="/posts" linkLabel="전체보기">
      <PostList posts={posts} showCategory />
    </SectionCard>
  )
}
