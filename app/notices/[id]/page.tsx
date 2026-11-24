import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { noticesApi } from '@/lib/api/notices'
import { postsApi } from '@/lib/api/posts'
import { commentsApi } from '@/lib/api/comments'
import { authHeaders } from '@/lib/api/server'
import { ApiError } from '@/lib/api/client'
import { encodeListContext } from '@/lib/list-context'
import { excerpt } from '@/lib/site'
import NoticeDetail from '@/components/notice/NoticeDetail'
import CommentList from '@/components/comment/CommentList'
import PostList from '@/components/post/PostList'
import Pagination from '@/components/common/Pagination'
import WriteButton from '@/components/post/WriteButton'

// 공지 상세 하단에 보여줄 전체글 수 (게시글 목록과 동일)
const LIST_SIZE = 20

// generateMetadata와 페이지가 공지를 한 번만 조회하도록 캐시(조회수 이중 증가 방지).
// authHeaders()로 브라우저 쿠키(viewedNotice_{id})를 백엔드에 전달해야 조회수 중복 증가를 막을 수 있다.
const getNotice = cache((noticeId: number) =>
  authHeaders().then(headers => noticesApi.getById(noticeId, { headers }))
)

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const noticeId = Number(id)
  if (!Number.isFinite(noticeId)) return {}

  const res = await getNotice(noticeId).catch(() => null)
  const notice = res?.data
  if (!notice) return { title: '공지사항' }

  const description = excerpt(notice.content)
  return {
    title: notice.title,
    description,
    openGraph: { type: 'article', title: notice.title, description },
    twitter: { card: 'summary_large_image', title: notice.title, description },
  }
}

export default async function NoticePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ cpage?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const noticeId = Number(id)

  // 잘못된 경로(/notices/abc)로 들어오면 404
  if (!Number.isFinite(noticeId)) notFound()

  // 댓글 페이지(0-based). 음수·NaN은 0으로 막는다.
  const commentPage = Math.max(0, Number(sp.cpage) || 0)

  // 댓글의 isOwner(본인 댓글 여부) 판별을 위해 브라우저 쿠키를 백엔드로 전달한다.
  // (getNotice는 캐시 안에서 자체적으로 헤더를 만들어 쓰므로 여기서는 댓글용으로만 사용)
  const headers = await authHeaders()

  // 공지 본문·댓글·전체글 0페이지를 병렬 조회.
  // 댓글/전체글은 부가 노출이라 실패해도 공지 본문에는 영향 주지 않도록 각각 catch로 격리한다.
  const [noticeRes, commentsRes, postsRes] = await Promise.all([
    getNotice(noticeId).catch((err: unknown) => {
      if (err instanceof ApiError && err.status === 404) notFound()
      throw err
    }),
    commentsApi.getByTarget({ type: 'NOTICE', id: noticeId }, commentPage, { headers }).catch(() => null),
    postsApi.getAll(0, LIST_SIZE).catch(() => null),
  ])

  const notice = noticeRes?.data
  if (!notice) notFound()

  // 응답: { comments: Page<Comment>, totalCommentCount }. 헤더 개수는 totalCommentCount(대댓글 포함,
  // 삭제 제외), 페이지 경계·마지막 페이지 계산은 comments.totalElements(최상위·삭제 포함)를 쓴다.
  const commentsData = commentsRes?.data
  const commentPageData = commentsData?.comments
  const comments = commentPageData?.content ?? []
  const commentPageNumber = commentPageData?.number ?? commentPage
  const commentTotalPages = commentPageData?.totalPages ?? 0
  const commentTopLevelTotal = commentPageData?.totalElements ?? 0
  const commentTotal = commentsData?.totalCommentCount ?? 0
  const posts = postsRes?.data?.posts?.content ?? []
  const totalPages = postsRes?.data?.posts?.totalPages ?? 0

  return (
    <div>
      <NoticeDetail notice={notice} />
      <CommentList
        target={{ type: 'NOTICE', id: noticeId }}
        comments={comments}
        page={commentPageNumber}
        totalPages={commentTotalPages}
        totalCount={commentTotal}
        topLevelTotal={commentTopLevelTotal}
        basePath={`/notices/${noticeId}`}
      />

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
