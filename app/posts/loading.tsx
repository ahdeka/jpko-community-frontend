import PostListSkeleton from '@/components/post/PostListSkeleton'

// min-h-screen: 이동 시 맨 위로 스크롤 보장용 (이유는 app/posts/[id]/loading.tsx 주석 참고)
export default function Loading() {
  return (
    <div className="min-h-screen">
      <h1 className="text-xl font-bold mb-4">전체 글</h1>
      <PostListSkeleton />
    </div>
  )
}
