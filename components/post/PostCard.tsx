import Link from 'next/link'
import { PostSummary } from '@/types'

interface Props {
  post: PostSummary
}

export default function PostCard({ post }: Props) {
  return (
    <li className="py-3 hover:bg-gray-50">
      <Link href={`/posts/${post.id}`} className="flex justify-between items-center">

        <div className="flex-1 min-w-0">
          {/* 카테고리 + 제목 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-600 shrink-0">
              [{post.categoryName}]
            </span>
            <span className="text-sm font-medium truncate">
              {post.title}
            </span>
            {/* 태그 */}
            {post.tags.length > 0 && (
              <div className="flex gap-1">
                {post.tags.map(tag => (
                  <span key={tag.id} className="text-xs bg-gray-100 px-1 rounded">
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 작성자 + 날짜 + 조회수 */}
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span>{post.author}</span>
            <span>{formatDate(post.createdAt)}</span>
            <span>조회 {post.viewCount}</span>
          </div>
        </div>

      </Link>
    </li>
  )
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
  })
}