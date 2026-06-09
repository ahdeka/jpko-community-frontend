import { apiClient } from './client'
import { PageResponse, PostSummary, PostDetail, PostResponse } from '@/types'

export const postsApi = {

  // 전체 게시글 목록
  getAll: (page = 0, size = 20) =>
    apiClient.get<PageResponse<PostSummary>>(
      `/api/posts?page=${page}&size=${size}`
    ),

  // 카테고리별 게시글 목록
  getByCategory: (categoryId: number, page = 0, size = 20) =>
    apiClient.get<PageResponse<PostSummary>>(
      `/api/posts/category/${categoryId}?page=${page}&size=${size}`
    ),

  // 게시글 상세
  getById: (postId: number) =>
    apiClient.get<PostDetail>(`/api/posts/${postId}`),

  // 게시글 작성
  create: (body: {
    categoryId: number
    title: string
    content: string
    anonymous: boolean
    tags: string[]
  }) => apiClient.post<PostResponse>('/api/posts', body),

  // 게시글 삭제
  delete: (postId: number) =>
    apiClient.delete<void>(`/api/posts/${postId}`),
}