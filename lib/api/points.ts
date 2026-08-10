import { apiClient } from './client'
import type { MyRanking, PageResponse, PointBalance, PointTransaction, TopRanking, TransferRequestBody, TransferResult } from '@/types'

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
