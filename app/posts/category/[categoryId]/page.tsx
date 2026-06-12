import { notFound } from 'next/navigation'
import { categoriesApi } from '@/lib/api/categories'
import { postsApi } from '@/lib/api/posts'
import PostList from '@/components/post/PostList'
import Pagination from '@/components/common/Pagination'

const PAGE_SIZE = 20

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ categoryId: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { categoryId } = await params
  const { page } = await searchParams
  const id = Number(categoryId)
  const pageNumber = Math.max(0, Number(page) || 0)

  const categoriesRes = await categoriesApi.getAll().catch(() => null)
  const category = categoriesRes?.data?.find(c => c.id === id)
  if (!category) notFound()

  const postsRes = await postsApi.getByCategory(id, pageNumber, PAGE_SIZE).catch(() => null)
  const posts = postsRes?.data?.posts?.content ?? []
  const totalPages = postsRes?.data?.posts?.totalPages ?? 0

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">{category.name}</h1>
      <PostList posts={posts} />
      <Pagination currentPage={pageNumber} totalPages={totalPages} basePath={`/posts/category/${id}`} />
    </div>
  )
}
