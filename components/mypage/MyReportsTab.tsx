'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { reportsApi } from '@/lib/api/reports'
import { ApiError } from '@/lib/api/client'
import { formatRelativeTime } from '@/lib/format'
import { reasonMeta, reportTargetHref, statusMeta, targetTypeLabel } from '@/lib/report'
import type { MyReport } from '@/types'

const PAGE_SIZE = 10

// 내가 접수한 신고 목록 탭.
// 신고는 취소할 수 없으므로 이 화면은 조회 전용이며, 처리 상태 확인이 유일한 목적이다.
export default function MyReportsTab() {
  const [reports, setReports] = useState<MyReport[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    reportsApi
      .getMyReports(page, PAGE_SIZE)
      .then(res => {
        if (cancelled) return
        setReports(res.data?.content ?? [])
        setTotalPages(res.data?.totalPages ?? 0)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof ApiError ? e.message : '신고 내역을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page])

  if (loading) {
    return <p className="py-12 text-center text-sm text-neutral-400">불러오는 중…</p>
  }

  if (error) {
    return <p className="py-12 text-center text-sm text-red-500">{error}</p>
  }

  if (reports.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-neutral-400 dark:text-neutral-500">
        접수한 신고가 없습니다.
      </div>
    )
  }

  return (
    <div>
      <ul className="divide-y divide-neutral-100 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {reports.map(report => {
          const sMeta = statusMeta(report.status)
          const href = reportTargetHref(report.targetType, report.postId, report.targetDeleted)

          // 신고 대상 미리보기. 원문이 살아 있으면 링크로, 삭제됐으면 일반 텍스트로 렌더한다
          // — 없는 글로 보내면 404가 된다. 삭제된 경우 targetPreview 자체가 백엔드에서
          // "삭제된 게시글입니다." 같은 안내 문구로 바뀌어 오므로 별도 문구를 만들 필요는 없다.
          const preview = (
            <p className="line-clamp-2 text-sm text-neutral-800 dark:text-neutral-100">
              {report.targetPreview}
            </p>
          )

          return (
            <li key={report.id} className="px-1 py-3">
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                  {targetTypeLabel(report.targetType)}
                </span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${sMeta.badge}`}>
                  {sMeta.label}
                </span>
                <span className="text-[11px] text-neutral-400">{reasonMeta(report.reason).label}</span>
                <span className="ml-auto text-[11px] text-neutral-400">
                  {formatRelativeTime(report.createdAt)}
                </span>
              </div>

              {href ? (
                <Link href={href} className="block rounded hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  {preview}
                </Link>
              ) : (
                <div className="opacity-60">{preview}</div>
              )}

              {/* 내가 적어 보낸 상세 사유 — 무엇을 신고했는지 기억을 되살려 준다. */}
              {report.detail && (
                <p className="mt-1 line-clamp-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                  “{report.detail}”
                </p>
              )}

              {/* 처리 결과 안내: 상태만 보여주면 무슨 뜻인지 모르므로 한 줄로 풀어 준다. */}
              {report.status === 'RESOLVED' && (
                <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                  운영진이 확인 후 조치를 완료했습니다.
                </p>
              )}
              {report.status === 'REJECTED' && (
                <p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500">
                  운영진 검토 결과, 조치가 필요하지 않다고 판단되었습니다.
                </p>
              )}
            </li>
          )
        })}
      </ul>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage(p => Math.max(0, p - 1))}
            className="rounded px-3 py-1 text-neutral-500 hover:bg-neutral-100 disabled:opacity-40 dark:hover:bg-neutral-800"
          >
            이전
          </button>
          <span className="text-xs text-neutral-400">{page + 1} / {totalPages}</span>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            className="rounded px-3 py-1 text-neutral-500 hover:bg-neutral-100 disabled:opacity-40 dark:hover:bg-neutral-800"
          >
            다음
          </button>
        </div>
      )}
    </div>
  )
}
