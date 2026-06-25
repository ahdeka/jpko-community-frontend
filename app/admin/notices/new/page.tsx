import NoticeForm from '@/components/admin/NoticeForm'

// 접근 제어는 상위 app/admin/layout.tsx의 AdminGuard가 담당한다.
export default function NewNoticePage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">공지사항 작성</h1>
      <NoticeForm mode="create" />
    </div>
  )
}
