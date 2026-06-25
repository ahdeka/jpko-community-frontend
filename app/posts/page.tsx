import { postsApi } from '@/lib/api/posts'
import PostList from '@/components/post/PostList'
import Pagination from '@/components/common/Pagination'
import WriteButton from '@/components/post/WriteButton'

const PAGE_SIZE = 20

export default async function AllPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page } = await searchParams
  const pageNumber = Math.max(0, Number(page) || 0)

  const res = await postsApi.getAll(pageNumber, PAGE_SIZE).catch(() => null)
  const posts = res?.data?.posts?.content ?? []
  const totalPages = res?.data?.posts?.totalPages ?? 0
  // 상단 고정 공지는 백엔드가 0페이지에서만 내려준다. 다른 페이지에선 빈 배열.
  const pinnedNotices = pageNumber === 0 ? (res?.data?.pinnedNotices ?? []) : []

  return (
    <div>
      {/* 목록 우측 상단 글쓰기 버튼 */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">전체 글</h1>
        <WriteButton />
      </div>
      {/* 고정 공지는 PostList 내부에서 게시글 행 위에 어두운 배경으로 함께 렌더된다 */}
      <PostList posts={posts} pinnedNotices={pinnedNotices} showCategory />
      <Pagination currentPage={pageNumber} totalPages={totalPages} basePath="/posts" />
      {/* 목록 우측 하단 글쓰기 버튼 */}
      <div className="mt-4 flex justify-end">
        <WriteButton />
      </div>
    </div>
  )
}
