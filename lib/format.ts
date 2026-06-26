// 게시글/댓글 목록에서 쓰는 상대 시간 표시 ("3분 전", "2시간 전" 등)
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60_000)

  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`

  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}시간 전`

  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay}일 전`

  return date.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })
}

// 상세/대시보드에서 쓰는 절대 날짜 표시 ("2026. 06. 25.")
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

// 게시글 상세에서 쓰는 정확한 날짜·시간 표시 ("2026.06.25 16:01:05")
// 백엔드 LocalDateTime은 타임존 없는 ISO("...T16:01:05")로 내려오므로
// new Date가 로컬 시각으로 해석한다(목록의 상대시간 표시와 동일 기준).
export function formatDateTime(dateString: string): string {
  const d = new Date(dateString)
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  )
}
