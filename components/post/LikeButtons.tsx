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
    <div className="flex gap-2 justify-center py-4 border-t border-b border-gray-200 dark:border-neutral-800 mt-4">
      <button
        onClick={() => toggle('LIKE')}
        className={`px-5 py-2 rounded border text-sm transition-colors ${
          myType === 'LIKE'
            ? 'bg-blue-50 border-blue-400 text-blue-700 dark:bg-blue-950/40 dark:border-blue-500 dark:text-blue-300'
            : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800'
        }`}
      >
        좋아요 {likeCount}
      </button>
      <button
        onClick={() => toggle('DISLIKE')}
        className={`px-5 py-2 rounded border text-sm transition-colors ${
          myType === 'DISLIKE'
            ? 'bg-red-50 border-red-400 text-red-700 dark:bg-red-950/40 dark:border-red-500 dark:text-red-300'
            : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800'
        }`}
      >
        싫어요 {dislikeCount}
      </button>
    </div>
  )
}
