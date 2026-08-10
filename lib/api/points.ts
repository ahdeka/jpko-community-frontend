import { apiClient } from './client'
import type { MyRanking, PageResponse, PointBalance, PointTransaction, TopRanking, TransferRequestBody, TransferResult } from '@/types'

// 포인트 잔액이 방금 바뀌었음을 브라우저 전역에 알리는 이벤트 이름.
// 헤더(UserMenu)처럼 잔액을 상시 표시하는 컴포넌트가 이 이벤트를 구독해, 새로고침 없이
// 즉시 최신 잔액으로 동기화한다. (client.ts의 auth:* 이벤트들과 동일한 window 이벤트 패턴)
export const POINT_BALANCE_CHANGED_EVENT = 'points:balance-changed'

export interface PointBalanceChangedDetail {
  // 변동 후 확정 잔액. 서버 응답에 balanceAfter가 있는 경우(게임)만 채운다 → 구독자가
  // 추가 조회 없이 그 값을 즉시 반영한다. 알 수 없으면(송금 등) 생략하고, 구독자가
  // getBalance()로 다시 조회한다.
  balance?: number
}

// 포인트 변동을 전역에 알린다. 브라우저에서만 동작한다(SSR에서는 no-op).
// balance를 넘기면 구독자가 그대로 반영하고, 생략하면 구독자가 서버에서 재조회한다.
export function notifyPointBalanceChanged(balance?: number) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<PointBalanceChangedDetail>(POINT_BALANCE_CHANGED_EVENT, {
      detail: { balance },
    }),
  )
}

// 포인트 관련 API. 조회는 로그인 필수이며, apiClient가 credentials:'include'로
// 호출하므로 쿠키가 자동 전송된다.
export const pointsApi = {
  // 내 포인트 잔액.
  getBalance: () =>
    apiClient.get<PointBalance>('/api/points'),

  // 내 포인트 거래 내역 (최신순 페이징).
  // 백엔드가 @PageableDefault(sort="createdAt", direction=DESC)로 정렬을 고정하므로
  // sort는 보내지 않는다 (reportsApi.getMyReports와 동일한 이유).
  getMyTransactions: (page = 0, size = 20) =>
    apiClient.get<PageResponse<PointTransaction>>(`/api/transactions?page=${page}&size=${size}`),

  // 다른 회원에게 포인트 송금.
  // ⚠️ 이 엔드포인트는 항상 HTTP 200으로 응답한다 — 호출부는 res.data.status로
  // 성공('ACCEPTED')/실패('NOT_ACCEPTABLE')를 판단해야 한다(HTTP status 기반 판단 불가).
  transfer: (body: TransferRequestBody) =>
    apiClient.post<TransferResult>('/api/points/transfer', body),
}

// 포인트 랭킹 API.
export const rankingApi = {
  // 상위 랭킹(top-size명). 비로그인 포함 누구나 조회 가능(백엔드 SecurityConfig permitAll).
  // 메인 페이지 서버 컴포넌트에서 호출한다(인증 헤더 불필요).
  getTop: (options?: RequestInit) =>
    apiClient.get<TopRanking>('/api/points/ranking/top', options),

  // 내 순위 + 주변(위/아래 k명) + 상위 top-size명. 인증 필수.
  // 브라우저에서 호출하면 apiClient가 credentials:'include'로 쿠키를 자동 전송한다.
  getMine: () =>
    apiClient.get<MyRanking>('/api/points/ranking/me'),
}
