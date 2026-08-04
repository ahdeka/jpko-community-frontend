'use client'

import { useCallback, useEffect, useState } from 'react'
import { adminApi } from '@/lib/api/admin'
import { ApiError } from '@/lib/api/client'
import { useAuth } from '@/lib/auth-context'
import { isRoot } from '@/lib/role'
import { formatSuspendDuration } from '@/lib/format'
import { MESSAGES } from '@/lib/messages'
import type { SuspendDurationPreset } from '@/types'

const T = MESSAGES.admin.suspendPresets

// 정지 기한 프리셋 관리. ROOT 전용 — SuspendUserModal이 보여줄 버튼 목록(기한(분))을
// ROOT가 직접 구성한다(추가/삭제만 지원 — 수정은 삭제 후 재생성으로 충분하다, 과거 정지 기록을
// 참조하는 값이 아니라 단순 프리셋이라 이력 보존이 필요 없다).
// 이름·표시 순서는 따로 입력받지 않는다 — 백엔드가 항상 minutes 오름차순으로 내려주고,
// 화면에는 그 값에서 계산한 라벨("1시간"/"3일")만 보여준다.
export default function AdminSuspendPresetsPage() {
  const { user } = useAuth()
  const [presets, setPresets] = useState<SuspendDurationPreset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<number | null>(null)

  const [minutes, setMinutes] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  // 정지 포인트 해제 가격. 프리셋과 별개 API지만 같은 화면(정지 관련 ROOT 설정)에 함께 둔다.
  const [price, setPrice] = useState('')
  const [priceLoading, setPriceLoading] = useState(true)
  const [priceLoadError, setPriceLoadError] = useState<string | null>(null)
  const [savingPrice, setSavingPrice] = useState(false)
  const [priceSaveError, setPriceSaveError] = useState<string | null>(null)
  const [priceSaved, setPriceSaved] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    adminApi.getSuspendPresets()
      .then(res => setPresets(res.data ?? []))
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : T.loadFailed))
      .finally(() => setLoading(false))
  }, [])

  useEffect(load, [load])

  useEffect(() => {
    setPriceLoading(true)
    setPriceLoadError(null)
    adminApi.getSuspendUnlockPrice()
      .then(res => setPrice(res.data ? String(res.data.price) : ''))
      .catch((e: unknown) => setPriceLoadError(e instanceof ApiError ? e.message : T.unlockPriceLoadFailed))
      .finally(() => setPriceLoading(false))
  }, [])

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
    const parsedMinutes = Number(minutes)
    if (!minutes || !Number.isInteger(parsedMinutes) || parsedMinutes <= 0) {
      setAddError('기한(분)을 입력해주세요.')
      return
    }

    setAddError(null)
    setAdding(true)
    try {
      await adminApi.createSuspendPreset({ minutes: parsedMinutes })
      setMinutes('')
      load()
    } catch (err) {
      setAddError(err instanceof ApiError ? err.message : T.addFailed)
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(preset: SuspendDurationPreset) {
    if (!confirm(T.deleteConfirm(formatSuspendDuration(preset.minutes)))) return
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

  async function handleSavePrice(e: React.FormEvent) {
    e.preventDefault()
    if (savingPrice) return
    const parsedPrice = Number(price)
    if (!price || !Number.isInteger(parsedPrice) || parsedPrice <= 0) {
      setPriceSaveError(T.unlockPricePlaceholder)
      return
    }

    setPriceSaveError(null)
    setSavingPrice(true)
    try {
      await adminApi.updateSuspendUnlockPrice(parsedPrice)
      setPriceSaved(true)
      setTimeout(() => setPriceSaved(false), 2000)
    } catch (err) {
      setPriceSaveError(err instanceof ApiError ? err.message : T.unlockPriceSaveFailed)
    } finally {
      setSavingPrice(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">{T.title}</h1>

      {/* 정지 포인트 해제 가격 */}
      <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">{T.unlockPriceTitle}</p>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{T.unlockPriceDescription}</p>

        {priceLoading ? (
          <p className="mt-3 text-xs text-neutral-400">불러오는 중…</p>
        ) : priceLoadError ? (
          <p className="mt-3 text-xs text-red-500">{priceLoadError}</p>
        ) : (
          <form onSubmit={handleSavePrice} className="mt-3 flex flex-wrap items-center gap-3">
            <input
              type="number"
              min={1}
              placeholder={T.unlockPricePlaceholder}
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="w-32 rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
            <button
              type="submit"
              disabled={savingPrice}
              className="rounded-md bg-orange-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
            >
              {savingPrice ? T.unlockPriceSaving : T.unlockPriceSave}
            </button>
            {priceSaved && <span className="text-xs text-green-600 dark:text-green-400">{T.unlockPriceSaved}</span>}
            {priceSaveError && <p className="w-full text-xs text-red-500">{priceSaveError}</p>}
          </form>
        )}
      </div>

      {/* 정지 기한 프리셋 */}
      <div>
        <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">{T.presetsTitle}</p>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{T.description}</p>
      </div>

      <form onSubmit={handleAdd} className="flex flex-wrap items-start gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
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
        // 짧은 것 → 긴 것 순서로 왼쪽부터 나열한다(백엔드가 이미 minutes 오름차순으로 준다).
        <div className="flex flex-wrap gap-2">
          {presets.map(preset => {
            const busy = pendingId === preset.id
            return (
              <div
                key={preset.id}
                className="flex items-center gap-2 rounded-lg border border-neutral-200 py-1.5 pl-3 pr-1.5 text-sm dark:border-neutral-800"
              >
                <span className="font-medium text-neutral-800 dark:text-neutral-100">
                  {formatSuspendDuration(preset.minutes)}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(preset)}
                  disabled={busy}
                  aria-label={`${formatSuspendDuration(preset.minutes)} 프리셋 삭제`}
                  className="flex h-6 w-6 items-center justify-center rounded text-neutral-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:hover:bg-red-500/10"
                >
                  {busy ? '…' : '×'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
