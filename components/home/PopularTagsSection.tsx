import SectionCard from '@/components/common/SectionCard'
import { MOCK_POPULAR_TAGS } from '@/lib/mock-data'

export default function PopularTagsSection() {
  return (
    <SectionCard title="인기 태그" bulletColor="bg-pink-500">
      <div className="flex flex-wrap gap-2">
        {MOCK_POPULAR_TAGS.map(tag => (
          <span
            key={tag.id}
            className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            {tag.label}
          </span>
        ))}
      </div>
    </SectionCard>
  )
}
