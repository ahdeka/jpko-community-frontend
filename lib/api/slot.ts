import { apiClient } from './client'
import type { SlotConfig, SlotPlayResult } from '@/types'

// 슬롯머신(3릴, 트리플 매치만 당첨) API. 조회·플레이 모두 로그인 필수이며, apiClient가
// credentials:'include'로 호출하므로 쿠키가 자동 전송된다.
export const slotApi = {
  // 베팅 단위/최소/최대·수수료율·심볼별 트리플 배당표. 각 심볼의 등장 확률은 백엔드가 의도적으로 내려주지 않는다.
  getConfig: () =>
    apiClient.get<SlotConfig>('/api/slot/config'),

  // 한 판 플레이. betAmount는 설정된 단위의 배수여야 한다(백엔드가 INVALID_BET_AMOUNT로 거절).
  play: (betAmount: number) =>
    apiClient.post<SlotPlayResult>('/api/slot/play', { betAmount }),
}
