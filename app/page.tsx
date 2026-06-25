import { categoriesApi } from '@/lib/api/categories'
import { postsApi } from '@/lib/api/posts'
import { noticesApi } from '@/lib/api/notices'
import RecentPostsSection from '@/components/post/RecentPostsSection'
import CategorySection from '@/components/post/CategorySection'
import WeeklyPopularSection from '@/components/home/WeeklyPopularSection'
import NoticeSection from '@/components/home/NoticeSection'
import FeaturedNoticeBar from '@/components/home/FeaturedNoticeBar'
import type { Category, NoticeSummary, PostSummary } from '@/types'

const RECENT_POSTS_LIMIT = 6

// 메인 페이지를 매 요청마다 동적 렌더한다(/posts 목록 페이지와 동일).
// - 캐시 옵션 없는 fetch(게시글 목록)는 no-store가 되어 매번 최신 글을 받는다.
// - revalidate를 지정한 fetch(카테고리 3600)는 그대로 캐시되어 불필요한 호출을 막는다.
export const revalidate = 0

export default async function Home() {
  // 카테고리·게시글 목록과 메인 상단 중요 공지(featured)를 병렬로 조회한다.
  // (한쪽이 실패해도 나머지는 그려야 하므로 Promise.all + 개별 catch로 부분 실패를 허용한다.)
  // 메인 상단은 featured 공지를 보여준다. pinned 공지는 게시판 목록(/posts) 상단에만 노출된다.
  const [categoriesRes, postListRes, featuredRes] = await Promise.all([
    categoriesApi.getAll().catch(() => null),
    postsApi.getAll(0, RECENT_POSTS_LIMIT).catch(() => null),
    noticesApi.getFeatured().catch(() => null),
  ])

  const categories: Category[] = (categoriesRes?.data ?? [])
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder)

  const featuredNotices: NoticeSummary[] = featuredRes?.data ?? []
  const recentPosts: PostSummary[] = postListRes?.data?.posts?.content ?? []

  return (
    <div className="flex flex-col gap-6">
      {/* 메인 상단 중요 공지 띠(featured): 내용 없으면 렌더 안 함 */}
      <FeaturedNoticeBar notices={featuredNotices} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="flex flex-col gap-6 min-w-0">
          <RecentPostsSection posts={recentPosts} />
          {categories.map(category => (
            <CategorySection key={category.id} category={category} />
          ))}
        </div>
        <aside className="flex flex-col gap-6">
          <WeeklyPopularSection />
          <NoticeSection />
        </aside>
      </div>
    </div>
  )
}
