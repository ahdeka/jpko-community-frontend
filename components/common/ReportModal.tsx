'use client'

import { useEffect, useRef, useState } from 'react'
import { reportsApi } from '@/lib/api/reports'
import { ApiError } from '@/lib/api/client'
import { REPORT_DETAIL_MAX, REPORT_REASONS, targetTypeLabel } from '@/lib/report'
import type { ReportReason, ReportTargetType } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  targetType: ReportTargetType
  targetId: number
}

// 게시글·댓글 공용 신고 모달.
//
// 백엔드 계약(ReportService.validateReportCreatable)과 맞춘 지점:
//  - ETC 사유는 detail 필수 → 프론트에서 먼저 막고, 백엔드도 REPORT_DETAIL_REQUIRED로 재검증한다.
//  - detail 최대 500자 → maxLength로 물리적으로 막는다(백엔드 @Size(max=500)와 동일 값).
//  - 중복 신고 / 본인 글 신고는 서버만 정확히 판단할 수 있으므로(다른 탭에서 이미 신고한 경우 등)
//    에러 code로 받아 안내한다.
//
// 신고는 되돌릴 수 없다(취소 API가 없고, DB에 UNIQUE(reporter, target)이 걸려 재신고도 불가).
// 그래서 제출 버튼에 확인 단계를 두지 않는 대신, 그 사실을 모달 안에 명시한다.
export default function ReportModal({ open, onClose, targetType, targetId }: Props) {
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [detail, setDetail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  // 접수 완료 화면. 신고 후 목록이 바뀌는 게 없으므로 별도 새로고침 없이 안내만 하고 닫는다.
  const [done, setDone] = useState(false)

  const dialogRef = useRef<HTMLDivElement>(null)
  const detailRef = useRef<HTMLTextAreaElement>(null)

  const label = targetTypeLabel(targetType)

  // 열려 있는 동안: ESC로 닫기 + 배경 스크롤 잠금 + 첫 요소에 포커스.
  // 처리 중(loading)에는 ESC를 막아, 요청이 날아가는 도중 모달이 사라지는 것을 방지한다.
  useEffect(() => {
    if (!open) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // 라디오가 아직 미선택 상태라 개별 input에 포커스를 주면 첫 항목이 선택된 것처럼 보인다.
    // 그래서 컨테이너에 포커스를 줘서 ESC/탭 이동만 가능하게 한다.
    dialogRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, loading, onClose])

  // 닫힐 때 입력을 초기화해, 다음에 열 때(다른 글을 신고할 때) 이전 입력이 남지 않게 한다.
  useEffect(() => {
    if (!open) {
      setReason(null)
      setDetail('')
      setError(null)
      setLoading(false)
      setDone(false)
    }
  }, [open])

  // 'ETC' 외의 사유로 바꾸면 상세 입력은 더 이상 필수가 아니다.
  // 이때 남아 있던 detail 관련 에러 메시지를 지워, 이미 해결된 오류가 계속 보이지 않게 한다.
  useEffect(() => {
    if (reason && reason !== 'ETC') setError(null)
  }, [reason])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setError(null)

    if (!reason) {
      setError('신고 사유를 선택해주세요.')
      return
    }

    const trimmed = detail.trim()
    if (reason === 'ETC' && !trimmed) {
      setError('기타 사유를 선택하셨다면 상세 내용을 입력해주세요.')
      detailRef.current?.focus()
      return
    }

    setLoading(true)
    try {
      await reportsApi.create({
        targetType,
        targetId,
        reason,
        // 공백만 입력한 경우를 걸러 undefined로 보낸다 — 백엔드 detail은 nullable이다.
        detail: trimmed || undefined,
      })
      setDone(true)
    } catch (err) {
      setLoading(false)
      if (err instanceof ApiError) {
        // 서버만 알 수 있는 상태들을 사용자가 이해할 수 있는 문장으로 바꾼다.
        if (err.code === 'REPORT_ALREADY_EXISTS') {
          setError(`이미 신고하신 ${label}입니다. 접수된 신고는 운영진이 확인하고 있습니다.`)
          return
        }
        if (err.code === 'SELF_REPORT_NOT_ALLOWED') {
          setError(`본인이 작성한 ${label}은 신고할 수 없습니다.`)
          return
        }
        if (err.code === 'POST_NOT_FOUND' || err.code === 'COMMENT_NOT_FOUND') {
          setError(`이미 삭제된 ${label}입니다.`)
          return
        }
        // 그 외(REPORT_DETAIL_REQUIRED 등)는 백엔드 메시지가 이미 한국어라 그대로 노출한다.
        setError(err.message)
        return
      }
      setError('신고 접수에 실패했습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => { if (!loading) onClose() }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${label} 신고`}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl outline-none dark:bg-neutral-900"
      >
        {done ? (
          // ===== 접수 완료 화면 =====
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/20">
              <svg className="h-6 w-6 text-green-600 dark:text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">신고가 접수되었습니다</h2>
            <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
              운영진이 확인 후 조치할 예정입니다.<br />
              처리 결과는 마이페이지의 <b className="font-semibold text-neutral-600 dark:text-neutral-300">내 신고</b> 탭에서 확인하실 수 있습니다.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full rounded-lg bg-neutral-800 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-700 dark:hover:bg-neutral-600"
            >
              확인
            </button>
          </div>
        ) : (
          // ===== 신고 폼 =====
          <>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">{label} 신고</h2>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  신고 사유를 선택해주세요. 접수 후에는 취소할 수 없습니다.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                aria-label="닫기"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 disabled:opacity-40 dark:text-neutral-400 dark:hover:bg-neutral-800"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {/* 신고 사유 라디오 그룹 */}
              <fieldset disabled={loading} className="flex flex-col gap-1.5">
                <legend className="sr-only">신고 사유</legend>
                {REPORT_REASONS.map(r => {
                  const selected = reason === r.value
                  return (
                    <label
                      key={r.value}
                      className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors ${
                        selected
                          ? 'border-red-400 bg-red-50/60 dark:border-red-500/50 dark:bg-red-500/10'
                          : 'border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800/60'
                      }`}
                    >
                      <input
                        type="radio"
                        name="report-reason"
                        value={r.value}
                        checked={selected}
                        onChange={() => setReason(r.value)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-red-600"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-neutral-800 dark:text-neutral-100">{r.label}</span>
                        <span className="mt-0.5 block text-xs leading-snug text-neutral-500 dark:text-neutral-400">{r.description}</span>
                      </span>
                    </label>
                  )
                })}
              </fieldset>

              {/* 상세 사유: ETC일 때만 필수. 그 외 사유에서도 보조 설명은 받을 수 있게 항상 노출한다. */}
              <div>
                <label
                  htmlFor="report-detail"
                  className="mb-1 flex items-center justify-between text-xs font-medium text-neutral-600 dark:text-neutral-400"
                >
                  <span>
                    상세 내용
                    {reason === 'ETC' ? (
                      <span className="ml-1 text-red-500">*필수</span>
                    ) : (
                      <span className="ml-1 text-neutral-400">(선택)</span>
                    )}
                  </span>
                  <span className={detail.length >= REPORT_DETAIL_MAX ? 'text-red-500' : 'text-neutral-400'}>
                    {detail.length}/{REPORT_DETAIL_MAX}
                  </span>
                </label>
                <textarea
                  id="report-detail"
                  ref={detailRef}
                  value={detail}
                  onChange={e => setDetail(e.target.value)}
                  // 백엔드 @Size(max = 500)과 동일. 브라우저가 초과 입력 자체를 막아
                  // "쓰고 나서 거절당하는" 경험을 없앤다.
                  maxLength={REPORT_DETAIL_MAX}
                  rows={3}
                  disabled={loading}
                  placeholder={
                    reason === 'ETC'
                      ? '어떤 점이 문제인지 구체적으로 알려주세요.'
                      : '운영진이 판단하는 데 도움이 될 내용을 적어주세요.'
                  }
                  className="w-full resize-none rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-red-400 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-red-500"
                />
              </div>

              {/* 에러: role="alert"로 스크린리더에 즉시 읽히게 한다. */}
              {error && (
                <p role="alert" className="rounded bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-600 dark:bg-red-500/10 dark:text-red-400">
                  {error}
                </p>
              )}

              <p className="text-[11px] leading-relaxed text-neutral-400 dark:text-neutral-500">
                허위 신고가 반복되면 이용에 제한을 받을 수 있습니다.
              </p>

              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 rounded-lg border border-neutral-300 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  취소
                </button>
                <button
                  type="submit"
                  // 사유 미선택 시 비활성화 — 어차피 실패할 요청을 원천 차단한다.
                  disabled={loading || !reason}
                  className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40 dark:bg-red-600 dark:hover:bg-red-500"
                >
                  {loading ? '접수 중…' : '신고하기'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
