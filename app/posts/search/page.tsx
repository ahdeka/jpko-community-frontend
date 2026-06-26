import { postsApi } from '@/lib/api/posts'
import PostList from '@/components/post/PostList'
import Pagination from '@/components/common/Pagination'
import { encodeListContext } from '@/lib/list-context'

const PAGE_SIZE = 20

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ keyword?: string; page?: string }>
}) {
  const { keyword = '', page } = await searchParams
  const trimmedKeyword = keyword.trim()
  const pageNumber = Math.max(0, Number(page) || 0)

  if (trimmedKeyword.length < 2) {
    return (
      <div>
        <h1 className="text-xl font-bold mb-4">검색 결과</h1>
        <p className="text-neutral-500 text-center py-10">검색어는 2자 이상 입력해주세요.</p>
      </div>
    )
  }

  const res = await postsApi
    .search({ keyword: trimmedKeyword, page: pageNumber, size: PAGE_SIZE })
    .catch(() => null)

  const posts = res?.data?.posts?.content ?? []
  const totalPages = res?.data?.posts?.totalPages ?? 0
  const totalElements = res?.data?.posts?.totalElements ?? 0

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">
        &apos;{trimmedKeyword}&apos; 검색 결과{' '}
        <span className="text-neutral-500 font-normal">({totalElements}건)</span>
      </h1>
      <PostList
        posts={posts}
        showCategory
        listContext={encodeListContext({ from: 'search', keyword: trimmedKeyword, page: pageNumber })}
      />
      <Pagination
        currentPage={pageNumber}
        totalPages={totalPages}
        basePath="/posts/search"
        searchParams={{ keyword: trimmedKeyword }}
      />
    </div>
  )
}
