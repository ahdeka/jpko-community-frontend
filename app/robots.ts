import type { MetadataRoute } from 'next'
import { SITE_URL, INDEXING_ENABLED } from '@/lib/site'

// /robots.txt 생성.
// 보안·법령 게이트 전에는 전체 크롤링을 차단하고, 게이트 통과 후
// NEXT_PUBLIC_ALLOW_INDEXING=true 로 개방한다.
export default function robots(): MetadataRoute.Robots {
  if (!INDEXING_ENABLED) {
    return {
      rules: { userAgent: '*', disallow: '/' },
    }
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // 인증/개인/작성 영역은 색인 대상이 아니므로 제외
      disallow: ['/mypage', '/admin', '/login', '/signup', '/posts/new', '/posts/*/edit'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
