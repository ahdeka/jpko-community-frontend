interface Props {
  posts: { id: number; title: string }[]
  columns?: 1 | 2
}

export default function RankedPostList({ posts, columns = 1 }: Props) {
  return (
    <ol className={columns === 2 ? 'grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1' : 'flex flex-col gap-1'}>
      {posts.map((post, index) => (
        <li key={post.id} className="flex items-center gap-2 py-1 min-w-0">
          <span className="text-orange-500 font-bold text-sm w-4 shrink-0">{index + 1}</span>
          <span className="truncate text-sm text-neutral-200">{post.title}</span>
        </li>
      ))}
    </ol>
  )
}
