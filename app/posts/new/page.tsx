import { categoriesApi } from '@/lib/api/categories'
import PostForm from '@/components/post/PostForm'

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category: categorySlug } = await searchParams
  const res = await categoriesApi.getAll().catch(() => null)
  const categories = res?.data ?? []

  // 카테고리 게시판에서 진입하면 ?category=<slug> 로 기본 카테고리 힌트가 들어온다.
  // 쿼리값은 신뢰하지 않고 실제 카테고리 목록과 대조해 존재할 때만 기본 선택으로 쓴다.
  // (없는/조작된 값이면 initialCategoryId는 undefined가 되어 "카테고리 선택" 상태로 시작)
  // slug → 숫자 id 변환: 폼의 select는 id 기반이고 앱 URL은 slug 기반이라 여기서 매핑한다.
  const initialCategoryId = categorySlug
    ? categories.find(c => c.slug === categorySlug)?.id
    : undefined

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">글쓰기</h1>
      <PostForm categories={categories} initialCategoryId={initialCategoryId} />
    </div>
  )
}
