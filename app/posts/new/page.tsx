import { categoriesApi } from '@/lib/api/categories'
import PostForm from '@/components/post/PostForm'

export default async function NewPostPage() {
  const res = await categoriesApi.getAll().catch(() => null)
  const categories = res?.data ?? []

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">글쓰기</h1>
      <PostForm categories={categories} />
    </div>
  )
}
