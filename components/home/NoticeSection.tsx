import SectionCard from '@/components/common/SectionCard'
import { noticesApi } from '@/lib/api/notices'

export default async function NoticeSection() {
  const res = await noticesApi.getAll(0, 5).catch(() => null)
  const notices = res?.data?.content ?? []

  return (
    <SectionCard title="공지사항" bulletColor="bg-neutral-500">
      <ul className="flex flex-col gap-2">
        {notices.map(notice => (
          <li key={notice.id} className="text-sm text-neutral-600 dark:text-neutral-300 truncate">
            {notice.title}
          </li>
        ))}
      </ul>
    </SectionCard>
  )
}
