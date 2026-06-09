'use client'

import { useState, useEffect } from 'react'
import { likesApi } from '@/lib/api/likes'
import { ApiError } from '@/lib/api/client'

interface Props {
  postId: number
  initialLikeCount: number
  initialDislikeCount: number
}

export default function LikeButtons({ postId, initialLikeCount, initialDislikeCount }: Props) {
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
    try {
      const res = await likesApi.toggle(postId, type)
      if (!res.data) return
      setLikeCount(res.data.likeCount)
      setDislikeCount(res.data.dislikeCount)
      setMyType(res.data.myType)
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        // 로그인 필요 — 추후 로그인 페이지 연동 시 처리
      }
    }
  }

  return (
    <div className="flex gap-2 justify-center py-4 border-t border-b mt-4">
      <button
        onClick={() => toggle('LIKE')}
        className={`px-5 py-2 rounded border text-sm transition-colors ${
          myType === 'LIKE'
            ? 'bg-blue-50 border-blue-400 text-blue-700'
            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
        }`}
      >
        좋아요 {likeCount}
      </button>
      <button
        onClick={() => toggle('DISLIKE')}
        className={`px-5 py-2 rounded border text-sm transition-colors ${
          myType === 'DISLIKE'
            ? 'bg-red-50 border-red-400 text-red-700'
            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
        }`}
      >
        싫어요 {dislikeCount}
      </button>
    </div>
  )
}
