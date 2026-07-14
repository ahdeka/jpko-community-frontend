import Link from 'next/link'
import type { PostDetail as PostDetailData } from '@/types'
import { formatDateTime } from '@/lib/format'
import LikeButtons from './LikeButtons'
import PostActions from './PostActions'
import DeletePostButton from './DeletePostButton'
import AuthorName from '@/components/common/AuthorName'

interface Props {
  post: PostDetailData
}

export default function PostDetail({ post }: Props) {
  return (
    <div>
      <div className="border-b border-gray-200 dark:border-neutral-800 pb-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-blue-600 dark:text-blue-400">[{post.categoryName}]</span>
        </div>
        <h1 className="text-xl font-bold mb-3">{post.title}</h1>
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-neutral-400">
          <div className="flex items-center gap-3">
            <AuthorName author={post.author} isAdmin={post.adminAuthor} />
            <span>{formatDateTime(post.createdAt)}</span>
            <span>조회 {post.viewCount}</span>
          </div>
          {post.isOwner && (
            <div className="flex items-center gap-3">
              <Link
                href={`/posts/${post.id}/edit`}
                className="text-xs text-gray-400 hover:text-blue-500 dark:text-neutral-500 dark:hover:text-blue-400"
              >
                수정
              </Link>
              <DeletePostButton postId={post.id} />
            </div>
          )}
        </div>
      </div>

      {/*
        content는 백엔드가 Jsoup Safelist.relaxed()로 sanitize한 HTML이다.
        생성·수정 모든 경로에서 서버가 sanitize하므로 저장된 값은 XSS 안전하며,
        그 신뢰를 전제로 dangerouslySetInnerHTML로 렌더링한다.
      */}
      <div
        className="post-content min-h-40 py-6 text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <LikeButtons
        postId={post.id}
        initialLikeCount={post.likeCount}
        initialDislikeCount={post.dislikeCount}
      />

      {/* 좋아요와 댓글 영역을 구분선으로 나누는 하단 액션 바(목록/공유/신고). */}
      <PostActions shareTitle={post.title} />
    </div>
  )
}
