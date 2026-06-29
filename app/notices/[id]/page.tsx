import { notFound } from 'next/navigation'
import { noticesApi } from '@/lib/api/notices'
import { postsApi } from '@/lib/api/posts'
import { ApiError } from '@/lib/api/client'
import { encodeListContext } from '@/lib/list-context'
import NoticeDetail from '@/components/notice/NoticeDetail'
import PostList from '@/components/post/PostList'
import Pagination from '@/components/common/Pagination'
import WriteButton from '@/components/post/WriteButton'

// 공지 상세 하단에 보여줄 전체글 수 (게시글 목록과 동일)
const LIST_SIZE = 20

export default async function NoticePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const noticeId = Number(id)

  // 잘못된 경로(/notices/abc)로 들어오면 404
  if (!Number.isFinite(noticeId)) notFound()

  // 공지 본문과 전체글 0페이지를 병렬 조회.
  // 전체글은 부가 노출이라 실패해도 공지 본문에는 영향 주지 않도록 catch로 격리한다.
  const [noticeRes, postsRes] = await Promise.all([
    noticesApi.getById(noticeId).catch((err: unknown) => {
      if (err instanceof ApiError && err.status === 404) notFound()
      throw err
    }),
    postsApi.getAll(0, LIST_SIZE).catch(() => null),
  ])

  const notice = noticeRes?.data
  if (!notice) notFound()

  const posts = postsRes?.data?.posts?.content ?? []
  const totalPages = postsRes?.data?.posts?.totalPages ?? 0

  return (
    <div>
      <NoticeDetail notice={notice} />

      {/* 공지를 다 읽은 뒤 자연스럽게 커뮤니티 글로 유입되도록 전체글을 항상 노출.
          (공지 목록으로 가려면 상단의 목록 아이콘을 사용) */}
      {posts.length > 0 && (
        <section className="mt-10 border-t border-neutral-200 pt-6 dark:border-neutral-800">
          <h2 className="mb-3 text-base font-bold">전체글</h2>
          <PostList
            posts={posts}
            showCategory
            listContext={encodeListContext({ from: 'all', page: 0 })}
          />
          {/* 로그인 시 글쓰기 버튼을 페이지번호 위에 노출 */}
          <div className="mt-4 flex justify-end">
            <WriteButton />
          </div>
          <Pagination currentPage={0} totalPages={totalPages} basePath="/posts" />
        </section>
      )}
    </div>
  )
}
