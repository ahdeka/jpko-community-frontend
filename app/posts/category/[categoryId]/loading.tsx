import PostListSkeleton from '@/components/post/PostListSkeleton'

export default function Loading() {
  return (
    <div>
      <div className="h-6 w-24 rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse mb-4" />
      <PostListSkeleton />
    </div>
  )
}
