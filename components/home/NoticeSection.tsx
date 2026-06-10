import SectionCard from '@/components/common/SectionCard'
import { MOCK_NOTICES } from '@/lib/mock-data'

export default function NoticeSection() {
  return (
    <SectionCard title="공지사항" bulletColor="bg-neutral-500">
      <ul className="flex flex-col gap-2">
        {MOCK_NOTICES.map(notice => (
          <li key={notice.id} className="text-sm text-neutral-300 truncate">
            {notice.title}
          </li>
        ))}
      </ul>
    </SectionCard>
  )
}
