import { postsApi } from '@/lib/api/posts'
import PostList from '@/components/post/PostList'
import Pagination from '@/components/common/Pagination'

const PAGE_SIZE = 20

export default async function AllPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page } = await searchParams
  const pageNumber = Math.max(0, Number(page) || 0)

  const res = await postsApi.getAll(pageNumber, PAGE_SIZE).catch(() => null)
  const posts = res?.data?.content ?? []
  const totalPages = res?.data?.totalPages ?? 0

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">전체 글</h1>
      <PostList posts={posts} showCategory />
      <Pagination currentPage={pageNumber} totalPages={totalPages} basePath="/posts" />
    </div>
  )
}
