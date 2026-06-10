import SectionCard from '@/components/common/SectionCard'
import RankedPostList from '@/components/common/RankedPostList'
import { MOCK_REALTIME_POPULAR_POSTS } from '@/lib/mock-data'

export default function PopularPostsSection() {
  return (
    <SectionCard title="실시간 인기글" bulletColor="bg-orange-500" href="/posts" linkLabel="전체보기">
      <RankedPostList posts={MOCK_REALTIME_POPULAR_POSTS} columns={2} />
    </SectionCard>
  )
}
