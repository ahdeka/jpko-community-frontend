import Link from 'next/link'
import { PostSummary } from '@/types'
import { formatRelativeTime } from '@/lib/format'
import { categoryShortLabel } from '@/lib/category'
import ImageBadge from '@/components/common/ImageBadge'
import AuthorName from '@/components/common/AuthorName'

const CATEGORY_BADGE_STYLE = 'bg-neutral-200 text-neutral-600 dark:bg-neutral-700/40 dark:text-neutral-300'

// 표형(variant='table')에서 데스크탑 컬럼 정렬에 쓰는 grid 정의.
// 헤더(PostList)와 각 행이 같은 클래스를 공유해야 컬럼이 정렬된다.
// 컬럼: 제목(1fr) | 글쓴이 | 작성일 | 조회 | 추천
export const POST_GRID = 'md:grid md:grid-cols-[minmax(0,1fr)_6.5rem_4.5rem_3.5rem_3.5rem] md:items-center md:gap-3'

// 'card'(기본): 2줄 카드형 — 초기 단계에 적합한 깔끔/모던 레이아웃.
// 'table': 데스크탑 표형(모바일은 카드로 자동 전환) — 글이 많아졌을 때를 위한 옵션.
export type PostRowVariant = 'card' | 'table'

interface Props {
  post: PostSummary
  showCategory?: boolean
  // 메인/사이드바 미리보기용. true면 메타 줄 없이 제목+작성자만 한 줄로 보여준다.
  compact?: boolean
  variant?: PostRowVariant
  // 상세 진입 링크에 붙일 "보던 목록" 컨텍스트 쿼리스트링(예: "from=all&p=2").
  listContext?: string
}

// 좋아요 아이콘
function LikeIcon() {
  return (
    <svg className="w-2.5 h-2.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 10v12" />
      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
    </svg>
  )
}

// 시계 아이콘 (작성 시간 앞에 표시)
function ClockIcon() {
  return (
    <svg className="w-2.5 h-2.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

// 좋아요(연한 주황) + 시간(시계 아이콘) 메타. 좋아요는 0이어도 항상 노출해 구조를 통일한다.
// 글씨는 text-[10px]로 본문/작성자보다 한 단계 작게 둔다.
function LikeTimeMeta({ likeCount, createdAt }: { likeCount: number; createdAt: string }) {
  return (
    <>
      <span className="flex items-center gap-0.5 text-[10px] text-orange-400">
        <LikeIcon />
        {likeCount}
      </span>
      <span className="flex items-center gap-0.5 text-[10px]">
        <ClockIcon />
        {formatRelativeTime(createdAt)}
      </span>
    </>
  )
}

export default function PostRow({
  post,
  showCategory = false,
  compact = false,
  variant = 'card',
  listContext,
}: Props) {
  const href = listContext ? `/posts/${post.id}?${listContext}` : `/posts/${post.id}`
  const liClass = 'hover:bg-neutral-100 dark:hover:bg-neutral-800/60'

  // 제목 줄 (공통): 카테고리 · 이미지 · 제목 · 댓글수
  const titleRow = (
    <div className="flex items-center gap-2 min-w-0">
      {showCategory && (
        <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded ${CATEGORY_BADGE_STYLE}`}>
          {categoryShortLabel(post.categoryName)}
        </span>
      )}
      {post.hasImage && <ImageBadge />}
      <span className="text-sm truncate text-neutral-800 dark:text-neutral-200">{post.title}</span>
      {post.commentCount > 0 && (
        <span className="shrink-0 text-[11px] text-orange-500 font-medium">{post.commentCount}</span>
      )}
    </div>
  )

  // compact: 홈/사이드바 미리보기 — 제목 + 우측 작성자만 한 줄
  if (compact) {
    return (
      <li className={liClass}>
        <Link href={href} className="flex items-center justify-between gap-3 py-2.5">
          {titleRow}
          <AuthorName author={post.author} isAdmin={post.adminAuthor} className="shrink-0 text-xs text-neutral-500" />
        </Link>
      </li>
    )
  }

  // table: 데스크탑은 표형 컬럼 정렬, 모바일은 2줄 카드 (글이 많을 때를 위한 옵션)
  if (variant === 'table') {
    return (
      <li className={liClass}>
        <Link href={href} className={`block py-2.5 ${POST_GRID}`}>
          <div className="min-w-0">
            {titleRow}
            {/* 모바일 전용 메타: 좋아요(주황)·시간 + 작성자 (데스크탑은 컬럼으로 분리) */}
            <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500 md:hidden">
              <LikeTimeMeta likeCount={post.likeCount} createdAt={post.createdAt} />
              <AuthorName author={post.author} isAdmin={post.adminAuthor} className="ml-auto truncate pl-2" />
            </div>
          </div>

          {/* 데스크탑 전용 컬럼: 글쓴이 · 작성일 · 조회 · 추천 */}
          <AuthorName author={post.author} isAdmin={post.adminAuthor} className="hidden md:block truncate text-center text-xs text-neutral-500" />
          <span className="hidden md:block text-center text-xs text-neutral-400">{formatRelativeTime(post.createdAt)}</span>
          <span className="hidden md:block text-center text-xs text-neutral-500 tabular-nums">{post.viewCount}</span>
          <span className="hidden md:block text-center text-xs font-medium text-orange-400 tabular-nums">{post.likeCount}</span>
        </Link>
      </li>
    )
  }

  // card (기본): 2줄 카드 — 제목 줄 + (좋아요>0·시간) 메타, 우측 작성자
  return (
    <li className={liClass}>
      <Link href={href} className="flex items-center justify-between gap-3 py-2.5">
        <div className="flex flex-col gap-1 min-w-0">
          {titleRow}
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <LikeTimeMeta likeCount={post.likeCount} createdAt={post.createdAt} />
          </div>
        </div>
        <AuthorName author={post.author} isAdmin={post.adminAuthor} className="shrink-0 text-xs text-neutral-500" />
      </Link>
    </li>
  )
}
