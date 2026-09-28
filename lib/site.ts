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

// 검색 결과에 실릴 이유가 없는 화면에 붙이는 robots 값.
//
// 게임센터(룰렛·파칭코·슬롯)에 쓴다. 두 가지 이유가 겹친다 —
//  1) 로그인해야 보이는 화면이라 크롤러 눈에는 로그인 안내문 한 줄뿐이다(색인돼도 빈 페이지).
//  2) 포인트는 현금 가치가 없어 구글 기준 "소셜 카지노"에 해당하지만, 광고 심사에서
//     슬롯·파칭코 화면이 사이트 첫인상이 되는 건 불리하다(한국은 도박 광고 제한 국가).
//
// ⚠️ 여기에 robots.txt Disallow를 같이 걸면 안 된다. 크롤러가 페이지를 아예 못 읽게 되어
//    이 noindex 자체를 볼 수 없고, 이미 색인된 URL이 그대로 남는다(구글 공식 권고).
//    색인에서 빠진 것을 확인한 뒤에 차단하는 순서라야 한다.
export const NOINDEX_ROBOTS = { index: false, follow: false } as const

// 백엔드가 sanitize해 내려준 본문 HTML에서 사람이 읽는 텍스트만 남긴다.
// <img>만 있는 글(이미지 한 장 업로드)은 빈 문자열이 된다 — 이게 색인 판정의 핵심 신호다.
export function plainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// HTML 본문에서 태그를 제거하고 메타 description용으로 길이를 자른 발췌문.
export function excerpt(html: string, maxLength = 150): string {
  const text = plainText(html)
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '…'
}

// ── 게시글 색인 기준 ─────────────────────────────────────────────────────────
// 애드센스가 2026-09-21 "콘텐츠 부족 또는 낮은 콘텐츠 품질"로 비승인한 뒤 도입.
// 실측상 게시글의 약 40%가 본문 50자 미만이었고, 이미지 한 장만 올려 텍스트가 0자인 글도 있었다.
// 검색엔진과 광고 심사는 "글 개수"가 아니라 "페이지당 실질 텍스트"를 보므로, 이런 글이 색인되면
// 사이트 전체가 저품질로 평가된다. 글을 지우는 게 아니라 색인 대상에서만 뺀다(사이트 안에서는 정상 노출).
//
// 기준을 두 갈래로 둔 이유: 커뮤니티에서는 댓글도 페이지의 실질 콘텐츠다.
// 본문이 짧아도 토론이 붙은 글은 읽을 거리가 있으므로 색인한다.
//
// 임계값 근거 — 2026-09-28 운영 게시글 25개 표본의 실제 본문 길이 분포:
//   0자 4개 / 1~30자 8개 / 30~70자 3개 / 117·127자 2개 / 299·309·318·478·517자 5개
// 150자와 250자 사이에 글이 하나도 없어, 250으로 잡아도 150일 때와 결과가 같다(더 안전한 쪽을 택함).
// 이 기준으로 전체 70개 중 약 14개가 색인된다. 숫자가 적어 보이지만, 저품질 페이지 56개를
// 색인에서 빼는 편이 사이트 전체 평가에 유리하다. 색인 대상을 늘리는 길은 임계값을 낮추는 게 아니라
// 읽을 만한 글을 쓰는 것이다.
const MIN_TEXT_LENGTH = 250          // 본문만으로 색인되는 최소 길이
const MIN_TEXT_WITH_COMMENTS = 80    // 댓글이 충분히 달렸을 때 완화되는 하한
const MIN_COMMENTS_FOR_INDEX = 3

// 이 게시글을 검색엔진 색인 대상으로 삼을지.
// 호출부는 결과를 Metadata.robots에 그대로 반영한다(false면 noindex).
export function isIndexablePost(contentHtml: string, commentCount: number): boolean {
  const length = plainText(contentHtml).length
  if (length >= MIN_TEXT_LENGTH) return true
  return length >= MIN_TEXT_WITH_COMMENTS && commentCount >= MIN_COMMENTS_FOR_INDEX
}
