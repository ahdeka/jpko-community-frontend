import { apiClient } from './client'
import { PageResponse, NoticeSummary, NoticeDetail } from '@/types'

// 공지 등록/수정 요청 바디 (백엔드 NoticeCreateRequest / NoticeUpdateRequest)
export interface NoticeWriteBody {
  title: string
  content: string
  pinned: boolean
  featured: boolean
}

export const noticesApi = {
  // 공지 목록 (공개) — 최신순 페이징
  getAll: (page = 0, size = 20) =>
    apiClient.get<PageResponse<NoticeSummary>>(
      `/api/notices?page=${page}&size=${size}&sort=createdAt,desc`
    ),

  // 메인 상단 중요 공지 (공개)
  getFeatured: () =>
    apiClient.get<NoticeSummary[]>('/api/notices/featured'),

  // 공지 상세 (공개). 서버 컴포넌트에서 호출 시 options로 쿠키 헤더 전달 가능
  getById: (noticeId: number, options?: RequestInit) =>
    apiClient.get<NoticeDetail>(`/api/notices/${noticeId}`, options),

  // 공지 등록 (ADMIN) — 응답 NoticeResponse { id }
  create: (body: NoticeWriteBody) =>
    apiClient.post<{ id: number }>('/api/notices', body),

  // 공지 수정 (ADMIN)
  update: (noticeId: number, body: NoticeWriteBody) =>
    apiClient.put<{ id: number }>(`/api/notices/${noticeId}`, body),

  // 공지 삭제 (ADMIN)
  delete: (noticeId: number) =>
    apiClient.delete<void>(`/api/notices/${noticeId}`),
}
