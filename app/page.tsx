import { categoriesApi } from '@/lib/api/categories'
import RecentPostsSection from '@/components/post/RecentPostsSection'
import CategorySection from '@/components/post/CategorySection'
import PopularPostsSection from '@/components/home/PopularPostsSection'
import WeeklyPopularSection from '@/components/home/WeeklyPopularSection'
import NoticeSection from '@/components/home/NoticeSection'
import PopularTagsSection from '@/components/home/PopularTagsSection'
import type { Category } from '@/types'

export default async function Home() {
  let categories: Category[] = []

  try {
    const res = await categoriesApi.getAll()
    categories = (res.data ?? []).slice().sort((a, b) => a.displayOrder - b.displayOrder)
  } catch {}

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      <div className="flex flex-col gap-6 min-w-0">
        <PopularPostsSection />
        <RecentPostsSection />
        {categories.map(category => (
          <CategorySection key={category.id} category={category} />
        ))}
      </div>
      <aside className="flex flex-col gap-6">
        <WeeklyPopularSection />
        <NoticeSection />
        <PopularTagsSection />
      </aside>
    </div>
  )
}
