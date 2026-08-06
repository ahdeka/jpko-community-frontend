import { apiClient } from './client'
import type { PachinkoConfig, PachinkoPlayResult } from '@/types'

// 파칭코(플린코형 구슬 낙하) API. 조회·플레이 모두 로그인 필수이며, apiClient가 credentials:'include'로
// 호출하므로 쿠키가 자동 전송된다.
export const pachinkoApi = {
  // 베팅 단위/최소/최대·수수료율·슬롯별 배당표. 못의 좌/우 확률은 백엔드가 의도적으로 내려주지 않는다.
  getConfig: () =>
    apiClient.get<PachinkoConfig>('/api/pachinko/config'),

  // 한 판 플레이. betAmount는 설정된 단위의 배수여야 한다(백엔드가 INVALID_BET_AMOUNT로 거절).
  play: (betAmount: number) =>
    apiClient.post<PachinkoPlayResult>('/api/pachinko/play', { betAmount }),
}
