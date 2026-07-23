import { postsApi } from '@/lib/api/posts'
import PostList from '@/components/post/PostList'
import Pagination from '@/components/common/Pagination'
import SearchTypeSelect from '@/components/post/SearchTypeSelect'
import { encodeListContext } from '@/lib/list-context'
import { parseSearchType, searchQueryParams } from '@/lib/search'

const PAGE_SIZE = 20

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ keyword?: string; type?: string; page?: string }>
}) {
  const { keyword = '', type, page } = await searchParams
  const trimmedKeyword = keyword.trim()
  const pageNumber = Math.max(0, Number(page) || 0)
  // 주소창으로 아무 값이나 들어올 수 있어 화이트리스트로 걸러 기본값(제목+내용)으로 떨어뜨린다.
  const searchType = parseSearchType(type)

  if (trimmedKeyword.length < 2) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-4">검색 결과</h1>
        <p className="text-neutral-500 text-center py-10">검색어는 2자 이상 입력해주세요.</p>
      </div>
    )
  }

  const res = await postsApi
    .search({ keyword: trimmedKeyword, type: searchType, page: pageNumber, size: PAGE_SIZE })
    .catch(() => null)

  const posts = res?.data?.posts?.content ?? []
  const totalPages = res?.data?.posts?.totalPages ?? 0
  const totalElements = res?.data?.posts?.totalElements ?? 0

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">
          &apos;{trimmedKeyword}&apos; 검색 결과{' '}
          <span className="text-neutral-500 font-normal">({totalElements}건)</span>
        </h1>
        <SearchTypeSelect keyword={trimmedKeyword} current={searchType} />
      </div>
      <PostList
        posts={posts}
        showCategory
        listContext={encodeListContext({
          from: 'search',
          keyword: trimmedKeyword,
          type: searchType,
          page: pageNumber,
        })}
      />
      {/* 작성자 검색은 닉네임 "정확 일치"라 결과가 비기 쉽다. 오타인지 정말 글이 없는 건지
          구분되지 않으므로, PostList의 기본 안내("게시글이 없습니다") 아래에 이유를 덧붙인다. */}
      {posts.length === 0 && searchType === 'NICKNAME' && (
        <p className="-mt-6 pb-4 text-center text-xs text-neutral-400">
          작성자 검색은 닉네임이 정확히 일치해야 하며, 익명으로 쓴 글은 검색되지 않습니다.
        </p>
      )}
      {/* 페이지를 넘겨도 검색 범위가 유지되도록 type까지 같이 실어 보낸다. */}
      <Pagination
        currentPage={pageNumber}
        totalPages={totalPages}
        basePath="/posts/search"
        searchParams={searchQueryParams(trimmedKeyword, searchType)}
      />
    </div>
  )
}
