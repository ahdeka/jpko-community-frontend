import { notFound } from 'next/navigation'
import { noticesApi } from '@/lib/api/notices'
import { ApiError } from '@/lib/api/client'
import NoticeDetail from '@/components/notice/NoticeDetail'

export default async function NoticePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const noticeId = Number(id)

  // 잘못된 경로(/notices/abc)로 들어오면 404
  if (!Number.isFinite(noticeId)) notFound()

  const res = await noticesApi.getById(noticeId).catch((err: unknown) => {
    if (err instanceof ApiError && err.status === 404) notFound()
    throw err
  })

  const notice = res?.data
  if (!notice) notFound()

  return <NoticeDetail notice={notice} />
}
