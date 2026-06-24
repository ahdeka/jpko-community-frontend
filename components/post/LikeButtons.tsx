'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { likesApi } from '@/lib/api/likes'
import { ApiError } from '@/lib/api/client'
import { useAuth } from '@/lib/auth-context'

interface Props {
  postId: number
  initialLikeCount: number
  initialDislikeCount: number
}

export default function LikeButtons({ postId, initialLikeCount, initialDislikeCount }: Props) {
  const router = useRouter()
  const { user } = useAuth()
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [dislikeCount, setDislikeCount] = useState(initialDislikeCount)
  const [myType, setMyType] = useState<'LIKE' | 'DISLIKE' | null>(null)

  useEffect(() => {
    likesApi.getStatus(postId)
      .then(res => {
        if (!res.data) return
        setLikeCount(res.data.likeCount)
        setDislikeCount(res.data.dislikeCount)
        setMyType(res.data.myType)
      })
      .catch(() => {})
  }, [postId])

  const toggle = async (type: 'LIKE' | 'DISLIKE') => {
    if (!user) {
      router.push('/login')
      return
    }
    try {
      const res = await likesApi.toggle(postId, type)
      if (!res.data) return
      setLikeCount(res.data.likeCount)
      setDislikeCount(res.data.dislikeCount)
      setMyType(res.data.myType)
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        router.push('/login')
      }
    }
  }

  return (
    // 본문과 댓글 사이에 구역선 없이 자연스럽게 떠 있는 둥근 버튼 2개.
    // 본문 바로 아래라는 흐름을 유지하기 위해 위쪽 여백만 주고 테두리 구분선은 두지 않는다.
    <div className="flex gap-3 justify-center py-6">
      <button
        onClick={() => toggle('LIKE')}
        aria-pressed={myType === 'LIKE'}
        className={`flex items-center gap-1.5 rounded-full border px-6 py-2.5 text-sm font-medium shadow-sm transition-colors ${
          myType === 'LIKE'
            ? 'border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-300'
            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
        }`}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M2 21h4V9H2v12zM23 10a2 2 0 0 0-2-2h-6.31l.95-4.57.03-.32a1.5 1.5 0 0 0-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10a2 2 0 0 0 2 2h9a2 2 0 0 0 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
        </svg>
        좋아요 <span className="font-semibold text-emerald-600 dark:text-emerald-400">{likeCount}</span>
      </button>
      <button
        onClick={() => toggle('DISLIKE')}
        aria-pressed={myType === 'DISLIKE'}
        className={`flex items-center gap-1.5 rounded-full border px-6 py-2.5 text-sm font-medium shadow-sm transition-colors ${
          myType === 'DISLIKE'
            ? 'border-red-400 bg-red-50 text-red-700 dark:border-red-500 dark:bg-red-950/40 dark:text-red-300'
            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
        }`}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M22 3h-4v12h4V3zM1 14a2 2 0 0 0 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.58-6.59c.37-.36.59-.86.59-1.41V5a2 2 0 0 0-2-2H6a2 2 0 0 0-1.84 1.22L1.14 11.27c-.09.23-.14.47-.14.73v2z" />
        </svg>
        싫어요 <span className="font-semibold text-red-500 dark:text-red-400">{dislikeCount}</span>
      </button>
    </div>
  )
}
