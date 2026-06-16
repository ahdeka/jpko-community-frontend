import PostListSkeleton from '@/components/post/PostListSkeleton'

export default function Loading() {
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">검색 결과</h1>
      <PostListSkeleton />
    </div>
  )
}
