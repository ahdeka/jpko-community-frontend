import Link from 'next/link'
import type { PublicProfile as PublicProfileData, UserPost, PageResponse } from '@/types'
import { formatDate, formatRelativeTime } from '@/lib/format'
import { categoryShortLabel } from '@/lib/category'
import { gradeMeta } from '@/lib/grade'
import AdminBadge from '@/components/common/AdminBadge'
import Pagination from '@/components/common/Pagination'

const CATEGORY_BADGE_STYLE =
  'bg-neutral-200 text-neutral-600 dark:bg-neutral-700/40 dark:text-neutral-300'

// 프로필 헤더의 원형 아바타(마이페이지와 동일한 실루엣으로 통일).
function AvatarIcon() {
  return (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-white dark:bg-neutral-600">
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4.42 3.58-7 8-7s8 2.58 8 7" />
      </svg>
    </span>
  )
}

// 유저가 쓴 글 한 줄. PostRow와 달리 작성자가 자명하므로 작성자 칸이 없고,
// UserPost에는 hasImage/anonymous가 없어 이미지 배지도 그리지 않는다.
function UserPostRow({ post }: { post: UserPost }) {
  return (
    <li className="hover:bg-neutral-100 dark:hover:bg-neutral-800/60">
      <Link href={`/posts/${post.id}`} className="flex items-center justify-between gap-3 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded ${CATEGORY_BADGE_STYLE}`}>
            {categoryShortLabel(post.categoryName)}
          </span>
          <span className="truncate text-sm text-neutral-800 dark:text-neutral-200">{post.title}</span>
          {post.commentCount > 0 && (
            <span className="shrink-0 text-[11px] font-medium text-orange-500">{post.commentCount}</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2 text-[11px] text-neutral-400">
          <span className="text-orange-400">♥ {post.likeCount}</span>
          <span className="tabular-nums">조회 {post.viewCount}</span>
          <span>{formatRelativeTime(post.createdAt)}</span>
        </div>
      </Link>
    </li>
  )
}

interface Props {
  profile: PublicProfileData
  postsPage: PageResponse<UserPost>
  currentPage: number
  // 페이지네이션 basePath에 쓸 원본 경로 세그먼트(=닉네임). 인코딩은 Pagination이 URLSearchParams로 처리.
  nickname: string
}

export default function PublicProfile({ profile, postsPage, currentPage, nickname }: Props) {
  const grade = gradeMeta(profile.grade)
  const posts = postsPage.content

  return (
    <div className="flex flex-col gap-6">
      {/* 프로필 헤더 카드 */}
      <section className="flex items-start gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-800/50">
        <AvatarIcon />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {profile.nickname}
            </h1>
            {/* 운영진이면 왕관 뱃지만(등급 SHOGUN 라벨과 중복되므로 등급 뱃지는 생략).
                일반 회원은 등급 뱃지를 보여준다. */}
            {profile.adminAuthor ? (
              <AdminBadge />
            ) : (
              <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${grade.badge}`}>
                {grade.label}
              </span>
            )}
            {profile.suspended && (
              <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600 dark:bg-red-500/20 dark:text-red-400">
                이용 정지
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
            {formatDate(profile.createdAt)} 가입
          </p>
          {/* 자기소개: 있으면 줄바꿈 보존해 보여주고, 없으면 흐린 안내 문구. */}
          {profile.bio ? (
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              {profile.bio}
            </p>
          ) : (
            <p className="mt-3 text-sm italic text-neutral-400 dark:text-neutral-500">
              아직 자기소개가 없습니다.
            </p>
          )}
        </div>
      </section>

      {/* 작성한 글 */}
      <section>
        <h2 className="mb-3 text-base font-bold text-neutral-900 dark:text-neutral-100">
          작성한 글{' '}
          <span className="text-sm font-normal text-neutral-400">{postsPage.totalElements}</span>
        </h2>

        {posts.length === 0 ? (
          <p className="py-10 text-center text-sm text-neutral-500">작성한 글이 없습니다.</p>
        ) : (
          <>
            <ul className="divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
              {posts.map(post => (
                <UserPostRow key={post.id} post={post} />
              ))}
            </ul>
            <Pagination
              currentPage={currentPage}
              totalPages={postsPage.totalPages}
              basePath={`/users/${encodeURIComponent(nickname)}`}
            />
          </>
        )}
      </section>
    </div>
  )
}
