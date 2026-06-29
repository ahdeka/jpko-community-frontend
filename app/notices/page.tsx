import type { Metadata } from 'next'
import { noticesApi } from '@/lib/api/notices'
import NoticeList from '@/components/notice/NoticeList'
import Pagination from '@/components/common/Pagination'

export const metadata: Metadata = { title: '공지사항' }

const PAGE_SIZE = 20

// 공지 목록은 로그인 여부와 무관한 공개 페이지이므로 서버 컴포넌트에서
// 바로 fetch한다(게시글 목록과 동일 패턴). 매 요청 최신 목록을 받도록 동적 렌더.
export const revalidate = 0

export default async function NoticesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page } = await searchParams
  const pageNumber = Math.max(0, Number(page) || 0)

  const res = await noticesApi.getAll(pageNumber, PAGE_SIZE).catch(() => null)
  const notices = res?.data?.content ?? []
  const totalPages = res?.data?.totalPages ?? 0

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
        <h1 className="text-xl font-bold">공지사항</h1>
      </div>

      <NoticeList notices={notices} />
      <Pagination currentPage={pageNumber} totalPages={totalPages} basePath="/notices" />
    </div>
  )
}
