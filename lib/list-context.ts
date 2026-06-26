// 상세 페이지 하단에 "보던 목록"을 복원하기 위한 컨텍스트.
// 목록(전체/카테고리/검색)에서 글로 진입할 때 이 컨텍스트를 쿼리스트링으로 실어
// 상세 URL에 남기고, 상세 페이지가 이를 읽어 같은 목록·페이지를 다시 그린다.
export type ListContext =
  | { from: 'all'; page: number }
  | { from: 'cat'; slug: string; page: number }
  | { from: 'search'; keyword: string; page: number }

// 상세 진입 링크에 붙일 쿼리스트링 (예: "from=all&p=2")
export function encodeListContext(ctx: ListContext): string {
  const p = new URLSearchParams()
  p.set('from', ctx.from)
  p.set('p', String(ctx.page))
  if (ctx.from === 'cat') p.set('slug', ctx.slug)
  if (ctx.from === 'search') p.set('keyword', ctx.keyword)
  return p.toString()
}

// 상세 페이지의 searchParams에서 컨텍스트를 복원. 유효하지 않으면 null(→ 폴백 처리).
export function parseListContext(sp: {
  from?: string
  p?: string
  slug?: string
  keyword?: string
}): ListContext | null {
  const page = Math.max(0, Number(sp.p) || 0)

  if (sp.from === 'all') return { from: 'all', page }
  if (sp.from === 'cat' && sp.slug) return { from: 'cat', slug: sp.slug, page }
  if (sp.from === 'search' && sp.keyword) return { from: 'search', keyword: sp.keyword, page }
  return null
}
