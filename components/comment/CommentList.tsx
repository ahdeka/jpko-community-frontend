import type { Comment } from '@/types'
import CommentItem from './CommentItem'
import CommentForm from './CommentForm'

interface Props {
  postId: number
  comments: Comment[]
}

// 부모 댓글 개수만이 아니라 대댓글까지 모두 합산한다.
// 백엔드 목록 집계(COUNT(c), 대댓글 포함)와 숫자를 일치시키기 위함이며,
// 삭제된 댓글도 백엔드 집계에 포함되므로 여기서도 deleted 여부와 무관하게 센다.
function countComments(comments: Comment[]): number {
  return comments.reduce((sum, c) => sum + 1 + countComments(c.replies), 0)
}

export default function CommentList({ postId, comments }: Props) {
  const totalCount = countComments(comments)

  return (
    // id="comments": 신고 목록 등에서 "댓글" 대상을 클릭했을 때 원문 글의 댓글 영역으로
    // 바로 스크롤시키기 위한 앵커. lib/report.ts의 reportTargetHref가 이 값을 사용한다.
    <div id="comments" className="mt-10">
      {/* 말풍선 아이콘 + 개수로 '여기서부터 댓글 영역'임을 한눈에 인지시킨다. */}
      <h2 className="mb-5 flex items-center gap-2 text-base font-bold">
        <svg className="h-5 w-5 text-gray-500 dark:text-neutral-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
        </svg>
        댓글 <span className="text-blue-600 dark:text-blue-400">{totalCount}</span>개
      </h2>
      {comments.length > 0 && (
        <ul className="mb-6 space-y-3">
          {comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} postId={postId} />
          ))}
        </ul>
      )}
      <CommentForm postId={postId} />
    </div>
  )
}
