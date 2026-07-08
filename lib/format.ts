// 백엔드 LocalDateTime은 타임존 표기가 없는 ISO 문자열("2026-07-08T16:01:05")로 내려온다.
// DB는 KST(Asia/Seoul)로 저장하므로 이 문자열의 벽시계 시각은 KST 기준이다.
//
// 문제: new Date()는 "타임존이 없는" 문자열을 실행 런타임의 로컬 타임존으로 해석한다.
//       목록/상세는 서버 컴포넌트(RSC)라 UTC 서버에서 렌더되는데, KST 벽시계 문자열을
//       UTC로 오해하면 실제보다 9시간 미래로 계산돼 상대시간이 전부 "방금 전"으로 깨진다.
// 해결: 타임존 표기가 없으면 KST 오프셋(+09:00)을 명시적으로 붙여, 어떤 런타임(UTC 서버,
//       KST 브라우저)에서도 동일한 절대시각으로 파싱한다.
const KST_OFFSET = '+09:00'
const KST_TIMEZONE = 'Asia/Seoul'

function parseServerDate(dateString: string): Date {
  // 이미 Z 또는 ±hh:mm / ±hhmm 오프셋이 붙어 있으면 그 타임존 정보를 신뢰한다.
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(dateString)
  return new Date(hasTimezone ? dateString : `${dateString}${KST_OFFSET}`)
}

// 게시글/댓글 목록에서 쓰는 상대 시간 표시 ("3분 전", "2시간 전" 등)
export function formatRelativeTime(dateString: string): string {
  const date = parseServerDate(dateString)
  // 시계 오차 등으로 미래 시각이 들어와 음수가 되어도 diffMin < 1 분기에서 "방금 전"으로 흡수된다.
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60_000)

  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`

  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}시간 전`

  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay}일 전`

  return date.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', timeZone: KST_TIMEZONE })
}

// 상세/대시보드에서 쓰는 절대 날짜 표시 ("2026. 06. 25.")
export function formatDate(dateString: string): string {
  return parseServerDate(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: KST_TIMEZONE,
  })
}

// 게시글 상세에서 쓰는 정확한 날짜·시간 표시 ("2026.06.25 16:01:05")
// timeZone을 Asia/Seoul로 고정해, 서버(UTC)에서 렌더되더라도 항상 KST 벽시계로 보여준다.
export function formatDateTime(dateString: string): string {
  // 'sv-SE' 로케일은 "2026-06-25 16:01:05" 형태(ISO 유사)를 주므로 구분자만 점으로 바꾼다.
  const formatted = new Intl.DateTimeFormat('sv-SE', {
    timeZone: KST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(parseServerDate(dateString))
  // "2026-06-25 16:01:05" → "2026.06.25 16:01:05"
  return formatted.replace(/-/g, '.')
}
