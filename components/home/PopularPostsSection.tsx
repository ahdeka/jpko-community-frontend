import SectionCard from '@/components/common/SectionCard'
import RankedPostList from '@/components/common/RankedPostList'
import { postsApi } from '@/lib/api/posts'

export default async function PopularPostsSection() {
  const res = await postsApi.getPopular(1, 6).catch(() => null)
  const posts = res?.data ?? []

  return (
    <SectionCard title="실시간 인기글" bulletColor="bg-orange-500" href="/posts" linkLabel="전체보기">
      <RankedPostList posts={posts} columns={2} />
    </SectionCard>
  )
}
