import { apiClient } from './client'
import type { CheckInCalendar, CheckInOutcome } from '@/types'

// 출석 API. 조회·출석 모두 로그인 필수이며(백엔드 SecurityConfig의 anyRequest().authenticated()),
// apiClient가 credentials:'include'로 호출하므로 쿠키가 자동 전송된다.
export const checkInsApi = {
  // 월별 출석 달력. year/month를 생략하면 서버가 KST 기준 이번 달을 돌려준다.
  //
  // ⚠️ 반드시 '둘 다' 주거나 '둘 다' 생략해야 한다. 백엔드는 (year != null && month != null)일 때만
  //    그 달을 쓰고, 하나만 오면 조용히 이번 달로 폴백해버린다 — 에러가 아니라 엉뚱한 달이 온다.
  //    또 year에는 @Min/@Max 검증이 없어서 말도 안 되는 값을 보내면 YearMonth.of가 던지는
  //    DateTimeException이 500으로 떨어진다. 호출부(CheckInModal)가 오늘 기준으로 이동 범위를
  //    제한하므로 실사용 경로에서는 도달하지 않는다.
  getCalendar: (year?: number, month?: number) => {
    const scoped = year !== undefined && month !== undefined
    const query = scoped ? `?year=${year}&month=${month}` : ''
    return apiClient.get<CheckInCalendar>(`/api/check-ins${query}`)
  },

  // 오늘 출석. 바디가 없으며, 성공은 201이다.
  // 실패 코드: ALREADY_CHECKED_IN(409, 오늘 이미 함) / SUSPENDED_ACCOUNT(403, 정지 계정 —
  // client.ts가 전역 이벤트로 SuspendedScreen 전환까지 처리한다).
  checkIn: () => apiClient.post<CheckInOutcome>('/api/check-ins'),
}
