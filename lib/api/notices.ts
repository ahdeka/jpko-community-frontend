import { apiClient } from './client'
import { PageResponse, NoticeSummary } from '@/types'

export const noticesApi = {
  getAll: (page = 0, size = 20) =>
    apiClient.get<PageResponse<NoticeSummary>>(`/api/notices?page=${page}&size=${size}&sort=createdAt,desc`),
}
