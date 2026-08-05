import { apiClient } from './client'
import type { Notification, PageResponse } from '@/types'

// 알림 목록이 "다른 컴포넌트의 조작으로" 바뀌었음을 브라우저 전역에 알리는 이벤트 이름.
// 헤더 벨(NotificationBell)과 전체보기 페이지(app/notifications)는 각자 별개의 state를 들고
// 동시에 화면에 떠 있는데, 백엔드 SSE는 "새 알림 생성"에만 push를 보내고 읽음/삭제에는 보내지 않는다.
// 그래서 전체보기 페이지에서 읽음·삭제하면 벨의 안 읽은 개수가 낡은 채로 남는다.
// client.ts의 세션 이벤트와 같은 방식으로, 조작한 쪽이 이 이벤트를 쏘고 벨이 구독해 재조회하게 한다.
export const NOTIFICATIONS_CHANGED_EVENT = 'notifications:changed'

// 위 이벤트를 발행한다(브라우저에서만). 목록을 바꾸는 조작에 성공한 뒤 호출한다.
export function emitNotificationsChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT))
  }
}

export const notificationsApi = {
  // 읽지 않은 알림 목록. 벨 배지 개수와 드롭다운 내용의 "단일 소스".
  // SSE는 변화 신호만 주고, 실제 표시 데이터는 항상 이 REST 응답을 정답으로 삼는다.
  getUnread: () =>
    apiClient.get<Notification[]>('/api/notifications'),

  // 전체 알림 내역(읽음 + 안 읽음)을 페이지 단위로 조회한다. 알림 전체보기 페이지 전용.
  // 백엔드는 createdAt DESC로 정렬해 Spring Page 구조(content/totalPages/…)로 내려준다.
  // getUnread(벨)와 목적이 다르다 — 이쪽은 읽은 알림도 남겨 "내역"을 보여주는 용도다.
  getAll: (page = 0, size = 20) =>
    apiClient.get<PageResponse<Notification>>(`/api/notifications/all?page=${page}&size=${size}`),

  // 알림 1건 읽음 처리(body 없음). 백엔드가 소유자(receiver)를 검증하므로
  // 남의 알림 id로는 403이 떨어진다 — 프론트는 항상 자기 알림 id만 보낸다.
  markAsRead: (id: number) =>
    apiClient.patch<void>(`/api/notifications/${id}/read`),

  // 내 안 읽은 알림을 한 번에 읽음 처리(벌크 UPDATE). 건별 PATCH를 N번 보내던 것을 대체한다.
  // 백엔드가 receiver.id로 범위를 스스로 좁히므로 대상 id 목록을 보낼 필요가 없다.
  markAllAsRead: () =>
    apiClient.patch<void>('/api/notifications/read-all'),

  // 알림 1건 삭제. markAsRead와 동일하게 백엔드가 소유자를 검증한다(남의 알림 id → 403).
  remove: (id: number) =>
    apiClient.delete<void>(`/api/notifications/${id}`),

  // 내 알림 전체 삭제(되돌릴 수 없음). 호출부에서 반드시 확인을 받고 부른다.
  removeAll: () =>
    apiClient.delete<void>('/api/notifications/all'),

  // SSE 구독 URL. EventSource가 직접 연결하며 인증은 HttpOnly accessToken 쿠키로 이뤄진다.
  // (apiClient가 아니라 브라우저 EventSource가 요청하므로 절대 URL이 필요하다)
  subscribeUrl: () => `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/subscribe`,
}
