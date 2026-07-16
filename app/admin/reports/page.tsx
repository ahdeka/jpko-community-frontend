'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { adminReportsApi } from '@/lib/api/reports'
import { postsApi } from '@/lib/api/posts'
import { commentsApi } from '@/lib/api/comments'
import { ApiError } from '@/lib/api/client'
import { formatDateTime } from '@/lib/format'
import {
  REPORT_STATUSES,
  reasonMeta,
  reportTargetHref,
  statusMeta,
  targetTypeLabel,
} from '@/lib/report'
import type {
  AdminReportDetail,
  AdminReportSummary,
  ReportStatus,
  ReportTargetType,
} from '@/types'

const PAGE_SIZE = 20

// 신고는 "대상별"로 묶여 오므로(같은 글에 여러 신고), 행을 식별하는 키도 대상 기준이다.
// targetId만으로는 게시글 1번과 댓글 1번이 충돌하므로 타입까지 합쳐 쓴다.
const targetKey = (targetType: ReportTargetType, targetId: number) => `${targetType}:${targetId}`

// 관리자 신고 처리 페이지.
//
// 백엔드 동작을 이해해야 이 화면이 읽힌다:
//  - 목록은 신고 "건"이 아니라 신고 "대상"별 집계다. reportCount는 그 대상에 쌓인 신고 수.
//  - 조치 = 대상 삭제. 삭제하면 백엔드가 ContentDeletedEvent로 그 대상의 PENDING 신고를
//    전부 RESOLVED로 자동 전환하고, 작성자에게 CONTENT_REMOVED 알림을 보낸다.
//    그래서 이 화면에 "조치 완료" 버튼은 없다 — 삭제가 곧 조치다.
//  - 반려(REJECTED)는 대상을 그대로 두고 신고만 기각하는 것이며, 되돌릴 수 없다
//    (백엔드가 PENDING인 신고만 상태를 바꾸므로 REJECTED → 다른 상태 전환이 불가능).
export default function AdminReportsPage() {
  const [reports, setReports] = useState<AdminReportSummary[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 필터. undefined = 전체(백엔드에 파라미터를 아예 보내지 않음).
  const [targetType, setTargetType] = useState<ReportTargetType | undefined>(undefined)
  const [status, setStatus] = useState<ReportStatus | undefined>('PENDING')

  // 펼쳐진 행의 키. 한 번에 하나만 펼친다.
  const [expanded, setExpanded] = useState<string | null>(null)
  // 펼친 행의 신고 상세 목록. 키별로 캐싱해 다시 펼칠 때 재요청하지 않는다.
  const [details, setDetails] = useState<Record<string, AdminReportDetail[]>>({})
  const [detailLoading, setDetailLoading] = useState(false)

  // 처리 중인 행 키. 해당 행의 버튼만 비활성화한다.
  const [pendingKey, setPendingKey] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    adminReportsApi
      .getSummaries({ targetType, status }, page, PAGE_SIZE)
      .then(res => {
        setReports(res.data?.content ?? [])
        setTotalPages(res.data?.totalPages ?? 0)
        setTotalElements(res.data?.totalElements ?? 0)
      })
      .catch((e: unknown) =>
        setError(e instanceof ApiError ? e.message : '신고 목록을 불러오지 못했습니다.'),
      )
      .finally(() => setLoading(false))
  }, [targetType, status, page])

  useEffect(load, [load])

  // 필터가 바뀌면 항상 첫 페이지부터 다시 본다. 펼침·상세 캐시도 비운다 —
  // 조치 후 상태가 달라졌을 수 있어 낡은 상세를 보여주면 안 된다.
  function changeFilter(next: { targetType?: ReportTargetType; status?: ReportStatus }) {
    setPage(0)
    setExpanded(null)
    setDetails({})
    if ('targetType' in next) setTargetType(next.targetType)
    if ('status' in next) setStatus(next.status)
  }

  // 행 펼치기 → 그 대상의 신고 건별 상세를 조회한다(캐시가 있으면 재사용).
  async function toggleExpand(report: AdminReportSummary) {
    const key = targetKey(report.targetType, report.targetId)
    if (expanded === key) {
      setExpanded(null)
      return
    }
    setExpanded(key)

    if (details[key]) return

    setDetailLoading(true)
    try {
      const res = await adminReportsApi.getDetails(report.targetType, report.targetId)
      setDetails(prev => ({ ...prev, [key]: res.data ?? [] }))
    } catch (e) {
      // 상세 조회 실패는 목록 전체를 망가뜨리지 않고 해당 행에만 알린다.
      alert(e instanceof ApiError ? e.message : '신고 상세를 불러오지 못했습니다.')
      setExpanded(null)
    } finally {
      setDetailLoading(false)
    }
  }

  // 대상 삭제 = 조치 완료. 작성자에게 알림이 나가고 신고가 자동 RESOLVED된다.
  async function handleDelete(report: AdminReportSummary) {
    const label = targetTypeLabel(report.targetType)
    const message =
      `이 ${label}을(를) 삭제할까요?\n\n` +
      `· 작성자(${report.targetAuthor})에게 삭제 알림이 전송됩니다.\n` +
      `· 이 대상에 접수된 신고 ${report.reportCount}건이 '조치 완료'로 처리됩니다.`
    if (!confirm(message)) return

    const key = targetKey(report.targetType, report.targetId)
    setPendingKey(key)
    try {
      if (report.targetType === 'POST') {
        await postsApi.delete(report.targetId)
      } else {
        await commentsApi.delete(report.targetId)
      }
      // 삭제 성공 → 상태·미리보기가 모두 바뀌므로 서버 기준으로 다시 읽는다.
      // (백엔드의 신고 자동 처리는 삭제 트랜잭션 커밋 직후 동기로 실행되므로,
      //  이 시점에 재조회하면 이미 RESOLVED가 반영돼 있다.)
      setDetails(prev => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      setExpanded(null)
      load()
    } catch (e) {
      alert(e instanceof ApiError ? e.message : '삭제에 실패했습니다.')
    } finally {
      setPendingKey(null)
    }
  }

  // 반려 = 대상은 두고 신고만 기각. 되돌릴 수 없으므로 확인을 받는다.
  async function handleReject(report: AdminReportSummary) {
    const message =
      `이 신고를 반려할까요?\n\n` +
      `· 대상은 삭제되지 않고 그대로 유지됩니다.\n` +
      `· 반려한 신고는 다시 되돌릴 수 없습니다.`
    if (!confirm(message)) return

    const key = targetKey(report.targetType, report.targetId)
    setPendingKey(key)
    try {
      await adminReportsApi.updateTargetStatus(report.targetType, report.targetId, 'REJECTED')
      setDetails(prev => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      setExpanded(null)
      load()
    } catch (e) {
      alert(e instanceof ApiError ? e.message : '반려 처리에 실패했습니다.')
    } finally {
      setPendingKey(null)
    }
  }

  // 필터 select 공통 스타일. 회원 관리 페이지의 등급 select와 동일한 톤을 쓴다.
  const filterSelect =
    'rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-700 outline-none focus:border-orange-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:focus:border-orange-500'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">
          신고 관리
          {!loading && !error && (
            <span className="ml-2 text-sm font-normal text-neutral-400">
              {totalElements.toLocaleString()}건
            </span>
          )}
        </h1>

        {/*
          필터. 버튼 나열은 라벨과 값이 뒤섞여 읽기 어려워서 드롭다운으로 둔다.
          선택하지 않은 상태('')는 undefined로 바꿔 백엔드에 파라미터를 아예 보내지 않는다(=전체).
        */}
        <div className="flex items-center gap-2">
          <select
            aria-label="처리 상태 필터"
            className={filterSelect}
            value={status ?? ''}
            onChange={e => changeFilter({ status: (e.target.value || undefined) as ReportStatus | undefined })}
          >
            <option value="">모든 상태</option>
            {REPORT_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <select
            aria-label="신고 종류 필터"
            className={filterSelect}
            value={targetType ?? ''}
            onChange={e => changeFilter({ targetType: (e.target.value || undefined) as ReportTargetType | undefined })}
          >
            <option value="">모든 종류</option>
            <option value="POST">게시글</option>
            <option value="COMMENT">댓글</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-neutral-400">불러오는 중…</p>
      ) : error ? (
        <p className="py-12 text-center text-sm text-red-500">{error}</p>
      ) : reports.length === 0 ? (
        <p className="py-12 text-center text-sm text-neutral-400">
          {status === 'PENDING' ? '처리할 신고가 없습니다.' : '해당하는 신고가 없습니다.'}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {reports.map(report => {
            const key = targetKey(report.targetType, report.targetId)
            const isExpanded = expanded === key
            const busy = pendingKey === key
            const sMeta = statusMeta(report.status)
            const href = reportTargetHref(report.targetType, report.postId, report.targetDeleted)
            // 이미 처리된 신고(조치 완료/반려)는 다시 조치할 수 없다.
            // RESOLVED는 대상이 이미 삭제된 상태이고, REJECTED는 백엔드가 PENDING만 갱신하므로
            // 버튼을 눌러도 아무 일이 일어나지 않는다 → 아예 감춘다.
            const actionable = report.status === 'PENDING'
            // 대상이 이미 사라졌는데 아직 처리 대기인 경우가 있다. 대표적으로
            // "게시글이 삭제된 글에 달렸던 댓글" 신고다 — 게시글 삭제는 그 글의 댓글 신고까지
            // 자동 정리해주지 않아 PENDING으로 남는다.
            // 이때 삭제 버튼은 의미가 없다(이미 아무도 볼 수 없다). 반려만 남긴다.
            const alreadyGone = report.targetDeleted

            return (
              <li key={key} className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
                <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-3">
                  {/* 종류 + 상태 */}
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                      {targetTypeLabel(report.targetType)}
                    </span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${sMeta.badge}`}>
                      {sMeta.label}
                    </span>
                    {/* 대상이 이미 사라졌음을 알린다 — 링크가 없는 이유이기도 하다. */}
                    {alreadyGone && (
                      <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500">
                        삭제됨
                      </span>
                    )}
                  </div>

                  {/* 대상 미리보기 + 작성자. 원문이 남아 있으면 링크, 아니면 그냥 텍스트. */}
                  <div className="min-w-0 flex-1">
                    {href ? (
                      <Link
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate text-sm text-neutral-800 hover:underline dark:text-neutral-100"
                        title={report.targetPreview}
                      >
                        {report.targetPreview}
                      </Link>
                    ) : (
                      <p className="truncate text-sm text-neutral-400 dark:text-neutral-500" title={report.targetPreview}>
                        {report.targetPreview}
                      </p>
                    )}
                    <p className="mt-0.5 text-[11px] text-neutral-400">
                      작성자 {report.targetAuthor} · 최근 신고 {formatDateTime(report.lastReportedAt)}
                    </p>
                  </div>

                  {/* 신고 건수 + 상세 토글.
                      상태 필터가 걸리면 백엔드가 그 상태의 신고만 남긴 뒤 COUNT하므로 건수의 의미가
                      "전체"에서 "그 상태의 건수"로 바뀐다. 화면에 상시 안내를 두면 시끄러워서
                      숫자에 마우스를 올렸을 때만 알려준다. */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(report)}
                    aria-expanded={isExpanded}
                    title={
                      status
                        ? `'${statusMeta(status).label}' 상태인 신고 ${report.reportCount}건 (필터 기준)`
                        : `접수된 신고 ${report.reportCount}건`
                    }
                    className="flex shrink-0 items-center gap-1 self-start rounded px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 sm:self-auto"
                  >
                    <span className="font-semibold text-red-500">{report.reportCount}</span>건
                    <svg
                      className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {/* 조치 버튼 */}
                  {actionable && (
                    <div className="flex shrink-0 gap-1.5 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleReject(report)}
                        disabled={busy}
                        className="rounded border border-neutral-300 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      >
                        반려
                      </button>
                      {/* 이미 삭제된 대상에는 삭제 버튼을 두지 않는다(위 alreadyGone 주석 참고). */}
                      {!alreadyGone && (
                        <button
                          type="button"
                          onClick={() => handleDelete(report)}
                          disabled={busy}
                          className="rounded border border-red-200 px-2 py-1 text-xs text-red-500 hover:bg-red-50 disabled:opacity-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
                        >
                          {busy ? '처리 중…' : '삭제'}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* 펼침: 신고 건별 상세 */}
                {isExpanded && (
                  <div className="border-t border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-800/40">
                    {detailLoading && !details[key] ? (
                      <p className="py-3 text-center text-xs text-neutral-400">불러오는 중…</p>
                    ) : (
                      <ul className="divide-y divide-neutral-200 dark:divide-neutral-700/60">
                        {(details[key] ?? []).map(d => (
                          <li key={d.id} className="flex flex-col gap-0.5 py-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                                {d.reporterNickname}
                              </span>
                              <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
                                {reasonMeta(d.reason).label}
                              </span>
                              <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${statusMeta(d.status).badge}`}>
                                {statusMeta(d.status).label}
                              </span>
                              <span className="ml-auto text-[10px] text-neutral-400">
                                {formatDateTime(d.createdAt)}
                              </span>
                            </div>
                            {/* 신고자가 직접 쓴 내용이라 줄바꿈을 보존한다.
                                (텍스트 노드로 렌더되므로 HTML이 실행될 위험은 없다.) */}
                            {d.detail && (
                              <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
                                {d.detail}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => { setExpanded(null); setPage(p => Math.max(0, p - 1)) }}
            className="rounded px-3 py-1 text-neutral-500 hover:bg-neutral-100 disabled:opacity-40 dark:hover:bg-neutral-800"
          >
            이전
          </button>
          <span className="text-xs text-neutral-400">{page + 1} / {totalPages}</span>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => { setExpanded(null); setPage(p => Math.min(totalPages - 1, p + 1)) }}
            className="rounded px-3 py-1 text-neutral-500 hover:bg-neutral-100 disabled:opacity-40 dark:hover:bg-neutral-800"
          >
            다음
          </button>
        </div>
      )}
    </div>
  )
}
