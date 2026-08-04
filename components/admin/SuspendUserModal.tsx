'use client'

import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api/admin'
import { ApiError } from '@/lib/api/client'
import { formatSuspendDuration } from '@/lib/format'
import { MESSAGES } from '@/lib/messages'
import type { SuspendDurationPreset } from '@/types'

const T = MESSAGES.admin.users.suspendModal

interface Props {
  open: boolean
  onClose: () => void
  targetNickname: string
  // ADMIN이 정지하는 경우: 기한 선택이 필수이고 "무기한" 옵션이 없다(경매로 얻었든 수동 임명이든 동일).
  // ROOT: 기본이 무기한이고, 원하면 기한을 선택적으로 걸 수 있다 — 진짜 관리자는 ROOT뿐이라는 원칙.
  actingIsAdmin: boolean
  // 실제 API 호출은 호출부(AdminUsersPage/AdminReportsPage)가 담당한다 — 정지 후 후속 처리
  // (신고 자동 처리 등)가 화면마다 달라서, 이 모달은 순수 표시/입력만 맡는다.
  onConfirm: (suspendedUntil?: string) => Promise<void>
}

// 정지 기한 선택 모달. TransferPointsModal과 동일한 구조(오버레이/ESC/스크롤 잠금)를 따른다.
//
// 정지 기한 프리셋 버튼 목록은 더 이상 하드코딩이 아니라 ROOT가 /admin/settings/suspend-presets에서
// 구성한 값을 그대로 불러온다(GET /api/admin/settings/suspend-presets — 조회는 ADMIN도 가능).
export default function SuspendUserModal({ open, onClose, targetNickname, actingIsAdmin, onConfirm }: Props) {
  const [presets, setPresets] = useState<SuspendDurationPreset[] | null>(null)
  const [presetsError, setPresetsError] = useState<string | null>(null)
  const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !confirming) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    adminApi.getSuspendPresets()
      .then(res => {
        const list = res.data ?? []
        setPresets(list)
        // ADMIN은 기한 선택이 필수라 첫 프리셋을 기본으로 선택해둔다. ROOT는 무기한이 기본이다.
        if (actingIsAdmin) setSelectedMinutes(list[0]?.minutes ?? null)
      })
      .catch((e: unknown) => setPresetsError(e instanceof ApiError ? e.message : T.presetsLoadFailed))

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, confirming, onClose, actingIsAdmin])

  useEffect(() => {
    if (!open) {
      setPresets(null)
      setPresetsError(null)
      setSelectedMinutes(null)
      setConfirming(false)
      setError(null)
    }
  }, [open])

  if (!open) return null

  async function handleConfirm() {
    if (confirming) return
    setError(null)
    setConfirming(true)
    try {
      const suspendedUntil = selectedMinutes != null
        ? new Date(Date.now() + selectedMinutes * 60_000).toISOString()
        : undefined
      await onConfirm(suspendedUntil)
      onClose()
    } catch (err) {
      const code = err instanceof ApiError ? err.code : undefined
      setError((code && MESSAGES.admin.users.errorCodeMessages[code]) || (err instanceof ApiError ? err.message : MESSAGES.admin.users.statusChangeFailed))
    } finally {
      setConfirming(false)
    }
  }

  const presetButtonClass = (active: boolean) =>
    `rounded-md border px-3 py-1.5 text-xs font-medium ${
      active
        ? 'border-red-500 bg-red-50 text-red-600 dark:border-red-500 dark:bg-red-500/10 dark:text-red-400'
        : 'border-neutral-300 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'
    }`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => { if (!confirming) onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={T.title}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900"
      >
        <h2 className="mb-1 text-base font-bold text-neutral-900 dark:text-neutral-100">{T.title}</h2>
        <p className="mb-4 text-xs text-neutral-500 dark:text-neutral-400">{targetNickname}</p>

        <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          {actingIsAdmin ? T.durationRequiredNotice : T.durationOptionalNotice}
        </p>

        <p className="mb-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">{T.presetLabel}</p>

        {presetsError && <p className="mb-3 text-xs text-red-500">{presetsError}</p>}

        {!presetsError && presets === null && (
          <p className="mb-4 text-xs text-neutral-400">불러오는 중…</p>
        )}

        {presets !== null && (
          <div className="mb-4 flex flex-wrap gap-2">
            {presets.map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedMinutes(preset.minutes)}
                disabled={confirming}
                className={presetButtonClass(selectedMinutes === preset.minutes)}
              >
                {formatSuspendDuration(preset.minutes)}
              </button>
            ))}
            {!actingIsAdmin && (
              <button
                type="button"
                onClick={() => setSelectedMinutes(null)}
                disabled={confirming}
                className={presetButtonClass(selectedMinutes === null)}
              >
                {T.indefinite}
              </button>
            )}
          </div>
        )}

        {error && <p className="mb-3 text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={confirming}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirming || (actingIsAdmin && selectedMinutes == null)}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {confirming ? T.confirming : T.confirm}
          </button>
        </div>
      </div>
    </div>
  )
}
