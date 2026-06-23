import SectionCard from '@/components/common/SectionCard'
import { noticesApi } from '@/lib/api/notices'

export default async function NoticeSection() {
  const res = await noticesApi.getAll(0, 5).catch(() => null)
  // 고정 공지는 페이지 상단 띠(PinnedNoticeBar)에서 이미 노출되므로
  // 여기서는 일반 공지만 보여 중복을 피한다.
  const notices = (res?.data?.content ?? []).filter(notice => !notice.pinned)

  // 보여줄 일반 공지가 없으면 빈 카드 대신 섹션 자체를 렌더하지 않는다.
  if (notices.length === 0) return null

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
