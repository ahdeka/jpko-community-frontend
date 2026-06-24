import Link from 'next/link'
import type { PostSummary } from '@/types'
import ImageBadge from '@/components/common/ImageBadge'

interface Props {
  posts: PostSummary[]
}

export default function RankedPostList({ posts }: Props) {
  if (posts.length === 0) {
    return <p className="text-neutral-500 text-center py-6 text-sm">게시글이 없습니다.</p>
  }

  return (
    <ol className="flex flex-col">
      {posts.map((post, index) => (
        <li key={post.id} className="rounded hover:bg-neutral-100 dark:hover:bg-neutral-800/60">
          <Link href={`/posts/${post.id}`} className="flex items-center gap-2 px-1 py-1.5 min-w-0">
            <span className="w-4 shrink-0 text-center text-sm font-bold text-orange-500">{index + 1}</span>
            {post.hasImage && <ImageBadge />}
            <span className="truncate text-sm text-neutral-700 dark:text-neutral-200">{post.title}</span>
            {post.commentCount > 0 && (
              <span className="shrink-0 text-xs font-medium text-orange-500">[{post.commentCount}]</span>
            )}
          </Link>
        </li>
      ))}
    </ol>
  )
}
