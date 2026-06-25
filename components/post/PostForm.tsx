'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { postsApi } from '@/lib/api/posts'
import { ApiError } from '@/lib/api/client'
import { useUnsavedChanges } from '@/lib/use-unsaved-changes'
import TiptapEditor, { MAX_CONTENT_LENGTH } from './TiptapEditor'
import type { Category } from '@/types'

interface Props {
  categories: Category[]
  mode?: 'create' | 'edit'
  postId?: number
  initialCategoryId?: number
  initialTitle?: string
  initialContent?: string
}

// HTML에서 태그를 제거한 순수 텍스트 (빈 본문 판별용)
function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

export default function PostForm({
  categories,
  mode = 'create',
  postId,
  initialCategoryId,
  initialTitle = '',
  initialContent = '',
}: Props) {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  const [categoryId, setCategoryId] = useState<number | ''>(initialCategoryId ?? '')
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [anonymous, setAnonymous] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  // 저장이 끝나면(submitted) 이탈 경고를 해제해, 저장 직후 이동에는 경고가 뜨지 않게 한다.
  const [submitted, setSubmitted] = useState(false)

  // 입력이 초기값과 달라졌으면 "작성 중"으로 보고 이탈 시 경고한다.
  // (단순 비교로 충분 — Tiptap은 실제 편집이 있을 때만 onChange를 발생시키므로
  //  에디터에 포커스만 줬다고 해서 content가 바뀌지는 않는다.)
  const isDirty =
    title !== initialTitle ||
    content !== initialContent ||
    categoryId !== (initialCategoryId ?? '')
  useUnsavedChanges(isDirty && !submitted)

  if (isLoading) return null

  if (!user) {
    return (
      <div className="py-10 text-center text-sm text-gray-500 dark:text-neutral-400">
        <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">로그인</Link>
        {' '}후 글을 작성할 수 있습니다.
      </div>
    )
  }

  // 이미지만 있고 텍스트가 없어도 유효한 본문으로 인정 (백엔드 @NotBlank는 HTML 기준)
  const hasImage = /<img\b/i.test(content)
  const plainText = stripTags(content)
  const contentLength = content.length // 백엔드 @Size가 검사하는 HTML 길이
  const overLimit = contentLength > MAX_CONTENT_LENGTH

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {}
    if (!categoryId) errs.category = '카테고리를 선택해주세요.'
    if (!title.trim()) errs.title = '제목을 입력해주세요.'
    else if (title.length > 100) errs.title = '제목은 100자 이하여야 합니다.'
    if (!plainText && !hasImage) errs.content = '내용을 입력해주세요.'
    else if (overLimit) errs.content = `본문은 ${MAX_CONTENT_LENGTH.toLocaleString()}자 이하여야 합니다.`
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
      const body = {
        categoryId: categoryId as number,
        title: title.trim(),
        content,
      }
      const res =
        mode === 'edit' && postId != null
          ? await postsApi.update(postId, body)
          : await postsApi.create({ ...body, anonymous })

      const id = res.data?.id ?? postId
      setSubmitted(true) // 이탈 경고 해제 후 이동
      router.push(`/posts/${id}`)
      router.refresh()
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        router.push('/login')
      } else if (e instanceof ApiError) {
        setErrors({ form: e.message })
      } else {
        setErrors({ form: '요청에 실패했습니다.' })
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
          className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded px-3 py-2 text-sm outline-none focus:border-blue-400 dark:focus:border-blue-500"
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
          className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded px-3 py-2 text-sm outline-none focus:border-blue-400 dark:focus:border-blue-500"
        />
        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
      </div>

      <div>
        <TiptapEditor content={initialContent} onChange={setContent} />
        <div className="flex items-center justify-between mt-1">
          {errors.content
            ? <p className="text-xs text-red-500">{errors.content}</p>
            : <span />}
          <span className={`text-xs ${overLimit ? 'text-red-500' : 'text-gray-400 dark:text-neutral-500'}`}>
            {contentLength.toLocaleString()} / {MAX_CONTENT_LENGTH.toLocaleString()}
          </span>
        </div>
      </div>

      {errors.form && <p className="text-xs text-red-500">{errors.form}</p>}

      <div className="flex justify-between items-center">
        {mode === 'create' ? (
          <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-neutral-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={e => setAnonymous(e.target.checked)}
              className="w-3 h-3"
            />
            익명
          </label>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={loading || overLimit}
          className="px-6 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '저장 중...' : mode === 'edit' ? '수정' : '등록'}
        </button>
      </div>
    </form>
  )
}
