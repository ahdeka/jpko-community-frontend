import { categoriesApi } from '@/lib/api/categories'
import { postsApi } from '@/lib/api/posts'
import { noticesApi } from '@/lib/api/notices'
import RecentPostsSection from '@/components/post/RecentPostsSection'
import CategorySection from '@/components/post/CategorySection'
import PopularSection from '@/components/home/PopularSection'
import NoticeSection from '@/components/home/NoticeSection'
import FeaturedNoticeBar from '@/components/home/FeaturedNoticeBar'
import type { Category, NoticeSummary, PostSummary } from '@/types'

const RECENT_POSTS_LIMIT = 6

// 메인페이지 한정: 자유게시판을 최신글 바로 아래(카테고리 섹션 맨 앞)에 노출한다.
// DB의 display_order(자유게시판=6)는 게시판 목록·헤더 등에서 그대로 쓰이므로 건드리지 않고,
// 메인페이지 렌더 순서만 이 slug를 최우선으로 끌어올린다.
const PRIORITY_CATEGORY_SLUG = 'free'

// 아카이브 데이터는 바뀌지 않으므로 정적으로 만들어 둔다.
export const dynamic = 'force-static'

export default async function Home() {
  // 카테고리·게시글 목록과 메인 상단 중요 공지(featured)를 병렬로 조회한다.
  // (한쪽이 실패해도 나머지는 그려야 하므로 Promise.all + 개별 catch로 부분 실패를 허용한다.)
  // 메인 상단은 featured 공지를 보여준다. pinned 공지는 게시판 목록(/posts) 상단에만 노출된다.
  // 인기글은 오늘/주간을 각각 따로 조회한다(백엔드는 period별 캐시를 들고 있고,
  // 노출 개수는 백엔드 display-size 설정이 정한다 — 현재 각 5개).
  // 아카이브: 인기글은 "오늘/주간" 구분 없이 운영 기간 전체 기준 한 목록만 보여준다.
  const [categoriesRes, postListRes, featuredRes, popularRes] =
    await Promise.all([
      categoriesApi.getAll().catch(() => null),
      postsApi.getAll(0, RECENT_POSTS_LIMIT).catch(() => null),
      noticesApi.getFeatured().catch(() => null),
      postsApi.getPopular('WEEKLY').catch(() => null),
    ])

  const categories: Category[] = (categoriesRes?.data ?? [])
    .slice()
    .sort((a, b) => {
      // 자유게시판을 맨 앞으로. slug는 unique라 둘 다 우선순위일 수 없다.
      const aPriority = a.slug === PRIORITY_CATEGORY_SLUG
      const bPriority = b.slug === PRIORITY_CATEGORY_SLUG
      if (aPriority !== bPriority) return aPriority ? -1 : 1
      // 그 외에는 기존 displayOrder 오름차순 유지.
      return a.displayOrder - b.displayOrder
    })

  const featuredNotices: NoticeSummary[] = featuredRes?.data ?? []
  const recentPosts: PostSummary[] = postListRes?.data?.posts?.content ?? []
  // 한쪽 인기글이 실패해도 나머지 사이드바는 그려야 하므로 빈 배열로 떨어뜨린다.
  const popularPosts: PostSummary[] = popularRes?.data ?? []

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
          <PopularSection
            title="인기글"
            bulletColor="bg-red-500"
            posts={popularPosts}
          />
          <NoticeSection />
        </aside>
      </div>
    </div>
  )
}
