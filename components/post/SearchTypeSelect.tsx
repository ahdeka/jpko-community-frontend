'use client'

import { useRouter } from 'next/navigation'
import { SEARCH_TYPES, parseSearchType, searchHref } from '@/lib/search'
import type { SearchType } from '@/types'

// 검색 범위 선택 드롭다운 (제목+내용 / 제목 / 작성자).
//
// 선택 즉시 이동한다 — 별도 "적용" 버튼을 두면 클릭이 두 번이 되고,
// 버튼을 누르지 않은 채 결과를 보며 "왜 안 바뀌지" 하는 상태가 생긴다.
// 선택값은 state가 아니라 URL(current prop)에서 오므로 뒤로가기·새로고침·링크 공유가 모두 맞아떨어진다.
//
// 범위가 바뀌면 결과 집합 자체가 달라지므로 항상 1페이지부터 다시 본다(searchHref의 page 기본값 0).
export default function SearchTypeSelect({
  keyword,
  current,
}: {
  keyword: string
  current: SearchType
}) {
  const router = useRouter()

  return (
    <select
      aria-label="검색 범위"
      value={current}
      onChange={e => {
        const next = parseSearchType(e.target.value)
        if (next === current) return // 같은 값 재선택은 불필요한 요청만 만든다
        router.push(searchHref(keyword, next))
      }}
      className="shrink-0 rounded border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-700 outline-none focus:border-orange-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:focus:border-orange-500"
    >
      {SEARCH_TYPES.map(({ value, label }) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  )
}
