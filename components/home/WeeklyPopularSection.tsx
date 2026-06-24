import SectionCard from '@/components/common/SectionCard'
import RankedPostList from '@/components/common/RankedPostList'
import { postsApi } from '@/lib/api/posts'

export default async function WeeklyPopularSection() {
  const res = await postsApi.getPopular(7, 5).catch(() => null)
  const posts = res?.data ?? []

  return (
    <SectionCard title="인기글" bulletColor="bg-orange-500">
      <RankedPostList posts={posts} />
    </SectionCard>
  )
}
