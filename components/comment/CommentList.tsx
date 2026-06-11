import type { Comment } from '@/types'
import CommentItem from './CommentItem'
import CommentForm from './CommentForm'

interface Props {
  postId: number
  comments: Comment[]
}

export default function CommentList({ postId, comments }: Props) {
  return (
    <div className="mt-8">
      <h2 className="text-base font-semibold mb-4">댓글 {comments.length}개</h2>
      {comments.length > 0 && (
        <ul className="divide-y divide-gray-200 dark:divide-neutral-800 mb-4">
          {comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} postId={postId} />
          ))}
        </ul>
      )}
      <CommentForm postId={postId} />
    </div>
  )
}
