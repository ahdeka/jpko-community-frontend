import { apiClient } from './client'
import { Comment, CommentPage } from '@/types'

// 댓글이 달릴 수 있는 대상 종류. 백엔드 CommentTargetType(POST/NOTICE)과 1:1 대응한다.
// 대상 종류에 따라 REST 경로가 /api/posts/... 와 /api/notices/... 로 갈린다.
export type CommentTargetType = 'POST' | 'NOTICE'

// 댓글 대상 = 종류 + 그 대상의 id (게시글 id 또는 공지 id).
export interface CommentTarget {
  type: CommentTargetType
  id: number
}

// 한 페이지에 보여줄 최상위 댓글 수. 백엔드 @PageableDefault(size = 20)와 일치시켜야
// "마지막 페이지 계산"(등록 후 이동)과 서버 페이지 경계가 어긋나지 않는다.
export const COMMENT_PAGE_SIZE = 20

// 대상 종류에 맞는 댓글 컬렉션 경로를 만든다.
// 목록 조회(GET)와 작성(POST)이 같은 경로를 공유하므로 분기는 여기 한 곳에만 둔다.
function commentsPath(target: CommentTarget): string {
  const segment = target.type === 'NOTICE' ? 'notices' : 'posts'
  return `/api/${segment}/${target.id}/comments`
}

export const commentsApi = {

  // 댓글 목록 (POST/NOTICE 공통). 백엔드는 최상위 댓글만 페이징하고 대댓글은 각 부모의
  // replies에 묶어서 내려준다. 응답은 { comments: Page, totalCommentCount } 형태이며,
  // totalCommentCount는 대댓글 포함·삭제 제외한 헤더용 개수다.
  // 정렬은 백엔드 쿼리에 고정(createdAt ASC)이므로 sort는 보내지 않는다.
  getByTarget: (target: CommentTarget, page = 0, options?: RequestInit) =>
    apiClient.get<CommentPage>(
      `${commentsPath(target)}?page=${page}&size=${COMMENT_PAGE_SIZE}`,
      options,
    ),

  // 댓글 작성 (POST/NOTICE 공통)
  create: (target: CommentTarget, body: {
    content: string
    anonymous: boolean
    parentId?: number   // 대댓글이면 부모 댓글 ID, 일반 댓글이면 생략
    // 첨부 이미지가 있을 때만 담는 temp S3 URL(=/api/images/upload 응답 url 원본).
    // 백엔드가 이 URL을 temp/ → comments/ 로 이동시켜 저장하며, temp 경로가 아니거나
    // 우리 버킷 소속이 아니면 INVALID_INPUT으로 거부한다. 첨부가 없으면 필드를 생략한다.
    imageUrl?: string
  }) => apiClient.post<Comment>(commentsPath(target), body),

  // 댓글 삭제 — 대상 종류와 무관하게 댓글 id 기준(백엔드 /api/comments/{id})
  delete: (commentId: number) =>
    apiClient.delete<void>(`/api/comments/${commentId}`),
}
