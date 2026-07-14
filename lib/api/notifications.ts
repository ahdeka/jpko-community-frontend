import { apiClient } from './client'
import type { Notification } from '@/types'

export const notificationsApi = {
  // 읽지 않은 알림 목록. 벨 배지 개수와 드롭다운 내용의 "단일 소스".
  // SSE는 변화 신호만 주고, 실제 표시 데이터는 항상 이 REST 응답을 정답으로 삼는다.
  getUnread: () =>
    apiClient.get<Notification[]>('/api/notifications'),

  // 알림 1건 읽음 처리(body 없음). 백엔드가 소유자(receiver)를 검증하므로
  // 남의 알림 id로는 403이 떨어진다 — 프론트는 항상 자기 알림 id만 보낸다.
  markAsRead: (id: number) =>
    apiClient.patch<void>(`/api/notifications/${id}/read`),

  // SSE 구독 URL. EventSource가 직접 연결하며 인증은 HttpOnly accessToken 쿠키로 이뤄진다.
  // (apiClient가 아니라 브라우저 EventSource가 요청하므로 절대 URL이 필요하다)
  subscribeUrl: () => `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/subscribe`,
}
