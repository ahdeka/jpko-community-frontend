'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { postsApi } from '@/lib/api/posts'
import { ApiError } from '@/lib/api/client'

interface Props {
  postId: number
}

export default function DeletePostButton({ postId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('게시글을 삭제하시겠습니까?')) return

    setLoading(true)
    try {
      await postsApi.delete(postId)
      router.push('/')
      router.refresh()
    } catch (e) {
      if (e instanceof ApiError) alert(e.message)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs text-gray-400 hover:text-red-500 disabled:opacity-50"
    >
      {loading ? '삭제 중...' : '삭제'}
    </button>
  )
}
