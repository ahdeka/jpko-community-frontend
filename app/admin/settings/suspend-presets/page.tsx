'use client'

import { useCallback, useEffect, useState } from 'react'
import { adminApi } from '@/lib/api/admin'
import { ApiError } from '@/lib/api/client'
import { useAuth } from '@/lib/auth-context'
import { isRoot } from '@/lib/role'
import { MESSAGES } from '@/lib/messages'
import type { SuspendDurationPreset } from '@/types'

const T = MESSAGES.admin.suspendPresets

// 정지 기한 프리셋 관리. ROOT 전용 — SuspendUserModal이 보여줄 버튼 목록(이름 + 기한(분))을
// ROOT가 직접 구성한다(추가/삭제만 지원 — 수정은 삭제 후 재생성으로 충분하다, 과거 정지 기록을
// 참조하는 값이 아니라 단순 프리셋이라 이력 보존이 필요 없다).
export default function AdminSuspendPresetsPage() {
  const { user } = useAuth()
  const [presets, setPresets] = useState<SuspendDurationPreset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<number | null>(null)

  const [label, setLabel] = useState('')
  const [minutes, setMinutes] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    adminApi.getSuspendPresets()
      .then(res => setPresets(res.data ?? []))
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : T.loadFailed))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  if (!user || !isRoot(user.role)) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">접근 권한이 없습니다.</p>
        <p className="mt-1 text-xs text-neutral-400">ROOT 전용 페이지입니다.</p>
      </div>
    )
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (adding) return
    if (!label.trim()) {
      setAddError('이름을 입력해주세요.')
      return
    }
    const parsedMinutes = Number(minutes)
    if (!minutes || !Number.isInteger(parsedMinutes) || parsedMinutes <= 0) {
      setAddError('기한(분)을 입력해주세요.')
      return
    }

    setAddError(null)
    setAdding(true)
    try {
      await adminApi.createSuspendPreset({
        label: label.trim(),
        minutes: parsedMinutes,
        displayOrder: (presets[presets.length - 1]?.displayOrder ?? 0) + 1,
      })
      setLabel('')
      setMinutes('')
      load()
    } catch (err) {
      setAddError(err instanceof ApiError ? err.message : T.addFailed)
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(preset: SuspendDurationPreset) {
    if (!confirm(T.deleteConfirm(preset.label))) return
    setPendingId(preset.id)
    try {
      await adminApi.deleteSuspendPreset(preset.id)
      setPresets(prev => prev.filter(p => p.id !== preset.id))
    } catch (err) {
      alert(err instanceof ApiError ? err.message : T.deleteFailed)
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">{T.title}</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{T.description}</p>
      </div>

      <form onSubmit={handleAdd} className="flex flex-wrap items-start gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <input
          type="text"
          placeholder={T.labelPlaceholder}
          value={label}
          onChange={e => setLabel(e.target.value)}
          className="min-w-[160px] flex-1 rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <input
          type="number"
          min={1}
          placeholder={T.minutesPlaceholder}
          value={minutes}
          onChange={e => setMinutes(e.target.value)}
          className="w-32 rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="submit"
          disabled={adding}
          className="rounded-md bg-orange-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {adding ? T.adding : T.addButton}
        </button>
        {addError && <p className="w-full text-xs text-red-500">{addError}</p>}
      </form>

      {loading ? (
        <p className="py-12 text-center text-sm text-neutral-400">불러오는 중…</p>
      ) : error ? (
        <p className="py-12 text-center text-sm text-red-500">{error}</p>
      ) : presets.length === 0 ? (
        <p className="py-12 text-center text-sm text-neutral-400">{T.empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full min-w-[420px] text-[13px]">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-[11px] font-medium tracking-wide text-neutral-400 dark:border-neutral-800 dark:bg-neutral-800/50 dark:text-neutral-500">
                <th className="whitespace-nowrap px-3 py-2 font-medium">이름</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">{T.minutesColumn}</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">{T.orderColumn}</th>
                <th className="whitespace-nowrap px-3 py-2 text-right font-medium">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {presets.map(preset => {
                const busy = pendingId === preset.id
                return (
                  <tr key={preset.id}>
                    <td className="whitespace-nowrap px-3 py-2.5 font-medium text-neutral-900 dark:text-neutral-100">
                      {preset.label}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-neutral-600 dark:text-neutral-300">
                      {preset.minutes.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-neutral-600 dark:text-neutral-300">
                      {preset.displayOrder}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(preset)}
                        disabled={busy}
                        className="rounded border border-red-200 px-2 py-1 text-xs text-red-500 hover:bg-red-50 disabled:opacity-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
                      >
                        {busy ? '삭제 중…' : '삭제'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
