import { postsApi } from '@/lib/api/posts'
import PostList from './PostList'
import SectionCard from '@/components/common/SectionCard'
import type { Category, PostSummary } from '@/types'

const PREVIEW_POSTS_LIMIT = 5

interface Props {
  category: Category
}

export default async function CategorySection({ category }: Props) {
  let posts: PostSummary[] = []

  try {
    const res = await postsApi.getByCategory(category.id, 0, PREVIEW_POSTS_LIMIT)
    posts = res.data?.posts?.content ?? []
  } catch {}

  return (
    <SectionCard
      title={category.name}
      bulletColor="bg-green-500"
      href={`/posts/category/${category.slug}`}
      linkLabel="게시판 가기"
    >
      <PostList posts={posts} compact />
    </SectionCard>
  )
}
