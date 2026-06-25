interface Props {
  pinned: boolean
  featured: boolean
  // 'md'는 게시글 행(PostRow)의 카테고리 배지와 크기를 맞출 때 사용
  size?: 'sm' | 'md'
}

// 공지 배지 표시 규칙 (전 화면 공통):
//  - featured=true → "중요" (메인 상단 노출 공지)
//  - pinned=true   → "공지" (게시판 목록 상단 고정 공지)
//  - 둘 다 아님     → "안내" (목록에서만 볼 수 있는 일반 공지)
// 두 속성이 모두 켜진 공지는 "공지"와 "중요"를 함께 보여준다.
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

  return (
    <>
      {pinned && <span className={`${base} bg-amber-500 text-white`}>공지</span>}
      {featured && (
        <span className={`${base} bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400`}>
          중요
        </span>
      )}
    </>
  )
}
