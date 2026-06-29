'use client'

import { useEffect } from 'react'
import './globals.css'

// 루트 레이아웃 자체에서 에러가 났을 때의 최후 방어선.
// 이 컴포넌트는 레이아웃을 대체하므로 자체 <html>/<body>를 직접 렌더해야 한다.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="ko">
      <body className="bg-neutral-100 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
          <p className="text-2xl font-extrabold text-orange-500">JPKO</p>
          <h1 className="mt-4 text-lg font-bold">일시적인 오류가 발생했습니다</h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            잠시 후 다시 시도해주세요. 문제가 계속되면 잠시 뒤 다시 방문해주세요.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  )
}
