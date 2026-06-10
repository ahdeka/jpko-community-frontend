'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { postsApi } from '@/lib/api/posts'
import { ApiError } from '@/lib/api/client'
import type { Category } from '@/types'

interface Props {
  categories: Category[]
}

export default function PostForm({ categories }: Props) {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  if (isLoading) return null

  if (!user) {
    return (
      <div className="py-10 text-center text-sm text-gray-500">
        <Link href="/login" className="text-blue-600 hover:underline">로그인</Link>
        {' '}후 글을 작성할 수 있습니다.
      </div>
    )
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {}
    if (!categoryId) errs.category = '카테고리를 선택해주세요.'
    if (!title.trim()) errs.title = '제목을 입력해주세요.'
    else if (title.length > 100) errs.title = '제목은 100자 이하여야 합니다.'
    if (!content.trim()) errs.content = '내용을 입력해주세요.'
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setLoading(true)

    try {
      const res = await postsApi.create({
        categoryId: categoryId as number,
        title: title.trim(),
        content: content.trim(),
        anonymous,
      })
      router.push(`/posts/${res.data!.id}`)
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        router.push('/login')
      } else if (e instanceof ApiError) {
        setErrors({ form: e.message })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <select
          value={categoryId}
          onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : '')}
          className="w-full border rounded px-3 py-2 text-sm outline-none focus:border-blue-400"
        >
          <option value="">카테고리 선택</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
      </div>

      <div>
        <input
          type="text"
          placeholder="제목"
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={100}
          className="w-full border rounded px-3 py-2 text-sm outline-none focus:border-blue-400"
        />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
      </div>

      <div>
        <textarea
          placeholder="내용을 입력하세요."
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={12}
          className="w-full border rounded px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"
        />
        {errors.content && <p className="text-xs text-red-500 mt-1">{errors.content}</p>}
      </div>

      {errors.form && <p className="text-xs text-red-500">{errors.form}</p>}

      <div className="flex justify-between items-center">
        <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={e => setAnonymous(e.target.checked)}
            className="w-3 h-3"
          />
          익명
        </label>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '등록 중...' : '등록'}
        </button>
      </div>
    </form>
  )
}
