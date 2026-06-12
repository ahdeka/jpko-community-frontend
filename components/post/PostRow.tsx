import Link from 'next/link'
import { PostSummary } from '@/types'
import { formatRelativeTime } from '@/lib/format'

const CATEGORY_BADGE_STYLE = 'bg-neutral-200 text-neutral-600 dark:bg-neutral-700/40 dark:text-neutral-300'

interface Props {
  post: PostSummary
  showCategory?: boolean
}

// 이미지 포함 게시글 아이콘
function ImageIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  )
}

// 텍스트만 있는 게시글 아이콘
function TextIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  )
}

// 좋아요 아이콘
function LikeIcon() {
  return (
    <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 10v12" />
      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
    </svg>
  )
}

export default function PostRow({ post, showCategory = false }: Props) {
  return (
    <li className="hover:bg-neutral-100 dark:hover:bg-neutral-800/60">
      <Link href={`/posts/${post.id}`} className="flex items-center justify-between gap-3 py-2.5">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            {post.hasImage ? <ImageIcon /> : <TextIcon />}
            {showCategory && (
              <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded ${CATEGORY_BADGE_STYLE}`}>
                {post.categoryName}
              </span>
            )}
            <span className="text-sm truncate text-neutral-800 dark:text-neutral-200">{post.title}</span>
            {post.commentCount > 0 && (
              <span className="shrink-0 text-xs text-orange-500 font-medium">
                [{post.commentCount}]
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span className="flex items-center gap-0.5">
              <LikeIcon />
              {post.likeCount}
            </span>
            <span>{formatRelativeTime(post.createdAt)}</span>
          </div>
        </div>

        <span className="shrink-0 text-xs text-neutral-500">{post.author}</span>
      </Link>
    </li>
  )
}
