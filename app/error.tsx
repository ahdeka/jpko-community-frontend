'use client'

import { useEffect } from 'react'
import Link from 'next/link'

// 라우트 세그먼트에서 발생한 런타임 에러 바운더리.
// (예: SSR 중 API가 404 외 오류를 throw한 경우 등)
// 루트 레이아웃 안에서 렌더되며, reset()으로 해당 세그먼트 재렌더를 시도할 수 있다.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 운영 단계에서 에러 모니터링 도구로 전송할 수 있는 지점
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-3xl font-extrabold text-orange-500 dark:bg-orange-500/20">
        !
      </p>
      <h1 className="mt-4 text-lg font-bold text-neutral-900 dark:text-neutral-100">
        문제가 발생했습니다
      </h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        일시적인 오류일 수 있습니다. 잠시 후 다시 시도해주세요.
      </p>
      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          홈으로
        </Link>
      </div>
    </div>
  )
}
