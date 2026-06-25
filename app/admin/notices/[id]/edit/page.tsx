import { notFound } from 'next/navigation'
import { noticesApi } from '@/lib/api/notices'
import { ApiError } from '@/lib/api/client'
import NoticeForm from '@/components/admin/NoticeForm'

// 공지 상세 조회는 공개 엔드포인트라 서버에서 prefill 데이터를 받아온다.
// (실제 수정 권한 검증은 NoticeForm 제출 시 백엔드가, 화면 진입은 admin/layout이 막는다)
export default async function EditNoticePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const noticeId = Number(id)
  if (!Number.isFinite(noticeId)) notFound()

  const res = await noticesApi.getById(noticeId).catch((err: unknown) => {
    if (err instanceof ApiError && err.status === 404) notFound()
    throw err
  })

  const notice = res?.data
  if (!notice) notFound()

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">공지사항 수정</h1>
      <NoticeForm
        mode="edit"
        noticeId={notice.id}
        initialTitle={notice.title}
        initialContent={notice.content}
        initialPinned={notice.pinned}
        initialFeatured={notice.featured}
      />
    </div>
  )
}
