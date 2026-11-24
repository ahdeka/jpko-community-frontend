import type { Comment } from '@/types'
import { type CommentTarget } from '@/lib/api/comments'
import CommentItem from './CommentItem'
import Pagination from '@/components/common/Pagination'

interface Props {
  // 댓글 대상(게시글 POST / 공지 NOTICE). 하위 아이템·폼까지 그대로 전달돼
  // 작성/조회 요청이 올바른 엔드포인트로 향하게 한다.
  target: CommentTarget
  // 현재 페이지의 최상위 댓글들. 각 항목이 자기 대댓글(replies)을 그대로 품고 있다.
  comments: Comment[]
  // 현재 댓글 페이지(0-based)와 전체 페이지 수 — Pagination이 그대로 사용한다.
  page: number
  totalPages: number
  // 헤더 "댓글 N개"에 표시할 총개수 — 대댓글 포함, 삭제 제외(백엔드 totalCommentCount).
  totalCount: number
  // 최상위 댓글 총수(삭제 포함, 페이징 기준 = comments.totalElements).
  // 새 최상위 댓글이 붙을 "마지막 페이지"를 계산하는 데 쓴다. 헤더 개수(totalCount)와 의미가 다르다.
  topLevelTotal: number
  // 페이지네이션 링크 기준 경로(/posts/{id} 또는 /notices/{id}).
  basePath: string
  // 페이지 이동 시 유지할 기존 쿼리(상세의 목록 컨텍스트 from/p/slug/... 등).
  preservedParams?: Record<string, string>
}

export default function CommentList({ target, comments, page, totalPages, totalCount, basePath, preservedParams }: Props) {
  return (
    // id="comments": 신고 목록 등에서 "댓글" 대상을 클릭했을 때, 그리고 페이지 이동(#comments)
    // 시 이 영역으로 스크롤시키기 위한 앵커. lib/report.ts의 reportTargetHref도 이 값을 사용한다.
    // scroll-mt: 상단 고정 헤더에 가리지 않도록 앵커 스크롤에 여백을 준다.
    <div id="comments" className="mt-10 scroll-mt-20">
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
            <CommentItem key={comment.id} comment={comment} target={target} />
          ))}
        </ul>
      )}
      {/* 게시글 목록과 동일한 페이지네이션 UI. 상세 URL과 섞이지 않도록 cpage 키를 쓰고,
          이동 후 댓글 영역으로 스크롤되도록 #comments 앵커를 붙인다. */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        basePath={basePath}
        searchParams={preservedParams}
        pageParam="cpage"
        hash="comments"
      />
      {/* 아카이브: 댓글 작성 폼은 두지 않는다(읽기 전용). */}
    </div>
  )
}
