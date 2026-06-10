import { apiClient } from './client'
import { Comment } from '@/types'

export const commentsApi = {

  // 댓글 목록
  getByPostId: (postId: number, options?: RequestInit) =>
    apiClient.get<Comment[]>(`/api/posts/${postId}/comments`, options),

  // 댓글 작성
  create: (postId: number, body: {
    content: string
    anonymous: boolean
    parentId?: number   // 대댓글이면 부모 댓글 ID, 일반 댓글이면 생략
  }) => apiClient.post<Comment>(`/api/posts/${postId}/comments`, body),

  // 댓글 삭제
  delete: (commentId: number) =>
    apiClient.delete<void>(`/api/comments/${commentId}`),
}