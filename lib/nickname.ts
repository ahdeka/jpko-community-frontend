// 닉네임 정책 — 백엔드 global/util/NicknamePolicy.java의 프론트 미러링.
//
// ⚠️ 백엔드가 최종 판정자다. 여기 있는 건 "서버에 갔다 오기 전에 미리 걸러주는" UX용 복제본이며,
//    목록이 어긋나면 프론트에서 통과한 닉네임이 서버에서 400(BLACKLIST_NICKNAME)으로 튕긴다.
//    그 경우에도 화면은 서버 메시지를 그대로 보여주므로 기능은 깨지지 않지만,
//    NicknamePolicy.java를 고칠 때는 이 파일도 같이 고쳐야 한다.
//
// 판정 규칙(백엔드와 동일):
//  - 소문자로 정규화한 뒤 비교한다(한글은 대소문자 개념이 없어 영향 없음).
//  - EXACT: 닉네임 "전체"가 정확히 일치할 때만 차단. "관리자"는 막지만 "관리자김씨"는 통과한다.
//  - CONTAINS: 닉네임 "어딘가에" 들어 있으면 차단.

import { parseServerDate } from '@/lib/format'

// 전체 일치일 때만 차단하는 목록
const EXACT_BLACKLIST = new Set([
  // 운영진 사칭
  '관리자', '운영자', '운영팀', '매니저', '고객센터',
  'admin', 'administrator', 'root', 'system',

  // 사이트 관련 예약어
  '탈퇴회원', '탈퇴한회원',
  'jpko', 'jpkocommunity',

  // 비속어
  '보지', '자지',
])

// 부분 일치만으로 차단하는 목록
const CONTAINS_BLACKLIST = ['씨발', '병신', '섹스', 'sex', 'fuck']

// 백엔드 @Pattern 미러링: 한글(완성형)·영문·숫자만 허용(공백·특수문자 불가).
// 백엔드 DTO가 compact constructor에서 trim()한 값으로 검사하므로, 프론트도 trim 후 검사한다.
export const NICKNAME_RE = /^[가-힣a-zA-Z0-9]+$/

// 백엔드 @Size(min=2, max=20)과 동일
export const NICKNAME_MIN = 2
export const NICKNAME_MAX = 20

// 백엔드 User.NICKNAME_CHANGE_COOLDOWN_DAYS와 동일. 안내 문구에만 쓰는 값이고,
// 실제 잠금 판정은 서버가 계산해 내려주는 nicknameChangeableAt으로 한다(시계 기준을 서버에 맡김).
export const NICKNAME_COOLDOWN_DAYS = 30

// 금칙어 여부. 호출 전에 trim()된 값을 넘길 것.
export function isBlacklistedNickname(nickname: string): boolean {
  const normalized = nickname.toLowerCase()
  if (EXACT_BLACKLIST.has(normalized)) return true
  return CONTAINS_BLACKLIST.some(word => normalized.includes(word))
}

// 닉네임 변경 쿨타임 상태.
//
// changeableAt(백엔드 UserInfoResponse.nicknameChangeableAt)의 의미:
//   - undefined : 백엔드가 아직 이 필드를 안 내려주는 구버전(프론트가 먼저 배포된 경우).
//                 잠그지 않고 평소대로 두되, 서버가 거부하면 그 에러 메시지를 보여준다.
//   - null      : 닉네임을 한 번도 바꾼 적 없음 → 변경 가능.
//   - 문자열    : 이 시각 이후부터 변경 가능. 백엔드 타입이 LocalDateTime이라
//                 타임존 표기가 **없는** ISO 문자열("2026-10-28T16:01:05")이고, 벽시계 기준은 KST다.
//
// ⚠️ 파싱은 반드시 parseServerDate로 한다. new Date()에 넘기면 타임존 없는 문자열을
//    실행 환경의 로컬 타임존으로 해석해버려, KST 기준으로 계산하는 화면 문구(formatRemainingTime,
//    formatDate)와 잠금 판정이 어긋난다. 해외 거주 사용자나 PC 타임존이 UTC인 경우
//    "약 곧 남음"이라고 안내하면서 폼은 잠겨 있는 상태가 만들어진다.
//
// locked는 어디까지나 화면용 힌트다. 사용자 PC 시계가 틀어져 있으면 판정이 어긋날 수 있으므로
// 잠금 상태와 무관하게 서버의 NICKNAME_CHANGE_COOLDOWN 에러 처리는 항상 살려둔다.
export function getNicknameCooldown(changeableAt: string | null | undefined): {
  locked: boolean
  until: string | null
} {
  if (!changeableAt) return { locked: false, until: null }

  const until = parseServerDate(changeableAt)
  // 서버가 이상한 값을 내려줬을 때(파싱 실패) 잠가버리면 영영 변경이 막히므로, 열어두고 서버에 맡긴다.
  if (Number.isNaN(until.getTime())) return { locked: false, until: null }

  return { locked: until.getTime() > Date.now(), until: changeableAt }
}
