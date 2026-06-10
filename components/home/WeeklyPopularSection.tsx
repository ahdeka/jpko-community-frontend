import SectionCard from '@/components/common/SectionCard'
import RankedPostList from '@/components/common/RankedPostList'
import { MOCK_WEEKLY_POPULAR_POSTS } from '@/lib/mock-data'

export default function WeeklyPopularSection() {
  return (
    <SectionCard title="주간 인기글" bulletColor="bg-orange-500">
      <RankedPostList posts={MOCK_WEEKLY_POPULAR_POSTS} columns={1} />
    </SectionCard>
  )
}
