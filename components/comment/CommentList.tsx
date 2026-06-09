import type { Comment } from '@/types'
import CommentItem from './CommentItem'

interface Props {
  comments: Comment[]
}

export default function CommentList({ comments }: Props) {
  return (
    <div className="mt-8">
      <h2 className="text-base font-semibold mb-4">댓글 {comments.length}개</h2>
      {comments.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">첫 댓글을 작성해보세요.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </ul>
      )}
    </div>
  )
}
