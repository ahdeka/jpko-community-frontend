interface Props {
  pinned: boolean
  featured: boolean
  // 'md'는 게시글 행(PostRow)의 카테고리 배지와 크기를 맞출 때 사용
  size?: 'sm' | 'md'
}

// 공지 배지 표시 규칙 (전 화면 공통):
//  - pinned 또는 featured 중 하나라도 켜짐 → "공지" (상단 고정 또는 메인 노출 공지)
//  - 둘 다 꺼짐                          → "안내" (목록에서만 볼 수 있는 일반 공지)
// pinned/featured의 노출 위치 구분은 유지하되, 배지는 두 상태로만 단순화한다.
export default function NoticeBadges({ pinned, featured, size = 'sm' }: Props) {
  const sizeClass = size === 'md' ? 'text-xs' : 'text-[10px]'
  const base = `shrink-0 rounded px-1.5 py-0.5 font-bold ${sizeClass}`

  // 어느 쪽에도 해당하지 않는 일반 공지
  if (!pinned && !featured) {
    return (
      <span className={`${base} bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-300`}>
        안내
      </span>
    )
  }

  // 상단 고정 또는 메인 노출 → "공지" 하나로 통일
  return <span className={`${base} bg-amber-500 text-white`}>공지</span>
}
