import { categoriesApi } from '@/lib/api/categories'
import { postsApi } from '@/lib/api/posts'
import RecentPostsSection from '@/components/post/RecentPostsSection'
import CategorySection from '@/components/post/CategorySection'
import WeeklyPopularSection from '@/components/home/WeeklyPopularSection'
import NoticeSection from '@/components/home/NoticeSection'
import PinnedNoticeBar from '@/components/home/PinnedNoticeBar'
import type { Category, NoticeSummary, PostSummary } from '@/types'

const RECENT_POSTS_LIMIT = 6

export default async function Home() {
  // 카테고리 목록과 게시글 목록을 병렬로 조회한다.
  // 고정 공지(pinnedNotices)는 /api/posts 응답에 함께 내려오므로 별도 요청이 필요 없다.
  // (한쪽이 실패해도 나머지는 그려야 하므로 Promise.all + 개별 catch로 부분 실패를 허용한다.)
  const [categoriesRes, postListRes] = await Promise.all([
    categoriesApi.getAll().catch(() => null),
    postsApi.getAll(0, RECENT_POSTS_LIMIT).catch(() => null),
  ])

  const categories: Category[] = (categoriesRes?.data ?? [])
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder)

  const pinnedNotices: NoticeSummary[] = postListRes?.data?.pinnedNotices ?? []
  const recentPosts: PostSummary[] = postListRes?.data?.posts?.content ?? []

  return (
    <div className="flex flex-col gap-6">
      {/* 상단 고정 공지 띠: 데스크탑·모바일 모두 페이지 최상단에 노출 (내용 없으면 렌더 안 함) */}
      <PinnedNoticeBar notices={pinnedNotices} />

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
