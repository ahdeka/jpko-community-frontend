import { notFound } from 'next/navigation'
import { postsApi } from '@/lib/api/posts'
import { commentsApi } from '@/lib/api/comments'
import { ApiError } from '@/lib/api/client'
import PostDetail from '@/components/post/PostDetail'
import CommentList from '@/components/comment/CommentList'

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const postId = Number(id)

  const [postRes, commentsRes] = await Promise.allSettled([
    postsApi.getById(postId),
    commentsApi.getByPostId(postId),
  ])

  if (postRes.status === 'rejected') {
    const err = postRes.reason
    if (err instanceof ApiError && err.status === 404) notFound()
    throw err
  }

  const post = postRes.value.data!
  const comments =
    commentsRes.status === 'fulfilled' ? (commentsRes.value.data ?? []) : []

  return (
    <div>
      <PostDetail post={post} />
      <CommentList postId={postId} comments={comments} />
    </div>
  )
}
