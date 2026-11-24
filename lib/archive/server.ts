// lib/archive/server.ts
//
// 아카이브 모드의 "가짜 백엔드".
// 운영 종료(2026-11) 후 API 서버와 DB는 내려갔고, 그 시점의 게시글·공지·댓글을
// 작성자 정보 없이 data/archive.json 하나로 보관한다(생성: scripts/archive/prepare.py).
// 기존 화면은 apiClient.get('/api/...')로 데이터를 받으므로, 같은 경로·같은 응답 모양을
// 이 모듈이 JSON에서 만들어 돌려준다. 그래서 화면 컴포넌트는 거의 손대지 않아도 된다.
//
// 서버(RSC)에서만 import된다(client.ts의 동적 import). 브라우저 번들에는 실리지 않는다.

import raw from '@/data/archive.json'
import type {
  ApiResponse,
  Category,
  Comment,
  CommentPage,
  NoticeDetail,
  NoticeSummary,
  PageResponse,
  PostDetail,
  PostListResponse,
  PostSummary,
} from '@/types'

interface RawPost {
  id: number
  categoryId: number
  title: string
  content: string
  viewCount: number
  createdAt: string
  likeCount: number
  dislikeCount: number
}
interface RawNotice {
  id: number
  title: string
  content: string
  pinned: boolean
  viewCount: number
  createdAt: string
}
interface RawComment {
  id: number
  targetType: 'POST' | 'NOTICE'
  targetId: number
  parentId: number | null
  content: string | null
  imageUrl: string | null
  deleted: boolean
  createdAt: string
}
interface RawArchive {
  exportedAt: string
  categories: { id: number; name: string; slug: string; order: number }[]
  posts: RawPost[]
  notices: RawNotice[]
  comments: RawComment[]
}

const data = raw as unknown as RawArchive

// 작성자는 전부 익명으로 보여준다. anonymous=true면 화면이 프로필 링크를 걸지 않는다.
const ANONYMOUS = '익명'
const NOTICE_AUTHOR = '운영자'
const COMMENT_PAGE_SIZE = 20

// ── 인덱스 ────────────────────────────────────────────────
const categories: Category[] = data.categories
  .map(c => ({ id: c.id, name: c.name, slug: c.slug, displayOrder: c.order }))
  .sort((a, b) => a.displayOrder - b.displayOrder)
const categoryName = new Map(categories.map(c => [c.id, c.name]))

const commentsByTarget = new Map<string, RawComment[]>()
for (const c of data.comments) {
  const key = `${c.targetType}:${c.targetId}`
  const list = commentsByTarget.get(key) ?? []
  list.push(c)
  commentsByTarget.set(key, list)
}
const liveCommentCount = (type: 'POST' | 'NOTICE', id: number) =>
  (commentsByTarget.get(`${type}:${id}`) ?? []).filter(c => !c.deleted).length

const hasMedia = (html: string) => /<(img|video)\b/i.test(html)
const stripHtml = (html: string) => html.replace(/<[^>]*>/g, ' ')

// 최신 글이 먼저 오도록 정렬해 둔다(목록 기본 정렬).
const posts = [...data.posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
const postById = new Map(posts.map(p => [p.id, p]))
const notices = [...data.notices].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
const noticeById = new Map(notices.map(n => [n.id, n]))

function toSummary(p: RawPost): PostSummary {
  return {
    id: p.id,
    categoryName: categoryName.get(p.categoryId) ?? '',
    title: p.title,
    author: ANONYMOUS,
    authorLevel: null,
    adminAuthor: false,
    rootAuthor: false,
    anonymous: true,
    viewCount: p.viewCount,
    commentCount: liveCommentCount('POST', p.id),
    likeCount: p.likeCount,
    hasImage: hasMedia(p.content),
    createdAt: p.createdAt,
  } as PostSummary
}

function toNoticeSummary(n: RawNotice): NoticeSummary {
  return {
    id: n.id,
    title: n.title,
    viewCount: n.viewCount,
    pinned: n.pinned,
    featured: false,
    createdAt: n.createdAt,
  }
}

function page<T>(items: T[], pageNumber: number, size: number): PageResponse<T> {
  const safeSize = size > 0 ? size : 20
  const totalPages = Math.ceil(items.length / safeSize)
  return {
    content: items.slice(pageNumber * safeSize, (pageNumber + 1) * safeSize),
    totalPages,
    totalElements: items.length,
    number: pageNumber,
    size: safeSize,
  } as PageResponse<T>
}

function postList(items: RawPost[], pageNumber: number, size: number): PostListResponse {
  return {
    pinnedNotices: pageNumber === 0 ? notices.filter(n => n.pinned).map(toNoticeSummary) : [],
    posts: page(items.map(toSummary), pageNumber, size),
  }
}

// 인기글: 운영 기간 전체를 대상으로, 운영 중 쓰던 점수식(추천·댓글·조회)의 분자만 쓴다.
// 아카이브에는 "오늘/주간"이 의미가 없으므로 period는 무시하고 같은 목록을 돌려준다.
function popular(limit = 5): PostSummary[] {
  const score = (p: RawPost) =>
    p.likeCount * 3 + liveCommentCount('POST', p.id) * 2 + Math.log(p.viewCount + 1)
  return [...posts].sort((a, b) => score(b) - score(a)).slice(0, limit).map(toSummary)
}

function toComment(c: RawComment, replies: Comment[]): Comment {
  return {
    id: c.id,
    author: ANONYMOUS,
    authorLevel: null,
    adminAuthor: false,
    rootAuthor: false,
    anonymous: true,
    isOwner: false,
    content: c.deleted ? '' : (c.content ?? ''),
    imageUrl: c.deleted ? null : c.imageUrl,
    deleted: c.deleted,
    createdAt: c.createdAt,
    replies,
  } as Comment
}

function commentPage(type: 'POST' | 'NOTICE', id: number, pageNumber: number): CommentPage {
  const all = [...(commentsByTarget.get(`${type}:${id}`) ?? [])].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  )
  const roots = all.filter(c => c.parentId === null)
  const tree = roots.map(r =>
    toComment(
      r,
      all.filter(c => c.parentId === r.id && !c.deleted).map(c => toComment(c, []))
    )
  )
  return {
    comments: page(tree, pageNumber, COMMENT_PAGE_SIZE),
    totalCommentCount: all.filter(c => !c.deleted).length,
  } as CommentPage
}

// ── 라우팅 ────────────────────────────────────────────────
export class ArchiveNotFound extends Error {}

const ok = <T>(body: T): ApiResponse<T> => ({ status: 200, code: 'OK', data: body })

export function archiveGet<T>(endpoint: string): ApiResponse<T> {
  const url = new URL(endpoint, 'http://archive.local')
  const path = url.pathname.replace(/\/+$/, '')
  const q = url.searchParams
  const pageNumber = Math.max(0, Number(q.get('page')) || 0)
  const size = Number(q.get('size')) || 20
  let m: RegExpMatchArray | null

  const respond = (body: unknown) => ok(body) as ApiResponse<T>

  if (path === '/api/categories') return respond(categories)

  if (path === '/api/posts') return respond(postList(posts, pageNumber, size))

  if (path === '/api/posts/popular') return respond(popular())

  if (path === '/api/posts/search') {
    const keyword = (q.get('keyword') ?? '').trim().toLowerCase()
    const type = q.get('type') ?? 'TITLE_CONTENT'
    const categoryId = q.get('categoryId') ? Number(q.get('categoryId')) : null
    const matched = keyword
      ? posts.filter(p => {
          if (categoryId !== null && p.categoryId !== categoryId) return false
          if (type === 'NICKNAME') return false // 작성자 정보가 없으므로 닉네임 검색은 결과 없음
          const inTitle = p.title.toLowerCase().includes(keyword)
          if (type === 'TITLE') return inTitle
          return inTitle || stripHtml(p.content).toLowerCase().includes(keyword)
        })
      : []
    return respond(postList(matched, pageNumber, size))
  }

  if ((m = path.match(/^\/api\/posts\/category\/(\d+)$/))) {
    const id = Number(m[1])
    return respond(postList(posts.filter(p => p.categoryId === id), pageNumber, size))
  }

  if ((m = path.match(/^\/api\/posts\/(\d+)\/comments$/))) {
    return respond(commentPage('POST', Number(m[1]), pageNumber))
  }

  if ((m = path.match(/^\/api\/posts\/(\d+)$/))) {
    const p = postById.get(Number(m[1]))
    if (!p) throw new ArchiveNotFound(path)
    const detail: PostDetail = {
      ...toSummary(p),
      content: p.content,
      isOwner: false,
      likeCount: p.likeCount,
      dislikeCount: p.dislikeCount,
    }
    return respond(detail)
  }

  if (path === '/api/notices') return respond(page(notices.map(toNoticeSummary), pageNumber, size))

  if (path === '/api/notices/featured') return respond([])

  if ((m = path.match(/^\/api\/notices\/(\d+)\/comments$/))) {
    return respond(commentPage('NOTICE', Number(m[1]), pageNumber))
  }

  if ((m = path.match(/^\/api\/notices\/(\d+)$/))) {
    const n = noticeById.get(Number(m[1]))
    if (!n) throw new ArchiveNotFound(path)
    const detail: NoticeDetail = {
      id: n.id,
      title: n.title,
      content: n.content,
      author: NOTICE_AUTHOR,
      viewCount: n.viewCount,
      pinned: n.pinned,
      featured: false,
      createdAt: n.createdAt,
    }
    return respond(detail)
  }

  throw new ArchiveNotFound(path)
}

// sitemap·RSS처럼 경로 단위가 아니라 전체 목록이 필요한 곳에서 쓴다.
export const archive = {
  exportedAt: data.exportedAt,
  posts: () => posts.map(toSummary),
  notices: () => notices.map(toNoticeSummary),
  categories: () => categories,
  postContent: (id: number) => postById.get(id)?.content ?? '',
}
