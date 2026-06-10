import Link from 'next/link'
import { PostSummary } from '@/types'
import { formatRelativeTime } from '@/lib/format'

const CATEGORY_BADGE_STYLES: Record<string, string> = {
  '잡담': 'bg-purple-500/15 text-purple-400',
  '생활정보': 'bg-blue-500/15 text-blue-400',
  '취업·커리어': 'bg-orange-500/15 text-orange-400',
  '워홀': 'bg-green-500/15 text-green-400',
  '유학': 'bg-pink-500/15 text-pink-400',
  '취미·여행': 'bg-indigo-500/15 text-indigo-400',
  '공부': 'bg-teal-500/15 text-teal-400',
}
const DEFAULT_CATEGORY_BADGE_STYLE = 'bg-neutral-700/40 text-neutral-300'

interface Props {
  post: PostSummary
  showCategory?: boolean
}

export default function PostRow({ post, showCategory = false }: Props) {
  return (
    <li className="hover:bg-neutral-800/60">
      <Link href={`/posts/${post.id}`} className="flex items-center justify-between gap-3 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          {showCategory && (
            <span
              className={`shrink-0 text-xs px-1.5 py-0.5 rounded ${
                CATEGORY_BADGE_STYLES[post.categoryName] ?? DEFAULT_CATEGORY_BADGE_STYLE
              }`}
            >
              {post.categoryName}
            </span>
          )}
          <span className="text-sm truncate text-neutral-200">{post.title}</span>
          {post.commentCount > 0 && (
            <span className="shrink-0 text-xs text-orange-500 font-medium">
              [{post.commentCount}]
            </span>
          )}
        </div>

        <div className="shrink-0 flex items-center gap-2 text-xs text-neutral-500">
          <span>{post.author}</span>
          <span>{formatRelativeTime(post.createdAt)}</span>
        </div>
      </Link>
    </li>
  )
}
