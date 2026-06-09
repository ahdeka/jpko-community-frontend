import { PostSummary } from '@/types'
import PostCard from './PostCard'

interface Props {
  posts: PostSummary[]
}

export default function PostList({ posts }: Props) {
  if (posts.length === 0) {
    return <p className="text-gray-500 text-center py-10">게시글이 없습니다.</p>
  }

  return (
    <ul className="divide-y divide-gray-200">
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </ul>
  )
}