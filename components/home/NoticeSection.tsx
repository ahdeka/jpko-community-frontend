import Link from 'next/link'
import SectionCard from '@/components/common/SectionCard'
import { noticesApi } from '@/lib/api/notices'

export default async function NoticeSection() {
  const res = await noticesApi.getAll(0, 5).catch(() => null)
  // 중요 공지(featured)는 메인 상단 띠(FeaturedNoticeBar)에서 이미 노출되므로
  // 사이드바 카드에서는 제외해 중복을 피한다.
  const notices = (res?.data?.content ?? []).filter(notice => !notice.featured)

  // 보여줄 일반 공지가 없으면 빈 카드 대신 섹션 자체를 렌더하지 않는다.
  if (notices.length === 0) return null

  return (
    <SectionCard title="공지사항" bulletColor="bg-neutral-500" href="/notices" linkLabel="더보기">
      <ul className="flex flex-col gap-2">
        {notices.map(notice => (
          <li key={notice.id} className="truncate">
            <Link
              href={`/notices/${notice.id}`}
              className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
            >
              {notice.title}
            </Link>
          </li>
        ))}
      </ul>
    </SectionCard>
  )
}
