import { notFound } from 'next/navigation'
import { postsApi } from '@/lib/api/posts'
import { commentsApi } from '@/lib/api/comments'
import { categoriesApi } from '@/lib/api/categories'
import { authHeaders } from '@/lib/api/server'
import { ApiError } from '@/lib/api/client'
import { encodeListContext, parseListContext, type ListContext } from '@/lib/list-context'
import PostDetail from '@/components/post/PostDetail'
import PostList from '@/components/post/PostList'
import Pagination from '@/components/common/Pagination'
import WriteButton from '@/components/post/WriteButton'
import CommentList from '@/components/comment/CommentList'
import type { Category, PostDetail as PostDetailData, PostSummary } from '@/types'

// 상세 하단 목록 한 페이지에 보여줄 글 수 (목록 페이지와 동일)
const LIST_SIZE = 20

// 상세 하단에 끼워 넣을 "목록" 데이터.
interface SiblingList {
  title: string                          // 목록 제목 (전체글 / 카테고리명 / 검색 결과)
  posts: PostSummary[]
  page: number
  totalPages: number
  basePath: string                       // 페이지네이션 기준 경로
  searchParams?: Record<string, string>  // 검색 컨텍스트의 keyword 등
  listContext: string                    // 하단 목록의 각 행에 다시 실어줄 컨텍스트
}

// 컨텍스트(보던 목록) 또는 폴백(글의 카테고리 1페이지)으로 하단 목록을 구성한다.
// 어느 쪽도 해석하지 못하면 null(→ 하단 목록 미표시).
async function loadSiblingList(
  ctx: ListContext | null,
  post: PostDetailData,
  categories: Category[]
): Promise<SiblingList | null> {
  // B) 전체 목록
  if (ctx?.from === 'all') {
    const res = await postsApi.getAll(ctx.page, LIST_SIZE).catch(() => null)
    return {
      title: '전체글',
      posts: res?.data?.posts?.content ?? [],
      page: ctx.page,
      totalPages: res?.data?.posts?.totalPages ?? 0,
      basePath: '/posts',
      listContext: encodeListContext(ctx),
    }
  }

  // B) 카테고리 목록 (slug → categoryId 해석)
  if (ctx?.from === 'cat') {
    const cat = categories.find(c => c.slug === ctx.slug)
    if (cat) {
      const res = await postsApi.getByCategory(cat.id, ctx.page, LIST_SIZE).catch(() => null)
      return {
        title: cat.name,
        posts: res?.data?.posts?.content ?? [],
        page: ctx.page,
        totalPages: res?.data?.posts?.totalPages ?? 0,
        basePath: `/posts/category/${cat.slug}`,
        listContext: encodeListContext(ctx),
      }
    }
    // slug를 못 찾으면 아래 폴백으로
  }

  // B) 검색 결과 목록
  if (ctx?.from === 'search') {
    const res = await postsApi
      .search({ keyword: ctx.keyword, page: ctx.page, size: LIST_SIZE })
      .catch(() => null)
    return {
      title: '검색 결과',
      posts: res?.data?.posts?.content ?? [],
      page: ctx.page,
      totalPages: res?.data?.posts?.totalPages ?? 0,
      basePath: '/posts/search',
      searchParams: { keyword: ctx.keyword },
      listContext: encodeListContext(ctx),
    }
  }

  // A) 폴백: 글의 카테고리 목록 첫 페이지 (이름 → 카테고리 해석)
  const cat = categories.find(c => c.name === post.categoryName)
  if (!cat) return null

  const res = await postsApi.getByCategory(cat.id, 0, LIST_SIZE).catch(() => null)
  return {
    title: cat.name,
    posts: res?.data?.posts?.content ?? [],
    page: 0,
    totalPages: res?.data?.posts?.totalPages ?? 0,
    basePath: `/posts/category/${cat.slug}`,
    listContext: encodeListContext({ from: 'cat', slug: cat.slug, page: 0 }),
  }
}

export default async function PostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ from?: string; p?: string; slug?: string; keyword?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const postId = Number(id)
  const headers = await authHeaders()
  const ctx = parseListContext(sp)

  // 게시글·댓글·카테고리를 병렬 조회. (카테고리는 하단 목록의 id/slug 해석에 쓰임)
  const [postRes, commentsRes, categoriesRes] = await Promise.allSettled([
    postsApi.getById(postId, { headers }),
    commentsApi.getByPostId(postId, { headers }),
    categoriesApi.getAll(),
  ])

  if (postRes.status === 'rejected') {
    const err = postRes.reason
    if (err instanceof ApiError && err.status === 404) notFound()
    throw err
  }

  const post = postRes.value.data!
  const comments =
    commentsRes.status === 'fulfilled' ? (commentsRes.value.data ?? []) : []
  const categories =
    categoriesRes.status === 'fulfilled' ? (categoriesRes.value.data ?? []) : []

  // 하단 목록은 부가 기능이므로 실패해도 본문에 영향 주지 않게 catch로 감싼다.
  const siblingList = await loadSiblingList(ctx, post, categories).catch(() => null)

  return (
    <div>
      <PostDetail post={post} />
      <CommentList postId={postId} comments={comments} />

      {/* 상세 하단에 "보던 목록"(없으면 글의 카테고리 목록)을 끼워 넣는다 */}
      {siblingList && siblingList.posts.length > 0 && (
        <section className="mt-10 border-t border-neutral-200 pt-6 dark:border-neutral-800">
          <h2 className="mb-3 text-base font-bold">{siblingList.title}</h2>
          <PostList
            posts={siblingList.posts}
            showCategory
            listContext={siblingList.listContext}
          />
          {/* 로그인 시 글쓰기 버튼을 페이지번호 위에 노출(비로그인이면 WriteButton이 null) */}
          <div className="mt-4 flex justify-end">
            <WriteButton />
          </div>
          <Pagination
            currentPage={siblingList.page}
            totalPages={siblingList.totalPages}
            basePath={siblingList.basePath}
            searchParams={siblingList.searchParams}
          />
        </section>
      )}
    </div>
  )
}
