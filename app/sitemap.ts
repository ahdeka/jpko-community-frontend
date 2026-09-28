import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'
import { categoriesApi } from '@/lib/api/categories'
import { postsApi } from '@/lib/api/posts'
import { noticesApi } from '@/lib/api/notices'

// sitemap에 담을 게시글/공지 최대 수(과도하게 커지지 않도록 상한).
// 규모가 커지면 분할 sitemap으로 확장하면 된다.
const MAX_ENTRIES = 200

// sitemap.ts는 기본으로 "빌드 시 1회 생성 후 캐시"된다(Next 문서: 요청 시점 API가 없으면 캐시).
// 그대로 두면 배포 시점의 글 목록에서 멈춰 새 글이 다음 배포 전까지 빠지므로,
// 1시간마다 백그라운드에서 다시 생성한다(ISR). 재생성 중에도 직전 버전을 계속 응답한다.
export const revalidate = 3600

// /sitemap.xml 생성. 백엔드 조회 실패 시에도 정적 라우트는 항상 포함되도록 개별 catch.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'hourly', priority: 1 },
    { url: `${SITE_URL}/posts`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/notices`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
    // 사이트 신뢰성 페이지. 거의 바뀌지 않지만, 검색엔진과 광고 심사가 "운영 주체와 연락처가
    // 밝혀져 있는지"를 보기 때문에 색인 대상에 명시적으로 포함한다.
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
  ]

  const [categoriesRes, postsRes, noticesRes] = await Promise.all([
    categoriesApi.getAll().catch(() => null),
    postsApi.getAll(0, MAX_ENTRIES).catch(() => null),
    noticesApi.getAll(0, MAX_ENTRIES).catch(() => null),
  ])

  const categoryRoutes: MetadataRoute.Sitemap = (categoriesRes?.data ?? []).map(category => ({
    url: `${SITE_URL}/posts/category/${category.slug}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.7,
  }))

  // 목록(요약) 조회라 게시글 조회수는 증가하지 않는다.
  //
  // ⚠️ 내용이 빈약한 글은 상세 페이지에서 noindex 처리되지만(lib/site.ts isIndexablePost),
  //    여기서는 걸러내지 못한다. 목록 응답(PostSummaryResponse)에 본문이 없고,
  //    본문을 보려면 글마다 상세를 조회해야 하는데 그 API는 호출할 때마다 조회수를 올린다
  //    (1시간마다 재생성되므로 전체 글 조회수가 계속 부풀게 된다).
  //    → 그래서 sitemap에는 전부 담고 색인 여부는 페이지가 판정한다. 그 결과 GSC 색인 보고서에
  //      "제출된 URL이 noindex입니다" 항목이 뜨는데, 페널티가 아니라 이 구조의 부작용이다.
  //      백엔드 목록 응답에 본문 길이(또는 색인 가능 여부) 필드가 생기면 여기서도 걸러낼 것.
  const postRoutes: MetadataRoute.Sitemap = (postsRes?.data?.posts?.content ?? []).map(post => ({
    url: `${SITE_URL}/posts/${post.id}`,
    lastModified: new Date(post.createdAt),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  const noticeRoutes: MetadataRoute.Sitemap = (noticesRes?.data?.content ?? []).map(notice => ({
    url: `${SITE_URL}/notices/${notice.id}`,
    lastModified: new Date(notice.createdAt),
    changeFrequency: 'monthly',
    priority: 0.4,
  }))

  return [...staticRoutes, ...categoryRoutes, ...postRoutes, ...noticeRoutes]
}
