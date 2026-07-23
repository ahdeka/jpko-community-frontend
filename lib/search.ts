import type { SearchType } from '@/types'

// 게시글 검색 범위. 백엔드 SearchType enum과 1:1이며,
// 값이 늘어나면 백엔드 enum부터 먼저 늘려야 한다(모르는 값을 보내면 400).
export const SEARCH_TYPES: { value: SearchType; label: string }[] = [
  { value: 'TITLE_CONTENT', label: '제목+내용' },
  { value: 'TITLE', label: '제목' },
  { value: 'NICKNAME', label: '작성자' },
]

// 백엔드 @RequestParam의 defaultValue와 동일하게 맞춘다.
export const DEFAULT_SEARCH_TYPE: SearchType = 'TITLE_CONTENT'

// URL 쿼리스트링의 type 값을 안전하게 해석한다.
// 주소창에 아무 문자열이나 넣을 수 있으므로, 아는 값이 아니면 기본값으로 떨어뜨린다.
// (그대로 백엔드에 넘기면 enum 변환 실패로 400이 난다)
export function parseSearchType(raw?: string): SearchType {
  return SEARCH_TYPES.some(t => t.value === raw) ? (raw as SearchType) : DEFAULT_SEARCH_TYPE
}

// 검색 결과 URL에 실을 쿼리 파라미터.
// 기본값일 때 type을 생략해 주소를 깔끔하게 유지한다(공유된 링크도 짧아진다).
// 생략해도 백엔드·프론트 모두 같은 기본값을 쓰므로 결과는 동일하다.
export function searchQueryParams(keyword: string, type: SearchType): Record<string, string> {
  const params: Record<string, string> = { keyword }
  if (type !== DEFAULT_SEARCH_TYPE) params.type = type
  return params
}

// 검색 결과 페이지 경로 (page는 0-based)
export function searchHref(keyword: string, type: SearchType, page = 0): string {
  const params = new URLSearchParams(searchQueryParams(keyword, type))
  if (page > 0) params.set('page', String(page))
  return `/posts/search?${params.toString()}`
}
