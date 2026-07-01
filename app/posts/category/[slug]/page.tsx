import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { categoriesApi } from '@/lib/api/categories'
import { postsApi } from '@/lib/api/posts'
import PostList from '@/components/post/PostList'
import Pagination from '@/components/common/Pagination'
import WriteButton from '@/components/post/WriteButton'
import { encodeListContext } from '@/lib/list-context'
import { SITE_NAME } from '@/lib/site'

const PAGE_SIZE = 20

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const res = await categoriesApi.getAll().catch(() => null)
  const category = (res?.data ?? []).find(c => c.slug === slug)
  if (!category) return { title: '게시판' }
  return {
    title: category.name,
    description: `${SITE_NAME}의 ${category.name} 게시판입니다.`,
  }
}

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
  // 상단 고정 공지는 백엔드가 0페이지에서만 내려준다.
  const pinnedNotices = pageNumber === 0 ? (postsRes?.data?.pinnedNotices ?? []) : []

  return (
    <div>
      {/* 목록 우측 상단 글쓰기 버튼 */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{category.name}</h1>
        <WriteButton categorySlug={category.slug} />
      </div>
      {/* 고정 공지는 PostList 내부에서 게시글 행 위에 어두운 배경으로 함께 렌더된다 */}
      <PostList
        posts={posts}
        pinnedNotices={pinnedNotices}
        listContext={encodeListContext({ from: 'cat', slug: category.slug, page: pageNumber })}
      />
      {/* 글쓰기 버튼을 페이지번호 위에 둔다 (비로그인이면 WriteButton이 null) */}
      <div className="mt-4 flex justify-end">
        <WriteButton categorySlug={category.slug} />
      </div>
      <Pagination currentPage={pageNumber} totalPages={totalPages} basePath={`/posts/category/${category.slug}`} />
    </div>
  )
}
