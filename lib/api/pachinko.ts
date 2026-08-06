import { apiClient } from './client'
import type { PachinkoConfig, PachinkoPlayResult } from '@/types'

// 파칭코(플린코형 구슬 낙하) API. 조회·플레이 모두 로그인 필수이며, apiClient가 credentials:'include'로
// 호출하므로 쿠키가 자동 전송된다.
export const pachinkoApi = {
  // 구슬 가격/개수 범위·수수료율·슬롯별 배당표. 못의 좌/우 확률은 백엔드가 의도적으로 내려주지 않는다.
  getConfig: () =>
    apiClient.get<PachinkoConfig>('/api/pachinko/config'),

  // 한 판 플레이. ballCount는 설정된 범위 안이어야 한다(백엔드가 INVALID_BALL_COUNT로 거절).
  play: (ballCount: number) =>
    apiClient.post<PachinkoPlayResult>('/api/pachinko/play', { ballCount }),
}
