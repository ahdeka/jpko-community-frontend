import { parseSearchType } from '@/lib/search'
import type { SearchType } from '@/types'

// 상세 페이지 하단에 "보던 목록"을 복원하기 위한 컨텍스트.
// 목록(전체/카테고리/검색)에서 글로 진입할 때 이 컨텍스트를 쿼리스트링으로 실어
// 상세 URL에 남기고, 상세 페이지가 이를 읽어 같은 목록·페이지를 다시 그린다.
export type ListContext =
  | { from: 'all'; page: number }
  | { from: 'cat'; slug: string; page: number }
  // 검색은 키워드뿐 아니라 범위(제목/제목+내용)까지 같아야 "보던 목록"이 그대로 복원된다.
  | { from: 'search'; keyword: string; type: SearchType; page: number }

// 상세 진입 링크에 붙일 쿼리스트링 (예: "from=all&p=2")
export function encodeListContext(ctx: ListContext): string {
  const p = new URLSearchParams()
  p.set('from', ctx.from)
  p.set('p', String(ctx.page))
  if (ctx.from === 'cat') p.set('slug', ctx.slug)
  if (ctx.from === 'search') {
    p.set('keyword', ctx.keyword)
    // 상세 URL의 'type'은 다른 의미로 오해되기 쉬워 검색 전용임이 드러나는 'st'로 싣는다.
    p.set('st', ctx.type)
  }
  return p.toString()
}

// 상세 페이지의 searchParams에서 컨텍스트를 복원. 유효하지 않으면 null(→ 폴백 처리).
export function parseListContext(sp: {
  from?: string
  p?: string
  slug?: string
  keyword?: string
  st?: string
}): ListContext | null {
  const page = Math.max(0, Number(sp.p) || 0)

  if (sp.from === 'all') return { from: 'all', page }
  if (sp.from === 'cat' && sp.slug) return { from: 'cat', slug: sp.slug, page }
  if (sp.from === 'search' && sp.keyword) {
    // st가 없는 링크(이 기능 이전에 공유된 주소)는 기본값으로 해석된다.
    return { from: 'search', keyword: sp.keyword, type: parseSearchType(sp.st), page }
  }
  return null
}
