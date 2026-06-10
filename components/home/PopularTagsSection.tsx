import SectionCard from '@/components/common/SectionCard'
import { MOCK_POPULAR_TAGS } from '@/lib/mock-data'

export default function PopularTagsSection() {
  return (
    <SectionCard title="인기 태그" bulletColor="bg-pink-500">
      <div className="flex flex-wrap gap-2">
        {MOCK_POPULAR_TAGS.map(tag => (
          <span
            key={tag.id}
            className="rounded-full bg-neutral-800 px-3 py-1 text-xs text-neutral-300 hover:bg-neutral-700"
          >
            {tag.label}
          </span>
        ))}
      </div>
    </SectionCard>
  )
}
