'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { usersApi } from '@/lib/api/users'
import { ApiError } from '@/lib/api/client'

// 회원 탈퇴 확인 모달.
// 되돌릴 수 없는 파괴적 작업이므로 (1) 본인 확인용 비밀번호 (2) 안내 확인 체크를
// 모두 요구하고, 그 뒤에야 탈퇴 버튼이 활성화된다. 실수로 인한 탈퇴를 구조적으로 막는다.
export default function WithdrawModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const { clearAuth } = useAuth()

  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  // 탈퇴 성공 후에는 폼 대신 작별 화면을 보여준 뒤 홈으로 보낸다.
  const [done, setDone] = useState(false)

  const passwordRef = useRef<HTMLInputElement>(null)

  // 열려 있는 동안: ESC로 닫기 + 배경 스크롤 잠금 + 비밀번호 입력에 포커스.
  // 단, 처리 중(loading)이거나 완료(done) 상태에서는 ESC로 닫히지 않게 한다.
  useEffect(() => {
    if (!open) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading && !done) onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    passwordRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, loading, done, onClose])

  // 닫힐 때 입력 상태를 초기화해, 다음에 열 때 깨끗한 상태로 시작한다.
  // (완료 화면에서는 리다이렉트되므로 초기화 대상이 아니다.)
  useEffect(() => {
    if (!open) {
      setPassword('')
      setAgreed(false)
      setError(null)
      setLoading(false)
      setDone(false)
    }
  }, [open])

  // 탈퇴 완료 후 잠깐 작별 메시지를 보여주고 홈으로 이동한다.
  //
  // clearAuth를 여기(리다이렉트 시점)에서 호출하는 이유:
  //  성공 직후 clearAuth를 부르면 부모 MyPage가 user=null을 보고 "로그인 필요" 화면으로
  //  리렌더하면서 이 모달 자체가 언마운트돼 작별 화면과 리다이렉트가 실행되지 않는다.
  //  그래서 작별 화면을 2초 보여주는 동안은 로그인 상태를 유지하고, 홈으로 이동하는 순간
  //  로그인 상태를 비워 헤더 등을 로그아웃으로 동기화한다.
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => {
      // replace: 뒤로가기로 마이페이지(탈퇴한 계정)로 되돌아오지 못하게 한다.
      router.replace('/')
      clearAuth()
      router.refresh()
    }, 2000)
    return () => clearTimeout(t)
  }, [done, router, clearAuth])

  if (!open) return null

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setError(null)

    if (!password) {
      setError('비밀번호를 입력해주세요.')
      return
    }
    if (!agreed) {
      setError('안내 사항 확인에 동의해주세요.')
      return
    }

    setLoading(true)
    try {
      await usersApi.withdraw(password)
      // 백엔드가 쿠키를 이미 삭제한 상태. 로그인 상태 정리(clearAuth)는 언마운트를 피하려고
      // 작별 화면을 보여준 뒤 리다이렉트 시점에 처리한다(위 done 이펙트 참고).
      setDone(true)
    } catch (err) {
      setLoading(false)
      if (err instanceof ApiError) {
        if (err.code === 'WRONG_PASSWORD') {
          setError('비밀번호가 일치하지 않습니다.')
          return
        }
        if (err.code === 'ALREADY_WITHDRAWN') {
          // 이미 탈퇴된 계정(중복 요청 등) — 사실상 목적은 달성됐으므로 완료 처리한다.
          setDone(true)
          return
        }
        setError(err.message)
        return
      }
      setError('회원 탈퇴에 실패했습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      // 처리 중/완료 상태가 아닐 때만 배경 클릭으로 닫는다.
      onClick={() => { if (!loading && !done) onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="회원 탈퇴"
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900"
      >
        {done ? (
          // ===== 탈퇴 완료 화면 =====
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/20">
              <svg className="h-6 w-6 text-green-600 dark:text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">탈퇴가 완료되었습니다</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              그동안 이용해 주셔서 감사합니다.<br />
              잠시 후 홈으로 이동합니다.
            </p>
          </div>
        ) : (
          // ===== 탈퇴 확인 폼 =====
          <>
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 className="text-base font-bold text-red-600 dark:text-red-500">회원 탈퇴</h2>
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

            {/* 탈퇴 시 실제로 일어나는 일 안내 (백엔드 동작과 일치) */}
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs leading-relaxed text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              <p className="mb-1.5 font-semibold">탈퇴 시 아래 내용에 유의해주세요.</p>
              <ul className="list-disc space-y-1 pl-4">
                <li>계정이 즉시 비활성화되며 <b>다시 로그인할 수 없습니다.</b></li>
                <li>닉네임·이메일 등 개인정보는 익명 처리되며 <b>복구할 수 없습니다.</b></li>
                <li>작성하신 글과 댓글은 삭제되지 않고 <b>&lsquo;탈퇴회원&rsquo;</b>으로 표시됩니다.</li>
                <li>모든 기기에서 로그아웃됩니다.</li>
                <li>접속 IP는 관련 법령에 따라 6개월간 보관 후 파기됩니다.</li>
              </ul>
            </div>

            <form onSubmit={handleWithdraw} className="flex flex-col gap-3">
              <div>
                <label htmlFor="withdraw-password" className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  본인 확인을 위해 현재 비밀번호를 입력해주세요.
                </label>
                <input
                  id="withdraw-password"
                  ref={passwordRef}
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="현재 비밀번호"
                  disabled={loading}
                  className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-red-400 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-red-500"
                />
              </div>

              <label className="flex cursor-pointer items-start gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  disabled={loading}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-red-600"
                />
                <span>안내 사항을 모두 확인했으며, 탈퇴에 동의합니다.</span>
              </label>

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
                  // 비밀번호 입력 + 동의 체크 + 처리중 아님, 세 조건을 모두 만족해야 활성화.
                  disabled={loading || !password || !agreed}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? '처리 중…' : '회원 탈퇴'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
