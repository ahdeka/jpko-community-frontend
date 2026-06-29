import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'
import { categoriesApi } from '@/lib/api/categories'
import { postsApi } from '@/lib/api/posts'
import { noticesApi } from '@/lib/api/notices'

// sitemap에 담을 게시글/공지 최대 수(과도하게 커지지 않도록 상한).
// 규모가 커지면 분할 sitemap으로 확장하면 된다.
const MAX_ENTRIES = 200

// /sitemap.xml 생성. 백엔드 조회 실패 시에도 정적 라우트는 항상 포함되도록 개별 catch.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'hourly', priority: 1 },
    { url: `${SITE_URL}/posts`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/notices`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
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
