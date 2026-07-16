'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Comment } from '@/types'
import CommentForm from './CommentForm'
import ReportModal from '@/components/common/ReportModal'
import { commentsApi } from '@/lib/api/comments'
import { ApiError } from '@/lib/api/client'
import { useAuth } from '@/lib/auth-context'
import AuthorName from '@/components/common/AuthorName'

interface Props {
  comment: Comment
  postId: number
  isReply?: boolean
  // 답글일 때 저장 대상이 되는 최상위(루트) 댓글 id.
  // 백엔드가 2뎁스(부모-자식)만 지원하므로, 답글의 답글도 parentId는 항상 루트 댓글이어야 한다.
  rootId?: number
}

// 답글 본문 맨 앞에 '@닉네임 '으로 심어둔 멘션을 파란 글씨로 분리해 렌더한다.
// 멘션은 별도 컬럼이 아니라 content 텍스트에 그대로 들어 있으므로 정규식으로 첫 토큰만 떼어낸다.
// 닉네임에 공백이 없다는 전제(\S+)이며, 일반 댓글의 오탐을 막기 위해 답글(isReply)에서만 적용한다.
function renderCommentBody(content: string, isReply: boolean) {
  if (isReply) {
    const m = content.match(/^(@\S+)\s([\s\S]*)$/)
    if (m) {
      return (
        <>
          <span className="mr-1 font-medium text-blue-500 dark:text-blue-400">{m[1]}</span>
          {m[2]}
        </>
      )
    }
  }
  return content
}

// 이미지의 "58분 전" 같은 상대 시간 표기. 1주일이 넘어가면 날짜로 떨어뜨린다.
function formatRelativeTime(dateString: string): string {
  const ms = new Date(dateString).getTime()
  const diff = Date.now() - ms
  // 잘못된 값이거나 서버·클라이언트 시계 오차로 미래 시각이 들어오면 '방금 전'으로 막는다.
  if (Number.isNaN(ms) || diff < 0) return '방금 전'
  const min = Math.floor(diff / 60000)
  if (min < 1) return '방금 전'
  if (min < 60) return `${min}분 전`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour}시간 전`
  const day = Math.floor(hour / 24)
  if (day < 7) return `${day}일 전`
  return new Date(dateString).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })
}

export default function CommentItem({ comment, postId, isReply = false, rootId }: Props) {
  // 답글 저장 시 부모 id: 최상위 댓글이면 자기 자신, 답글이면 루트 댓글 id.
  const replyParentId = isReply ? rootId : comment.id
  const router = useRouter()
  const { user } = useAuth()
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

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
    // 답글은 왼쪽으로 들여써서 부모와의 관계를 시각적으로 드러낸다.
    <li className={isReply ? 'ml-6 sm:ml-10' : ''}>
      {comment.deleted ? (
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/50">
          <p className="text-sm italic text-gray-400 dark:text-neutral-500">삭제된 댓글입니다.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-100 dark:border-neutral-800">
          {/* 작성자 헤더 바: 회색 배경으로 '누가 썼는지'를 한눈에 구분시킨다. */}
          <div className="flex items-center justify-between bg-gray-100 px-3 py-2 dark:bg-neutral-800/60">
            <AuthorName
              author={comment.author}
              isAdmin={comment.adminAuthor}
              className="text-sm font-semibold text-gray-800 dark:text-neutral-100"
            />
            <span className="text-xs text-gray-400 dark:text-neutral-500">{formatRelativeTime(comment.createdAt)}</span>
          </div>
          {/* 본문 영역 */}
          <div className="bg-white px-3 py-2.5 dark:bg-neutral-900">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 dark:text-neutral-200">
              {renderCommentBody(comment.content, isReply)}
            </p>
            {/*
              비로그인 사용자에게는 액션 영역 전체를 숨긴다. 답글을 달려면 어차피
              로그인이 필요하므로, 버튼만 보여주고 눌렀을 때 빈 폼이 토글되는 혼란을 막는다.
              답글 버튼은 로그인 상태라면 모든 댓글(부모·답글)에 노출한다.
            */}
            {user && (
              <div className="mt-1.5 flex items-center gap-2">
                <button
                  onClick={() => setShowReplyForm(prev => !prev)}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300"
                >
                  {showReplyForm ? '취소' : '답글'}
                </button>
                {comment.isOwner && (
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-xs text-gray-400 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400 disabled:opacity-50"
                  >
                    {deleting ? '삭제 중...' : '삭제'}
                  </button>
                )}
                {/*
                  신고는 남의 댓글에만 노출한다(본인 댓글은 백엔드가 SELF_REPORT_NOT_ALLOWED로 거부).
                  삭제된 댓글은 이 액션 영역 자체가 렌더되지 않는 분기에 있어 따로 막지 않아도 된다.
                  익명 댓글도 신고 대상이다 — 백엔드는 targetId(댓글 id)로만 판단하므로 익명 여부와 무관하다.
                  액션 영역이 로그인 사용자 전용이라(위 user 가드) 비로그인 처리는 필요 없다.
                */}
                {!comment.isOwner && (
                  <button
                    onClick={() => setReportOpen(true)}
                    className="text-xs text-gray-400 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400"
                  >
                    신고
                  </button>
                )}
              </div>
            )}
            {showReplyForm && (
              <CommentForm
                postId={postId}
                parentId={replyParentId}
                mention={comment.author}
                onCancel={() => setShowReplyForm(false)}
              />
            )}
          </div>
        </div>
      )}

      {comment.replies.length > 0 && (
        <ul className="mt-3 space-y-3">
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} postId={postId} isReply rootId={comment.id} />
          ))}
        </ul>
      )}

      {/*
        신고 모달. CommentItem은 답글을 재귀 렌더하므로 각 댓글이 자기 상태(reportOpen)로
        자기 모달만 연다 — 답글의 신고 버튼이 부모 댓글을 신고하는 일은 생기지 않는다.
        모달 자체는 fixed 오버레이라 li 안에 있어도 위치에 영향받지 않고,
        닫혀 있으면 null을 반환하므로 댓글 수만큼 DOM이 늘어나지도 않는다.
      */}
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="COMMENT"
        targetId={comment.id}
      />
    </li>
  )
}
