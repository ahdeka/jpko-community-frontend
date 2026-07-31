import { apiClient } from './client'
import type { RouletteConfig, RouletteOpponent, RouletteSpinResult } from '@/types'

// 룰렛(베팅형 대결) API. 조회·플레이 모두 로그인 필수이며, apiClient가 credentials:'include'로
// 호출하므로 쿠키가 자동 전송된다.
export const rouletteApi = {
  // 베팅 단위/최소/최대·수수료율. 승률은 백엔드가 의도적으로 내려주지 않는다.
  getConfig: () =>
    apiClient.get<RouletteConfig>('/api/roulette/config'),

  // 현재 고정된 상대. 고정된 상대가 없으면 data가 undefined로 온다.
  getOpponent: () =>
    apiClient.get<RouletteOpponent>('/api/roulette/opponent'),

  // 한 판 스핀. betAmount는 설정된 단위의 배수여야 한다(백엔드가 INVALID_BET_AMOUNT로 거절).
  spin: (betAmount: number) =>
    apiClient.post<RouletteSpinResult>('/api/roulette/spin', { betAmount }),

  // 다음 스핀부터 이 상대로 고정한다.
  lockOpponent: (opponentId: number) =>
    apiClient.put<void>(`/api/roulette/opponent/${opponentId}`),

  // 고정을 해제한다(다음 스핀부터 다시 랜덤 상대).
  unlockOpponent: () =>
    apiClient.delete<void>('/api/roulette/opponent'),
}
