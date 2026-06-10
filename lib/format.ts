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
