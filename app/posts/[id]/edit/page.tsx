import { notFound } from 'next/navigation'
import { postsApi } from '@/lib/api/posts'
import { categoriesApi } from '@/lib/api/categories'
import { authHeaders } from '@/lib/api/server'
import { ApiError } from '@/lib/api/client'
import PostForm from '@/components/post/PostForm'

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const postId = Number(id)
  const headers = await authHeaders()

  let post
  try {
    const res = await postsApi.getById(postId, { headers })
    post = res.data!
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound()
    throw e
  }

  // 본인 글이 아니면 수정 화면 자체를 막는다 (백엔드도 PUT에서 재검증)
  if (!post.isOwner) notFound()

  const catRes = await categoriesApi.getAll().catch(() => null)
  const categories = catRes?.data ?? []
  // 상세 응답엔 categoryName만 있어 이름으로 id를 역매핑 (카테고리명은 유일)
  const initialCategoryId = categories.find(c => c.name === post.categoryName)?.id

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">글 수정</h1>
      <PostForm
        categories={categories}
        mode="edit"
        postId={postId}
        initialCategoryId={initialCategoryId}
        initialTitle={post.title}
        initialContent={post.content}
      />
    </div>
  )
}
