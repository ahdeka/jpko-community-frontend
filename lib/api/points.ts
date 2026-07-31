import { apiClient } from './client'
import type { PageResponse, PointBalance, PointTransaction } from '@/types'

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
}
