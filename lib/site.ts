// 사이트 전역 상수 — SEO 메타·robots·sitemap에서 공용으로 쓴다.
// 도메인은 환경변수로 주입(Vercel 등)하고, 미설정 시 운영 도메인으로 폴백한다.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://jpkocommunity.site').replace(/\/+$/, '')
export const SITE_NAME = 'JPKO Community'
export const SITE_DESCRIPTION = '일본 생활·취업·유학·워킹홀리데이에 관심 있는 한국인 커뮤니티'

// 문의·개인정보 관련 연락처(환경변수 우선).
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'jpkocommunity@gmail.com'

// 검색엔진 색인 허용 여부.
// 보안·법령 게이트가 끝나기 전에는 크롤링을 열지 않기 위해 환경변수로 제어한다.
// (NEXT_PUBLIC_ALLOW_INDEXING=true 일 때만 색인 허용 — 기본은 차단)
export const INDEXING_ENABLED = process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true'

// HTML 본문에서 태그를 제거하고 메타 description용으로 길이를 자른 발췌문.
export function excerpt(html: string, maxLength = 150): string {
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '…'
}
