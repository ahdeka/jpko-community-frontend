export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="border-b border-gray-200 dark:border-neutral-800 pb-4 mb-4">
        <div className="h-3 w-16 rounded bg-neutral-200 dark:bg-neutral-700 mb-2" />
        <div className="h-6 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700 mb-3" />
        <div className="flex items-center gap-3">
          <div className="h-3 w-12 rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-3 w-16 rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-3 w-12 rounded bg-neutral-200 dark:bg-neutral-700" />
        </div>
      </div>

      <div className="min-h-40 py-6 space-y-2">
        <div className="h-4 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-4 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-4 w-2/3 rounded bg-neutral-200 dark:bg-neutral-700" />
      </div>

      <div className="mt-8">
        <div className="h-5 w-24 rounded bg-neutral-200 dark:bg-neutral-700 mb-4" />
        <div className="h-16 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
      </div>
    </div>
  )
}
