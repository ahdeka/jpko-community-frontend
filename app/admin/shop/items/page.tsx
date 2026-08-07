'use client'

import { useCallback, useEffect, useState } from 'react'
import { adminApi } from '@/lib/api/admin'
import { shopApi } from '@/lib/api/shop'
import { ApiError } from '@/lib/api/client'
import { formatDateTime } from '@/lib/format'
import { useAuth } from '@/lib/auth-context'
import { isRoot } from '@/lib/role'
import { shopItemTypeMeta } from '@/lib/shop'
import type { CreateShopItemBody, RoleAuctionRound, ShopItem, ShopItemType, UpdateShopItemBody, UserRole } from '@/types'

const EMPTY_CREATE_FORM: CreateShopItemBody = {
  type: 'BLOCK',
  name: '',
  price: undefined,
  durationMinutes: undefined,
  targetRole: 'ADMIN',
  quantity: undefined,
  minPrice: undefined,
  durationDays: 7,
  cadenceDays: 7,
}

// 상점 카탈로그 관리. ROOT 전용 — 경매로 ADMIN 권한을 얻은 유저가 상점 가격·수량을 스스로
// 조작하는 자기강화 루프를 막기 위해, ADMIN에게는 이 화면 자체가 (사이드바에서도) 노출되지 않는다.
// 이 페이지 상단의 isRoot 재확인은 AdminLayout의 사이드바 게이트와 별개인 이중 방어다
// (SHOGUN 등급 select의 프론트 가드와 같은 원칙 — 최종 방어는 백엔드 hasRole('ROOT')).
export default function AdminShopItemsPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<ShopItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<number | null>(null)

  const [form, setForm] = useState<CreateShopItemBody>(EMPTY_CREATE_FORM)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<UpdateShopItemBody>({})

  // 진행 중인 경매 회차. GET /api/shop/role-auctions/current는 ROOT도 그냥 일반 유저 권한으로
  // 호출 가능한 공개 API라 별도 관리자 전용 조회 없이 재사용한다.
  const [rounds, setRounds] = useState<RoleAuctionRound[]>([])
  const [roundEndInputs, setRoundEndInputs] = useState<Record<number, string>>({})
  const [roundBusyId, setRoundBusyId] = useState<number | null>(null)
  const [roundError, setRoundError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    adminApi.getShopItems()
      .then(res => setItems(res.data ?? []))
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : '상품 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))

    shopApi.getCurrentRounds()
      .then(res => setRounds(res.data ?? []))
      .catch(() => setRounds([]))
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

  // 타입별 필수값을 제출 전에 미리 확인한다. 빈 칸으로 제출하면 백엔드가 400으로 거부하는데,
  // 그 실패가 작은 빨간 글씨로만 표시돼 "등록해도 아무 변화가 없다"로 오인되기 쉬웠다.
  function validateCreateForm(): string | null {
    if (!form.name.trim()) return '상품명을 입력해주세요.'

    if (form.type === 'BLOCK' || form.type === 'SHIELD') {
      if (!form.price || form.price <= 0) return '가격(P)을 입력해주세요.'
      if (!form.durationMinutes || form.durationMinutes <= 0) return '지속 시간(분)을 입력해주세요.'
    } else {
      if (!form.quantity || form.quantity <= 0) return '선발 인원을 입력해주세요.'
      if (!form.minPrice || form.minPrice <= 0) return '최저가(P)를 입력해주세요.'
      if (!form.durationDays || form.durationDays <= 0) return '기간(일)을 입력해주세요.'
      if (!form.cadenceDays || form.cadenceDays <= 0) return '개설 주기(일)를 입력해주세요.'
    }
    return null
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (creating) return
    const validationError = validateCreateForm()
    if (validationError) {
      setCreateError(validationError)
      return
    }

    setCreateError(null)
    setCreating(true)
    try {
      await adminApi.createShopItem(form)
      setForm(EMPTY_CREATE_FORM)
      load()
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : '상품 등록에 실패했습니다.')
    } finally {
      setCreating(false)
    }
  }

  async function handleToggleActive(item: ShopItem) {
    setPendingId(item.id)
    try {
      await adminApi.updateShopItem(item.id, { active: !item.active })
      setItems(prev => prev.map(i => (i.id === item.id ? { ...i, active: !i.active } : i)))
    } catch (err) {
      alert(err instanceof ApiError ? err.message : '상태 변경에 실패했습니다.')
    } finally {
      setPendingId(null)
    }
  }

  function startEdit(item: ShopItem) {
    setEditingId(item.id)
    setEditForm(
      item.type === 'BLOCK' || item.type === 'SHIELD'
        ? { price: item.price ?? undefined, durationMinutes: item.durationMinutes ?? undefined }
        : {
            quantity: item.quantity ?? undefined,
            minPrice: item.minPrice ?? undefined,
            durationDays: item.durationDays ?? undefined,
            cadenceDays: item.cadenceDays ?? undefined,
          },
    )
  }

  async function saveEdit(item: ShopItem) {
    setPendingId(item.id)
    try {
      await adminApi.updateShopItem(item.id, editForm)
      setEditingId(null)
      load()
    } catch (err) {
      alert(err instanceof ApiError ? err.message : '수정에 실패했습니다.')
    } finally {
      setPendingId(null)
    }
  }

  // <input type="datetime-local">는 로컬 벽시계 문자열을 주고받는데, 이 앱은 항상 KST로 동작하므로
  // (lib/format.ts와 동일한 전제) 브라우저 시간대와 무관하게 KST 벽시계 값을 그대로 다룬다.
  function toKstInputValue(iso: string): string {
    return new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date(iso)).replace(' ', 'T')
  }

  function fromKstInputValue(value: string): string {
    return `${value}:00+09:00`
  }

  async function handleUpdateRoundEnd(round: RoleAuctionRound) {
    const value = roundEndInputs[round.id]
    if (!value) return
    setRoundError(null)
    setRoundBusyId(round.id)
    try {
      await adminApi.updateRoleAuctionRound(round.id, { endAt: fromKstInputValue(value) })
      load()
    } catch (err) {
      setRoundError(err instanceof ApiError ? err.message : '회차 종료 시각 변경에 실패했습니다.')
    } finally {
      setRoundBusyId(null)
    }
  }

  async function handleEndRoundNow(round: RoleAuctionRound) {
    if (!confirm('이 회차를 지금 즉시 종료하고 정산할까요?')) return
    setRoundError(null)
    setRoundBusyId(round.id)
    try {
      await adminApi.updateRoleAuctionRound(round.id, { endAt: new Date().toISOString() })
      load()
    } catch (err) {
      setRoundError(err instanceof ApiError ? err.message : '조기 종료에 실패했습니다.')
    } finally {
      setRoundBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">상점 관리</h1>

      {/* 상품 등록 */}
      <form onSubmit={handleCreate} className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">새 상품 등록</h2>
        <div className="flex flex-wrap gap-3">
          <select
            value={form.type}
            onChange={e => setForm({ ...EMPTY_CREATE_FORM, type: e.target.value as ShopItemType })}
            className="rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="BLOCK">차단권 (BLOCK)</option>
            <option value="SHIELD">방어권 (SHIELD)</option>
            <option value="ROLE_AUCTION">권한 경매 (ROLE_AUCTION)</option>
          </select>
          <input
            type="text"
            placeholder="상품명"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="min-w-[160px] flex-1 rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>

        {form.type === 'BLOCK' || form.type === 'SHIELD' ? (
          <div className="flex flex-wrap gap-3">
            <input
              type="number"
              min={1}
              placeholder="가격(P)"
              value={form.price ?? ''}
              onChange={e => setForm({ ...form, price: Number(e.target.value) })}
              className="w-32 rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
            <input
              type="number"
              min={1}
              placeholder="지속 시간(분)"
              value={form.durationMinutes ?? ''}
              onChange={e => setForm({ ...form, durationMinutes: Number(e.target.value) })}
              className="w-36 rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {/* ROOT는 부여할 수 없으므로 ROOT를 아예 옵션에서 뺀다 (백엔드도 CANNOT_AUCTION_ROOT_ROLE로 거부) */}
            <select
              value={form.targetRole}
              onChange={e => setForm({ ...form, targetRole: e.target.value as UserRole })}
              className="rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="ADMIN">ADMIN</option>
            </select>
            <input
              type="number"
              min={1}
              placeholder="선발 인원"
              value={form.quantity ?? ''}
              onChange={e => setForm({ ...form, quantity: Number(e.target.value) })}
              className="w-28 rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
            <input
              type="number"
              min={1}
              placeholder="최저가(P)"
              value={form.minPrice ?? ''}
              onChange={e => setForm({ ...form, minPrice: Number(e.target.value) })}
              className="w-32 rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
            <input
              type="number"
              min={1}
              placeholder="기간(일)"
              value={form.durationDays ?? ''}
              onChange={e => setForm({ ...form, durationDays: Number(e.target.value) })}
              className="w-28 rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
            <input
              type="number"
              min={1}
              placeholder="개설 주기(일)"
              value={form.cadenceDays ?? ''}
              onChange={e => setForm({ ...form, cadenceDays: Number(e.target.value) })}
              className="w-28 rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            />
          </div>
        )}

        {createError && <p className="text-xs text-red-500">{createError}</p>}

        <button
          type="submit"
          disabled={creating}
          className="self-start rounded-md bg-orange-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {creating ? '등록 중…' : '등록'}
        </button>
      </form>

      {/* 상품 목록 */}
      {loading ? (
        <p className="py-12 text-center text-sm text-neutral-400">불러오는 중…</p>
      ) : error ? (
        <p className="py-12 text-center text-sm text-red-500">{error}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full min-w-[640px] text-[13px]">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-[11px] font-medium tracking-wide text-neutral-400 dark:border-neutral-800 dark:bg-neutral-800/50 dark:text-neutral-500">
                <th className="whitespace-nowrap px-3 py-2 font-medium">종류</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">이름</th>
                <th className="px-3 py-2 font-medium">설정값</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">상태</th>
                <th className="whitespace-nowrap px-3 py-2 text-right font-medium">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {items.map(item => {
                const busy = pendingId === item.id
                const editing = editingId === item.id
                const typeMeta = shopItemTypeMeta(item.type)

                return (
                  <tr key={item.id} className={!item.active ? 'opacity-60' : undefined}>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${typeMeta.badge}`}>{typeMeta.label}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 font-medium text-neutral-900 dark:text-neutral-100">{item.name}</td>
                    <td className="px-3 py-2.5 text-neutral-600 dark:text-neutral-300">
                      {editing ? (
                        item.type === 'BLOCK' || item.type === 'SHIELD' ? (
                          <div className="flex gap-2">
                            <input
                              type="number"
                              value={editForm.price ?? ''}
                              onChange={e => setEditForm({ ...editForm, price: Number(e.target.value) })}
                              className="w-24 rounded border border-neutral-300 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                            />
                            <input
                              type="number"
                              value={editForm.durationMinutes ?? ''}
                              onChange={e => setEditForm({ ...editForm, durationMinutes: Number(e.target.value) })}
                              className="w-24 rounded border border-neutral-300 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                            />
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <input
                              type="number"
                              value={editForm.quantity ?? ''}
                              onChange={e => setEditForm({ ...editForm, quantity: Number(e.target.value) })}
                              className="w-16 rounded border border-neutral-300 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                            />
                            <input
                              type="number"
                              value={editForm.minPrice ?? ''}
                              onChange={e => setEditForm({ ...editForm, minPrice: Number(e.target.value) })}
                              className="w-20 rounded border border-neutral-300 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                            />
                            <input
                              type="number"
                              value={editForm.durationDays ?? ''}
                              onChange={e => setEditForm({ ...editForm, durationDays: Number(e.target.value) })}
                              className="w-16 rounded border border-neutral-300 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                            />
                            <input
                              type="number"
                              value={editForm.cadenceDays ?? ''}
                              onChange={e => setEditForm({ ...editForm, cadenceDays: Number(e.target.value) })}
                              className="w-16 rounded border border-neutral-300 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                            />
                          </div>
                        )
                      ) : item.type === 'BLOCK' || item.type === 'SHIELD' ? (
                        <span>{item.price?.toLocaleString()}P · {item.durationMinutes}분</span>
                      ) : (
                        <span>{item.targetRole} · {item.quantity}명 · 최저 {item.minPrice?.toLocaleString()}P · {item.durationDays}일 · {item.cadenceDays}일 주기</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      {item.active ? (
                        <span className="inline-block rounded bg-green-100 px-1.5 py-0.5 text-[11px] font-semibold text-green-700 dark:bg-green-500/15 dark:text-green-400">판매중</span>
                      ) : (
                        <span className="inline-block rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">중지</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        {editing ? (
                          <>
                            <button type="button" onClick={() => saveEdit(item)} disabled={busy} className="rounded border border-orange-300 px-2 py-1 text-xs text-orange-600 hover:bg-orange-50 disabled:opacity-50 dark:border-orange-500/30 dark:text-orange-400 dark:hover:bg-orange-500/10">
                              {busy ? '저장 중…' : '저장'}
                            </button>
                            <button type="button" onClick={() => setEditingId(null)} disabled={busy} className="rounded border border-neutral-300 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
                              취소
                            </button>
                          </>
                        ) : (
                          <>
                            <button type="button" onClick={() => startEdit(item)} disabled={busy} className="rounded border border-neutral-300 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
                              수정
                            </button>
                            <button type="button" onClick={() => handleToggleActive(item)} disabled={busy} className="rounded border border-neutral-300 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
                              {busy ? '처리 중…' : item.active ? '판매중지' : '판매재개'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 진행 중인 경매 회차 — 종료 시각 직접 수정/조기 종료 */}
      {rounds.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">진행 중인 경매 회차</h2>
          {rounds.map(round => {
            const item = items.find(i => i.id === round.shopItemId)
            const busy = roundBusyId === round.id
            return (
              <div key={round.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800">
                <span className="font-medium text-neutral-800 dark:text-neutral-100">{item?.name ?? `상품 #${round.shopItemId}`}</span>
                <span className="text-xs text-neutral-400">현재 종료: {formatDateTime(round.endAt)}</span>
                <input
                  type="datetime-local"
                  disabled={busy}
                  defaultValue={toKstInputValue(round.endAt)}
                  onChange={e => setRoundEndInputs(prev => ({ ...prev, [round.id]: e.target.value }))}
                  className="rounded border border-neutral-300 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                />
                <button
                  type="button"
                  onClick={() => handleUpdateRoundEnd(round)}
                  disabled={busy || !roundEndInputs[round.id]}
                  className="rounded border border-orange-300 px-2 py-1 text-xs text-orange-600 hover:bg-orange-50 disabled:opacity-50 dark:border-orange-500/30 dark:text-orange-400 dark:hover:bg-orange-500/10"
                >
                  {busy ? '처리 중…' : '저장'}
                </button>
                <button
                  type="button"
                  onClick={() => handleEndRoundNow(round)}
                  disabled={busy}
                  className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  지금 종료
                </button>
              </div>
            )
          })}
          {roundError && <p className="text-xs text-red-500">{roundError}</p>}
        </div>
      )}
    </div>
  )
}
