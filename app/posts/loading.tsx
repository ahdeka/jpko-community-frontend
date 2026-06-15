import PostListSkeleton from '@/components/post/PostListSkeleton'

export default function Loading() {
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">전체 글</h1>
      <PostListSkeleton />
    </div>
  )
}
