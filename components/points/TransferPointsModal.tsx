'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { pointsApi } from '@/lib/api/points'
import { usersApi } from '@/lib/api/users'
import { ApiError } from '@/lib/api/client'
import { MESSAGES } from '@/lib/messages'
import type { PointTransaction, PublicProfile } from '@/types'

const T = MESSAGES.points.transfer

interface Props {
  open: boolean
  onClose: () => void
  // 성공 후 호출부가 잔액/내역을 새로고침할 수 있게 알려준다.
  onSuccess?: () => void
  // 지정돼 있으면(공개 프로필에서 진입) 받는 사람이 고정되어 닉네임 입력을 생략한다.
  fixedRecipient?: { id: number; nickname: string }
}

// 실패한 송금 결과의 code를 한글 메시지로 변환한다. code가 없으면 서버가 준 예외 메시지(e)로,
// 그마저 없으면 일반 실패 문구로 폴백한다.
function resolveFailureMessage(code?: string, e?: string): string {
  if (code && T.errorCodeMessages[code]) return T.errorCodeMessages[code]
  if (e) return e
  return T.genericFailed
}

// 포인트 송금 모달. WithdrawModal과 동일한 구조(오버레이/ESC/스크롤 잠금/열릴 때 초기화/완료 화면)를 따른다.
export default function TransferPointsModal({ open, onClose, onSuccess, fixedRecipient }: Props) {
  const { user } = useAuth()

  const [nickname, setNickname] = useState('')
  const [amount, setAmount] = useState('')
  const [balance, setBalance] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ recipientNickname: string; transfer: PointTransaction | null; fee: PointTransaction | null } | null>(null)

  // 닉네임 실시간 존재 확인. checkedNickname은 "마지막으로 완료된 확인이 어떤 닉네임에 대한 것인지" —
  // nickname을 더 타이핑해 trim() 값이 달라지면 checkedNickname과 어긋나므로, 화면은 그 결과를
  // 낡은 값으로 취급해 숨긴다(별도의 stale 플래그 없이 두 값 비교만으로 처리).
  // checkedProfile은 찾았으면 프로필, 404로 못 찾았으면 null.
  const [checking, setChecking] = useState(false)
  const [checkedNickname, setCheckedNickname] = useState<string | null>(null)
  const [checkedProfile, setCheckedProfile] = useState<PublicProfile | null>(null)

  const nicknameRef = useRef<HTMLInputElement>(null)
  const amountRef = useRef<HTMLInputElement>(null)

  // 열려 있는 동안: ESC로 닫기 + 배경 스크롤 잠금 + 보유 포인트 조회 + 첫 입력에 포커스.
  useEffect(() => {
    if (!open) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    pointsApi.getBalance()
      .then(res => setBalance(res.data?.balance ?? 0))
      .catch(() => setBalance(null))

    if (fixedRecipient) {
      amountRef.current?.focus()
    } else {
      nicknameRef.current?.focus()
    }

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, loading, onClose])

  // 닉네임을 타이핑하는 동안 짧은 디바운스(350ms) 후 자동으로 존재 여부를 확인한다.
  // 매 키 입력마다 바로 부르면 요청이 과도해지므로, 이 저장소 다른 곳(MyPointsTab 등)에서
  // 쓰는 "let cancelled = false" 취소 패턴을 그대로 쓴다.
  useEffect(() => {
    if (!open || fixedRecipient) return

    const trimmed = nickname.trim()
    if (!trimmed) {
      setChecking(false)
      setCheckedNickname(null)
      setCheckedProfile(null)
      return
    }

    setChecking(true)
    let cancelled = false
    const timer = setTimeout(() => {
      usersApi.getPublicProfile(trimmed)
        .then(res => {
          if (cancelled) return
          setCheckedProfile(res.data ?? null)
          setCheckedNickname(trimmed)
        })
        .catch((e: unknown) => {
          if (cancelled) return
          // 404(존재하지 않는 닉네임)만 결과로 확정한다. 그 외(네트워크 오류 등)는 일시적일 수 있어
          // "존재하지 않음"으로 단정하지 않고 확인 안 된 상태로 남긴다.
          if (e instanceof ApiError && e.status === 404) {
            setCheckedProfile(null)
            setCheckedNickname(trimmed)
          }
        })
        .finally(() => { if (!cancelled) setChecking(false) })
    }, 350)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [open, fixedRecipient, nickname])

  // 닫힐 때 입력 상태를 초기화해, 다음에 열 때 깨끗한 상태로 시작한다.
  useEffect(() => {
    if (!open) {
      setNickname('')
      setAmount('')
      setBalance(null)
      setError(null)
      setLoading(false)
      setResult(null)
      setChecking(false)
      setCheckedNickname(null)
      setCheckedProfile(null)
    }
  }, [open])

  if (!open) return null

  const trimmedNickname = nickname.trim()
  // checkedNickname이 현재 입력값과 일치할 때만 그 결과를 신뢰한다 — 더 타이핑했는데 아직
  // 디바운스가 안 끝났으면(=값이 어긋나면) "확인 중"도 "찾음/못찾음"도 아닌 빈 상태로 둔다.
  const checkMatchesInput = !fixedRecipient && checkedNickname === trimmedNickname
  const checkedIsSelf = !!(user && checkedProfile && checkedProfile.id === user.id)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setError(null)

    const amountValue = Number(amount)
    if (!amount) {
      setError(T.amountRequired)
      return
    }
    if (!Number.isInteger(amountValue) || amountValue <= 0) {
      setError(T.amountInvalid)
      return
    }

    setLoading(true)
    try {
      let recipientId: number
      let recipientNickname: string

      if (fixedRecipient) {
        recipientId = fixedRecipient.id
        recipientNickname = fixedRecipient.nickname
      } else {
        const trimmed = nickname.trim()
        if (!trimmed) {
          setError(T.recipientRequired)
          setLoading(false)
          return
        }

        // 실시간 확인 결과가 지금 입력값과 일치하면 재조회하지 않고 그대로 재사용한다.
        // (디바운스 대기 중 곧바로 제출한 엣지케이스만 아래에서 새로 조회한다.)
        if (checkedNickname === trimmed) {
          if (!checkedProfile) {
            setLoading(false)
            setError(T.recipientNotFound)
            return
          }
          recipientId = checkedProfile.id
          recipientNickname = checkedProfile.nickname
        } else {
          try {
            const profileRes = await usersApi.getPublicProfile(trimmed)
            if (!profileRes.data) throw new ApiError(T.recipientNotFound, 404, 'USER_NOT_FOUND')
            recipientId = profileRes.data.id
            recipientNickname = profileRes.data.nickname
          } catch (err) {
            setLoading(false)
            setError(err instanceof ApiError && err.status === 404 ? T.recipientNotFound : T.lookupFailed)
            return
          }
        }

        if (user && recipientId === user.id) {
          setLoading(false)
          setError(T.selfTransferNotAllowed)
          return
        }
      }

      const res = await pointsApi.transfer({ recipientId, amount: amountValue })
      const data = res.data

      if (!data || data.status !== 'ACCEPTED') {
        setLoading(false)
        setError(resolveFailureMessage(data?.code, data?.e))
        return
      }

      setResult({ recipientNickname, transfer: data.transfer ?? null, fee: data.fee ?? null })
      onSuccess?.()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : T.genericFailed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => { if (!loading) onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={T.title}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900"
      >
        {result ? (
          // ===== 송금 완료 화면 =====
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-500/20">
              <svg className="h-6 w-6 text-violet-600 dark:text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">{T.doneTitle}</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {T.doneDescription(result.recipientNickname, amount)}
            </p>
            {result.fee && (
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                {result.fee.senderId === null
                  ? T.feeRefundedNote(result.fee.amount.toLocaleString())
                  : T.feeChargedNote(result.fee.amount.toLocaleString())}
              </p>
            )}
            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded-md bg-neutral-800 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
            >
              닫기
            </button>
          </div>
        ) : (
          // ===== 송금 입력 폼 =====
          <>
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">{T.title}</h2>
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

            <div className="mb-4 flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs dark:border-neutral-800 dark:bg-neutral-800/50">
              <span className="text-neutral-500 dark:text-neutral-400">{T.balanceLabel}</span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-100">
                {balance === null ? '—' : `${balance.toLocaleString()}P`}
              </span>
            </div>

            <p className="mb-4 rounded-lg border border-violet-200 bg-violet-50 p-3 text-xs leading-relaxed text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300">
              {T.feeNotice}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {fixedRecipient ? (
                <div>
                  <p className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    {T.recipientLabel}
                  </p>
                  <p className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-semibold text-neutral-800 dark:border-neutral-800 dark:bg-neutral-800/50 dark:text-neutral-100">
                    {fixedRecipient.nickname}
                  </p>
                </div>
              ) : (
                <div>
                  <label htmlFor="transfer-nickname" className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    {T.recipientLabel}
                  </label>
                  <input
                    id="transfer-nickname"
                    ref={nicknameRef}
                    type="text"
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    placeholder={T.recipientPlaceholder}
                    disabled={loading}
                    className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-violet-400 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-violet-500"
                  />
                  {trimmedNickname && (
                    <p className="mt-1 text-xs">
                      {checking ? (
                        <span className="text-neutral-400">{T.recipientChecking}</span>
                      ) : !checkMatchesInput ? null : checkedProfile ? (
                        checkedIsSelf ? (
                          <span className="text-red-500">{T.selfTransferNotAllowed}</span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">{T.recipientFound(checkedProfile.nickname)}</span>
                        )
                      ) : (
                        <span className="text-red-500">{T.recipientNotFound}</span>
                      )}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="transfer-amount" className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  {T.amountLabel}
                </label>
                <input
                  id="transfer-amount"
                  ref={amountRef}
                  type="number"
                  min={1}
                  step={1}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder={T.amountPlaceholder}
                  disabled={loading}
                  className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-violet-400 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-violet-500"
                />
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="mt-1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={
                    loading || !amount ||
                    // 확인 결과가 지금 입력값과 일치하는데 못 찾았거나 본인이면 뻔히 실패할 제출을 막는다.
                    // 아직 확인 중/디바운스 대기 중이면(=checkMatchesInput false) 막지 않고 제출 시 재조회한다.
                    (checkMatchesInput && (!checkedProfile || checkedIsSelf))
                  }
                  className="rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? '처리 중…' : '보내기'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
