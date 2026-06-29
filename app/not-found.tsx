import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: '페이지를 찾을 수 없습니다' }

// 404 페이지. notFound() 호출 또는 매칭되지 않는 경로에서 표시된다.
// 루트 레이아웃(헤더/카드) 안에서 렌더되므로 본문 영역만 구성한다.
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-6xl font-extrabold text-orange-500">404</p>
      <h1 className="mt-4 text-lg font-bold text-neutral-900 dark:text-neutral-100">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        요청하신 페이지가 없거나 이동·삭제되었을 수 있습니다.
      </p>
      <div className="mt-6 flex gap-2">
        <Link
          href="/"
          className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          홈으로
        </Link>
        <Link
          href="/posts"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          전체 글 보기
        </Link>
      </div>
    </div>
  )
}
