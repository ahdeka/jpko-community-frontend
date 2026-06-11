import type { PostDetail as PostDetailData } from '@/types'
import LikeButtons from './LikeButtons'
import DeletePostButton from './DeletePostButton'

interface Props {
  post: PostDetailData
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export default function PostDetail({ post }: Props) {
  return (
    <div>
      <div className="border-b border-gray-200 dark:border-neutral-800 pb-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-blue-600 dark:text-blue-400">[{post.categoryName}]</span>
        </div>
        <h1 className="text-xl font-bold mb-3">{post.title}</h1>
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-neutral-400">
          <div className="flex items-center gap-3">
            <span>{post.author}</span>
            <span>{formatDate(post.createdAt)}</span>
            <span>조회 {post.viewCount}</span>
          </div>
          {post.isOwner && <DeletePostButton postId={post.id} />}
        </div>
      </div>

      <div className="min-h-40 py-6 text-sm leading-relaxed whitespace-pre-wrap">
        {post.content}
      </div>

      <LikeButtons
        postId={post.id}
        initialLikeCount={post.likeCount}
        initialDislikeCount={post.dislikeCount}
      />
    </div>
  )
}
