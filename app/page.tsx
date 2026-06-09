import { postsApi } from '@/lib/api/posts'
import PostList from '@/components/post/PostList'
import type { PostSummary } from '@/types'

export default async function Home() {
  let posts: PostSummary[] = []
  let failed = false

  try {
    const response = await postsApi.getAll()
    posts = response.data?.content ?? []
  } catch {
    failed = true
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">전체 글</h1>
      {failed
        ? <p className="text-gray-500 text-center py-10">게시글을 불러오지 못했습니다.</p>
        : <PostList posts={posts} />
      }
    </div>
  )
}