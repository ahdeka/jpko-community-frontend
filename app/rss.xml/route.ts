import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '@/lib/site'
import { postsApi } from '@/lib/api/posts'
import type { PostSummary } from '@/types'

// /rss.xml — 최신 게시글 RSS 2.0 피드.
// 목적: 네이버 서치어드바이저 "RSS 제출"용. 네이버 로봇이 새 글을 sitemap보다 빠르게 발견한다.

// 피드에 담을 최신 게시글 수. RSS는 "최근 변경분" 알림용이라 전체 목록이 필요 없다.
const FEED_SIZE = 50

// sitemap과 같은 주기(1시간)로 백그라운드 재생성(ISR). 재생성 중에는 직전 버전을 응답한다.
export const revalidate = 3600

// XML 1.0에서 허용되지 않는 제어문자(탭·개행 제외)가 제목에 섞이면 피드 전체가 파싱 실패하므로 제거한다.
const INVALID_XML_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g

function escapeXml(text: string): string {
  return text
    .replace(INVALID_XML_CHARS, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// 목록 응답(PostSummary)엔 본문이 없어 description은 "[카테고리] 제목"으로 만든다.
// 본문 발췌를 위해 글마다 상세를 조회하면 요청이 50배로 늘어나므로 하지 않는다.
// 작성자(author)는 넣지 않는다 — 익명 글의 표기 규칙을 피드에서 따로 지킬 필요가 없도록.
function toItem(post: PostSummary): string {
  const link = `${SITE_URL}/posts/${post.id}`
  const pubDate = new Date(post.createdAt)
  return [
    '<item>',
    `<title>${escapeXml(post.title)}</title>`,
    `<link>${link}</link>`,
    `<guid isPermaLink="true">${link}</guid>`,
    `<description>${escapeXml(`[${post.categoryName}] ${post.title}`)}</description>`,
    `<category>${escapeXml(post.categoryName)}</category>`,
    // createdAt이 파싱 불가한 값이면 Invalid Date → toUTCString()이 "Invalid Date"를 내므로 생략한다.
    Number.isNaN(pubDate.getTime()) ? '' : `<pubDate>${pubDate.toUTCString()}</pubDate>`,
    '</item>',
  ].join('')
}

export async function GET() {
  // 백엔드 조회 실패 시에도 빈 채널로 유효한 XML을 응답한다(sitemap과 같은 방침).
  // 실패 결과도 최대 1시간 캐시되지만, 다음 재생성 때 자동으로 복구된다.
  const posts = await postsApi
    .getAll(0, FEED_SIZE)
    .then(res => res.data?.posts?.content ?? [])
    .catch(() => [])

  const lastBuildDate = new Date().toUTCString()

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${escapeXml(SITE_NAME)}</title>
<link>${SITE_URL}</link>
<description>${escapeXml(SITE_DESCRIPTION)}</description>
<language>ko</language>
<lastBuildDate>${lastBuildDate}</lastBuildDate>
<atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
${posts.map(toItem).join('\n')}
</channel>
</rss>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
