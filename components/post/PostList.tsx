import { PostSummary } from '@/types'
import PostRow from './PostRow'

interface Props {
  posts: PostSummary[]
  showCategory?: boolean
}

export default function PostList({ posts, showCategory = false }: Props) {
  if (posts.length === 0) {
    return <p className="text-neutral-500 text-center py-10">게시글이 없습니다.</p>
  }

  return (
    <ul className="divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
      {posts.map(post => (
        <PostRow key={post.id} post={post} showCategory={showCategory} />
      ))}
    </ul>
  )
}
