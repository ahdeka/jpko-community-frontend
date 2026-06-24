import { notFound, redirect } from 'next/navigation'
import { categoriesApi } from '@/lib/api/categories'
import { postsApi } from '@/lib/api/posts'
import PostList from '@/components/post/PostList'
import Pagination from '@/components/common/Pagination'
import WriteButton from '@/components/post/WriteButton'

const PAGE_SIZE = 20

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { slug } = await params
  const { page } = await searchParams
  const pageNumber = Math.max(0, Number(page) || 0)

  const categoriesRes = await categoriesApi.getAll().catch(() => null)
  const categories = categoriesRes?.data ?? []

  // 숫자 ID로 접근한 경우 slug URL로 redirect
  if (/^\d+$/.test(slug)) {
    const category = categories.find(c => c.id === Number(slug))
    if (category) redirect(`/posts/category/${category.slug}`)
    notFound()
  }

  const category = categories.find(c => c.slug === slug)
  if (!category) notFound()

  const postsRes = await postsApi.getByCategory(category.id, pageNumber, PAGE_SIZE).catch(() => null)
  const posts = postsRes?.data?.posts?.content ?? []
  const totalPages = postsRes?.data?.posts?.totalPages ?? 0

  return (
    <div>
      {/* 목록 우측 상단 글쓰기 버튼 */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{category.name}</h1>
        <WriteButton />
      </div>
      <PostList posts={posts} />
      <Pagination currentPage={pageNumber} totalPages={totalPages} basePath={`/posts/category/${category.slug}`} />
      {/* 목록 우측 하단 글쓰기 버튼 */}
      <div className="mt-4 flex justify-end">
        <WriteButton />
      </div>
    </div>
  )
}
