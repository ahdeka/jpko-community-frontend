import { apiClient } from './client'
import { LikeStatus } from '@/types'

export const likesApi = {
  getStatus: (postId: number) =>
    apiClient.get<LikeStatus>(`/api/posts/${postId}/likes`),

  toggle: (postId: number, type: 'LIKE' | 'DISLIKE') =>
    apiClient.post<LikeStatus>(`/api/posts/${postId}/likes`, { type }),
}
