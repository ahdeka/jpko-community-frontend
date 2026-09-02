'use client'

import { useEffect, useState } from 'react'
import { ApiError } from '@/lib/api/client'
import { formatSuspendDuration } from '@/lib/format'
import { MESSAGES } from '@/lib/messages'

const T = MESSAGES.admin.users.suspendModal

// 정지 기한 선택지(분). 예전에는 ROOT가 /admin/settings/suspend-presets에서 구성한 값을
// 서버에서 받아왔지만, 그 설정 화면과 API가 함께 제거되어 프론트 상수로 되돌렸다.
//
// ⚠️ 백엔드는 ADMIN이 거는 정지를 최대 7일(UserService.MAX_ADMIN_SUSPEND_DAYS)로 제한하고,
//    "now + 7일"을 서버 시각 기준으로 비교한다. 마지막 7일 선택지는 그 경계에 정확히 걸리므로,
//    관리자 PC 시계가 서버보다 앞서 있으면 SUSPEND_DURATION_TOO_LONG이 날 수 있다.
//    그 경우 아래 errorCodeMessages가 사유를 그대로 보여주고, 더 짧은 기한을 고르면 된다.
const DURATION_PRESETS_MINUTES = [60, 360, 720, 1440, 4320, 10080]

interface Props {
  open: boolean
  onClose: () => void
  targetNickname: string
  // ADMIN이 정지하는 경우: 기한 선택이 필수이고 "무기한" 옵션이 없다.
  // ROOT: 기본이 무기한이고, 원하면 기한을 선택적으로 걸 수 있다 — 진짜 관리자는 ROOT뿐이라는 원칙.
  actingIsAdmin: boolean
  // 실제 API 호출은 호출부(AdminUsersPage/AdminReportsPage)가 담당한다 — 정지 후 후속 처리
  // (신고 자동 처리 등)가 화면마다 달라서, 이 모달은 순수 표시/입력만 맡는다.
  onConfirm: (suspendedUntil?: string) => Promise<void>
}

// 정지 기한 선택 모달. 오버레이 클릭/ESC로 닫히고, 열려 있는 동안 배경 스크롤을 잠근다.
export default function SuspendUserModal({ open, onClose, targetNickname, actingIsAdmin, onConfirm }: Props) {
  // null = 무기한. ADMIN은 기한이 필수라 열릴 때 가장 짧은 기한을 기본값으로 잡아준다.
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

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, confirming, onClose])

  // 닫힐 때 입력 상태를 초기화해, 다음에 다른 대상으로 열어도 이전 선택이 남지 않게 한다.
  // 여는 쪽에서는 ADMIN 기본값(가장 짧은 기한)을 세팅한다 — ADMIN은 무기한을 고를 수 없기 때문.
  useEffect(() => {
    if (open) {
      setSelectedMinutes(actingIsAdmin ? DURATION_PRESETS_MINUTES[0] : null)
    } else {
      setSelectedMinutes(null)
      setConfirming(false)
      setError(null)
    }
  }, [open, actingIsAdmin])

  if (!open) return null

  async function handleConfirm() {
    if (confirming) return
    setError(null)
    setConfirming(true)
    try {
      // 백엔드는 LocalDateTime으로 받지만 JacksonConfig가 KST 기준으로 역직렬화하므로,
      // 표준 ISO(UTC "Z") 문자열을 그대로 보내면 된다.
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

        <div className="mb-4 flex flex-wrap gap-2">
          {DURATION_PRESETS_MINUTES.map(minutes => (
            <button
              key={minutes}
              type="button"
              onClick={() => setSelectedMinutes(minutes)}
              disabled={confirming}
              className={presetButtonClass(selectedMinutes === minutes)}
            >
              {formatSuspendDuration(minutes)}
            </button>
          ))}
          {/* 무기한은 ROOT만 고를 수 있다 — ADMIN이 보내면 백엔드가 SUSPEND_DURATION_REQUIRED로 거부한다. */}
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
