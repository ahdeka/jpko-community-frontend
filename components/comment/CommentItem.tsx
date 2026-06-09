import type { Comment } from '@/types'

interface Props {
  comment: Comment
  isReply?: boolean
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
  })
}

export default function CommentItem({ comment, isReply = false }: Props) {
  return (
    <li className={isReply ? 'pl-6 border-l-2 border-gray-100' : ''}>
      <div className="py-3">
        {comment.deleted ? (
          <p className="text-sm text-gray-400 italic">삭제된 댓글입니다.</p>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium">{comment.author}</span>
              <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
            </div>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{comment.content}</p>
          </>
        )}
      </div>

      {comment.replies.length > 0 && (
        <ul>
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} isReply />
          ))}
        </ul>
      )}
    </li>
  )
}
