'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Comment } from '@/types'
import CommentForm from './CommentForm'
import { commentsApi } from '@/lib/api/comments'
import { ApiError } from '@/lib/api/client'

interface Props {
  comment: Comment
  postId: number
  isReply?: boolean
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
  })
}

export default function CommentItem({ comment, postId, isReply = false }: Props) {
  const router = useRouter()
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('댓글을 삭제하시겠습니까?')) return

    setDeleting(true)
    try {
      await commentsApi.delete(comment.id)
      router.refresh()
    } catch (e) {
      if (e instanceof ApiError) alert(e.message)
      setDeleting(false)
    }
  }

  return (
    <li className={isReply ? 'pl-6 border-l-2 border-gray-200 dark:border-neutral-800' : ''}>
      <div className="py-3">
        {comment.deleted ? (
          <p className="text-sm text-gray-400 dark:text-neutral-500 italic">삭제된 댓글입니다.</p>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium">{comment.author}</span>
              <span className="text-xs text-gray-400 dark:text-neutral-500">{formatDate(comment.createdAt)}</span>
            </div>
            <p className="text-sm text-gray-800 dark:text-neutral-200 whitespace-pre-wrap">{comment.content}</p>
            {(!isReply || comment.isOwner) && (
              <div className="flex items-center gap-2 mt-1.5">
                {!isReply && (
                  <button
                    onClick={() => setShowReplyForm(prev => !prev)}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300"
                  >
                    {showReplyForm ? '취소' : '답글'}
                  </button>
                )}
                {comment.isOwner && (
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-xs text-gray-400 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400 disabled:opacity-50"
                  >
                    {deleting ? '삭제 중...' : '삭제'}
                  </button>
                )}
              </div>
            )}
          </>
        )}
        {showReplyForm && (
          <CommentForm
            postId={postId}
            parentId={comment.id}
            onCancel={() => setShowReplyForm(false)}
          />
        )}
      </div>

      {comment.replies.length > 0 && (
        <ul>
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} postId={postId} isReply />
          ))}
        </ul>
      )}
    </li>
  )
}
