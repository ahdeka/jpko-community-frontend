function PostRowSkeleton() {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div className="flex flex-col gap-2 min-w-0 w-full">
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-3.5 rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-4 w-2/3 max-w-xs rounded bg-neutral-200 dark:bg-neutral-700" />
        </div>
        <div className="h-3 w-24 rounded bg-neutral-200 dark:bg-neutral-700" />
      </div>
      <div className="h-3 w-10 shrink-0 rounded bg-neutral-200 dark:bg-neutral-700" />
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
