// PostRow(card)와 같은 Grid 배치를 따른다: 모바일은 작성자 자리가 2번째 줄 오른쪽,
// 데스크탑(sm 이상)은 오른쪽 칸 세로 가운데. 로딩→실제 목록 전환 때 자리가 튀지 않게 맞춘다.
function PostRowSkeleton() {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-2.5">
      <div className="col-span-2 flex min-w-0 items-center gap-2 sm:col-span-1">
        <div className="h-3.5 w-3.5 rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-4 w-2/3 max-w-xs rounded bg-neutral-200 dark:bg-neutral-700" />
      </div>
      <div className="col-start-1 row-start-2 h-3 w-24 rounded bg-neutral-200 dark:bg-neutral-700" />
      <div className="col-start-2 row-start-2 h-3 w-10 rounded bg-neutral-200 dark:bg-neutral-700 sm:row-span-2 sm:row-start-1" />
    </li>
  )
}

export default function PostListSkeleton() {
  return (
    <ul className="animate-pulse divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
      {Array.from({ length: 10 }).map((_, i) => (
        <PostRowSkeleton key={i} />
      ))}
    </ul>
  )
}
