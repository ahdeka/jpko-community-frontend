import PostListSkeleton from '@/components/post/PostListSkeleton'

// min-h-screen: 이동 시 맨 위로 스크롤 보장용 (이유는 app/posts/[id]/loading.tsx 주석 참고)
export default function Loading() {
  return (
    <div className="min-h-screen">
      <div className="h-6 w-24 rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse mb-4" />
      <PostListSkeleton />
    </div>
  )
}
