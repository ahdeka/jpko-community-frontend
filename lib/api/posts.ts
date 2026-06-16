import { apiClient } from './client'
import { PostListResponse, PostDetail, PostResponse, PostSummary, SearchType } from '@/types'

export const postsApi = {

  // 전체 게시글 목록
  getAll: (page = 0, size = 20) =>
    apiClient.get<PostListResponse>(
      `/api/posts?page=${page}&size=${size}`
    ),

  // 카테고리별 게시글 목록
  getByCategory: (categoryId: number, page = 0, size = 20) =>
    apiClient.get<PostListResponse>(
      `/api/posts/category/${categoryId}?page=${page}&size=${size}`
    ),

  // 게시글 검색
  search: (params: {
    keyword: string
    type?: SearchType
    categoryId?: number
    page?: number
    size?: number
  }) => {
    const query = new URLSearchParams({
      keyword: params.keyword,
      type: params.type ?? 'TITLE_CONTENT',
      page: String(params.page ?? 0),
      size: String(params.size ?? 20),
    })
    if (params.categoryId !== undefined) {
      query.set('categoryId', String(params.categoryId))
    }
    return apiClient.get<PostListResponse>(`/api/posts/search?${query.toString()}`)
  },

  // 인기글 (days: 1=실시간, 7=주간, 30=월간)
  getPopular: (days = 7, limit = 6) =>
    apiClient.get<PostSummary[]>(`/api/posts/popular?days=${days}&limit=${limit}`),

  // 게시글 상세
  getById: (postId: number, options?: RequestInit) =>
    apiClient.get<PostDetail>(`/api/posts/${postId}`, options),

  // 게시글 작성
  create: (body: {
    categoryId: number
    title: string
    content: string
    anonymous: boolean
  }) => apiClient.post<PostResponse>('/api/posts', body),

  // 게시글 삭제
  delete: (postId: number) =>
    apiClient.delete<void>(`/api/posts/${postId}`),
}