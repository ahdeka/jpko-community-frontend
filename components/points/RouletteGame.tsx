'use client'

import { useEffect, useRef, useState } from 'react'
import { pointsApi } from '@/lib/api/points'
import { rouletteApi } from '@/lib/api/roulette'
import { authApi } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { useAuth } from '@/lib/auth-context'
import { MESSAGES } from '@/lib/messages'
import type { RouletteConfig, RouletteOpponent, RouletteSpinResult } from '@/types'

// 휠 세그먼트 구성. 12시 방향(0deg)부터 시계방향으로 승/패가 번갈아 나온다.
const SEGMENTS = 8
const SEGMENT_DEG = 360 / SEGMENTS
const SEGMENT_OUTCOMES: Array<'win' | 'lose'> = Array.from({ length: SEGMENTS }, (_, i) =>
  i % 2 === 0 ? 'win' : 'lose'
)
const WHEEL_BACKGROUND = `conic-gradient(from 0deg, ${SEGMENT_OUTCOMES
  .map((outcome, i) => {
    const color = outcome === 'win' ? '#10b981' : '#ef4444' // emerald-500 / red-500
    return `${color} ${i * SEGMENT_DEG}deg ${(i + 1) * SEGMENT_DEG}deg`
  })
  .join(', ')})`

// 실제 상대를 아직 모를 때(랜덤 상대, 스핀 전) 세그먼트에 채우는 자리표시자.
const UNKNOWN_OPPONENT_LABEL = '○○○'

// 세그먼트가 좁아 닉네임이 다 안 들어가므로 짧게 자른다(백엔드 닉네임 최대 20자).
function truncateForWheel(name: string): string {
  return name.length > 5 ? `${name.slice(0, 4)}…` : name
}

// 결과가 실제로 도착한 뒤 그 결과와 같은 색 세그먼트가 포인터(12시 방향)에 오도록
// 다음 회전각을 계산한다. 같은 색 세그먼트가 여러 개라 매번 다른 위치에 멈춰 단조롭지 않게 한다.
function computeNextRotation(currentRotation: number, win: boolean): number {
  const matchingCenters = SEGMENT_OUTCOMES
    .map((outcome, i) => ({ outcome, center: i * SEGMENT_DEG + SEGMENT_DEG / 2 }))
    .filter(s => s.outcome === (win ? 'win' : 'lose'))
    .map(s => s.center)
  const targetAngle = matchingCenters[Math.floor(Math.random() * matchingCenters.length)]

  const currentMod = ((currentRotation % 360) + 360) % 360
  const targetMod = (360 - targetAngle) % 360
  const delta = ((targetMod - currentMod) + 360) % 360

  const FULL_SPINS = 5 // 눈에 보이는 회전 바퀴 수(연출용, 최종 정지 위치와는 무관)
  return currentRotation + FULL_SPINS * 360 + delta
}

// 룰렛(베팅형 대결) 플레이 화면. 상대는 처음엔 랜덤이고, 원하면 다음 스핀부터 고정할 수 있다.
// 승률은 백엔드가 의도적으로 내려주지 않으므로 안내 문구에도 구체적 수치를 넣지 않는다.
export default function RouletteGame() {
  const { user, fetchUser } = useAuth()

  const [balance, setBalance] = useState<number | null>(null)
  const [config, setConfig] = useState<RouletteConfig | null>(null)
  const [opponent, setOpponent] = useState<RouletteOpponent | null>(null)
  const [opponentLoading, setOpponentLoading] = useState(true)

  const [betAmount, setBetAmount] = useState('')
  const [spinning, setSpinning] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<RouletteSpinResult | null>(null)
  const [lockPending, setLockPending] = useState(false)

  // 이메일 미인증으로 스핀이 막힌 경우에만 에러 문구 아래 "인증 메일 보내기" 액션을 같이 보여준다.
  const [emailGateHit, setEmailGateHit] = useState(false)
  const [verifySending, setVerifySending] = useState(false)
  const [verifySent, setVerifySent] = useState(false)

  const [rotation, setRotation] = useState(0)
  // 서버 응답은 이미 받았지만, 휠 애니메이션이 끝날 때까지 결과 공개를 미루기 위한 보관소.
  // ref인 이유: 값이 바뀌어도 리렌더가 필요 없고(공개 시점에만 state로 옮김), 이벤트 핸들러에서
  // 항상 최신 값을 읽어야 하기 때문(state였다면 클로저에 갇힌 stale 값을 볼 위험이 있다).
  const pendingResultRef = useRef<RouletteSpinResult | null>(null)
  // transitionend가 어떤 이유로든 안 걸리는 극단적 상황을 대비한 안전장치.
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false

    pointsApi.getBalance()
      .then(res => { if (!cancelled) setBalance(res.data?.balance ?? 0) })
      .catch(() => {})

    rouletteApi.getConfig()
      .then(res => {
        if (cancelled || !res.data) return
        setConfig(res.data)
        setBetAmount(String(res.data.minBet))
      })
      .catch(() => {})

    refreshOpponent()

    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    return () => {
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current)
    }
  }, [])

  function refreshOpponent() {
    setOpponentLoading(true)
    rouletteApi.getOpponent()
      .then(res => setOpponent(res.data ?? null))
      .catch(() => setOpponent(null))
      .finally(() => setOpponentLoading(false))
  }

  async function handleUnlock() {
    try {
      await rouletteApi.unlockOpponent()
      setOpponent(null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : MESSAGES.points.roulette.unlockFailed)
    }
  }

  async function handleLock(opponentId: number) {
    setLockPending(true)
    try {
      await rouletteApi.lockOpponent(opponentId)
      refreshOpponent()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : MESSAGES.points.roulette.lockFailed)
    } finally {
      setLockPending(false)
    }
  }

  // 휠 회전이 끝난 뒤(또는 안전장치 타이머가 먼저 울린 뒤) 보관해둔 결과를 실제로 반영한다.
  function revealPendingResult() {
    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current)
      revealTimeoutRef.current = null
    }
    const data = pendingResultRef.current
    pendingResultRef.current = null
    if (!data) return

    setResult(data)
    setBalance(data.balanceAfter)
    // 고정된 상대와 겨뤘다면 위쪽 상대 섹션도 최신 상태로 맞춘다(변동은 없지만 일관성 유지).
    if (data.opponentLocked) {
      setOpponent({ opponentId: data.opponentId, opponentNickname: data.opponentNickname })
    }
    setSpinning(false)
  }

  function handleWheelTransitionEnd(e: React.TransitionEvent<HTMLDivElement>) {
    if (e.propertyName !== 'transform') return
    revealPendingResult()
  }

  async function handleSendVerification() {
    setVerifySending(true)
    try {
      await authApi.requestEmailVerification()
      setVerifySent(true)
    } catch (e) {
      if (e instanceof ApiError && e.code === 'ALREADY_VERIFIED_EMAIL') {
        // 다른 탭/기기에서 이미 인증을 마친 경우. 최신 상태를 다시 받아오면 다음 스핀부터 정상 동작한다.
        await fetchUser()
        setError('')
        setEmailGateHit(false)
      } else if (e instanceof ApiError && e.code === 'INVALID_EMAIL_DOMAIN') {
        setError(MESSAGES.mypage.emailVerification.invalidDomain)
      } else {
        setError(e instanceof ApiError ? e.message : MESSAGES.mypage.emailVerification.sendFailed)
      }
    } finally {
      setVerifySending(false)
    }
  }

  async function handleSpin() {
    if (!config) return
    setError('')
    setEmailGateHit(false)

    if (!user?.emailVerified) {
      setError(MESSAGES.points.roulette.emailNotVerified)
      setEmailGateHit(true)
      return
    }

    const amount = Number(betAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError(MESSAGES.points.roulette.betRequired)
      return
    }
    if (amount < config.minBet || amount > config.maxBet) {
      setError(MESSAGES.points.roulette.betRange(config.minBet.toLocaleString(), config.maxBet.toLocaleString()))
      return
    }
    if (amount % config.betUnit !== 0) {
      setError(MESSAGES.points.roulette.betUnitMismatch(config.betUnit.toLocaleString()))
      return
    }

    setSpinning(true)
    setResult(null)
    try {
      const res = await rouletteApi.spin(amount)
      if (!res.data) {
        setSpinning(false)
        return
      }
      // 결과는 이미 알지만, 휠이 다 돌아갈 때까지는 화면에 반영하지 않는다(revealPendingResult에서 처리).
      pendingResultRef.current = res.data
      setRotation(prev => computeNextRotation(prev, res.data!.win))
      revealTimeoutRef.current = setTimeout(revealPendingResult, 2800)
    } catch (e) {
      setSpinning(false)
      setError(e instanceof ApiError ? e.message : MESSAGES.points.roulette.spinFailed)
    }
  }

  // 휠 세그먼트에 표시할 닉네임 8개. "여러 후보가 스쳐 지나가다 실제 상대에서 멈추는" 느낌을 위해
  // 진짜 상대 이름은 결과와 같은 색 세그먼트에만 넣고, 나머지는 자리표시자로 채운다.
  //  - 스핀 중(결과는 이미 받았지만 아직 공개 전): 실제 상대 닉네임 vs 자리표시자
  //  - 상대가 고정되어 있으면(다음 판도 확정): 모든 세그먼트에 그 닉네임을 보여준다
  //  - 그 외(대기 상태, 다음 상대 미정): 전부 자리표시자
  const pendingSpin = pendingResultRef.current
  const wheelLabels = pendingSpin
    ? SEGMENT_OUTCOMES.map(outcome =>
        outcome === (pendingSpin.win ? 'win' : 'lose') ? pendingSpin.opponentNickname : UNKNOWN_OPPONENT_LABEL
      )
    : opponent
      ? SEGMENT_OUTCOMES.map(() => opponent.opponentNickname)
      : SEGMENT_OUTCOMES.map(() => UNKNOWN_OPPONENT_LABEL)

  return (
    <div className="flex flex-col gap-6">
      {/* 잔액 */}
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/50">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">내 잔액</p>
        <p className="mt-1 text-2xl font-bold text-orange-600 dark:text-orange-400">
          {balance === null ? '—' : `${balance.toLocaleString()}P`}
        </p>
      </div>

      {/* 상대 */}
      <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">대결 상대</p>
        {opponentLoading ? (
          <p className="mt-1 text-sm text-neutral-400">불러오는 중…</p>
        ) : opponent ? (
          <div className="mt-1 flex items-center justify-between gap-3">
            <p className="text-sm text-neutral-800 dark:text-neutral-100">
              <span className="font-semibold">{opponent.opponentNickname}</span>님으로 고정됨
            </p>
            <button
              type="button"
              onClick={handleUnlock}
              disabled={spinning}
              className="shrink-0 rounded border border-neutral-300 px-2.5 py-1 text-xs text-neutral-600 hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              고정 해제
            </button>
          </div>
        ) : (
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {MESSAGES.points.roulette.randomOpponentHint}
          </p>
        )}
      </div>

      {/* 휠 + 베팅 */}
      <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <label htmlFor="bet-amount" className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
          배팅액
        </label>
        <input
          id="bet-amount"
          type="number"
          value={betAmount}
          onChange={e => setBetAmount(e.target.value)}
          step={config?.betUnit ?? 1}
          min={config?.minBet ?? 0}
          max={config?.maxBet ?? undefined}
          disabled={!config || spinning}
          className="mt-2 w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-blue-400 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-blue-500"
        />

        {/* 휠 본체. transform(회전각)만 인라인으로 매번 바뀌고, transition 자체는
            globals.css의 .roulette-wheel이 관리한다(reduced-motion에서 덮어쓸 수 있도록). */}
        <div className="relative mx-auto my-5 h-40 w-40">
          <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-full">
            <div className="h-0 w-0 border-x-8 border-t-[14px] border-x-transparent border-t-orange-500" />
          </div>
          <div
            onTransitionEnd={handleWheelTransitionEnd}
            style={{ transform: `rotate(${rotation}deg)`, background: WHEEL_BACKGROUND }}
            className="roulette-wheel relative h-40 w-40 overflow-hidden rounded-full border-4 border-white shadow-inner dark:border-neutral-900"
          >
            {wheelLabels.map((label, i) => {
              const angle = i * SEGMENT_DEG + SEGMENT_DEG / 2
              return (
                <span
                  key={i}
                  className="absolute left-1/2 top-1/2 w-12 text-center text-[9px] font-bold leading-tight text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]"
                  style={{ transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-56px)` }}
                >
                  {truncateForWheel(label)}
                </span>
              )
            })}
          </div>
          <div className="absolute inset-0 m-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-[10px] font-bold text-neutral-400 shadow dark:bg-neutral-900 dark:text-neutral-500">
            승 / 패
          </div>
        </div>

        <button
          type="button"
          onClick={handleSpin}
          disabled={!config || spinning}
          className="w-full rounded bg-orange-500 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {spinning ? '스핀 중…' : '스핀'}
        </button>

        {config && (
          <p className="mt-2 text-center text-[11px] text-neutral-400 dark:text-neutral-500">
            {config.betUnit.toLocaleString()}P 단위 · {config.minBet.toLocaleString()}P ~{' '}
            {config.maxBet.toLocaleString()}P · 수수료 {Math.round(config.feeRate * 100)}%
          </p>
        )}
        {error && (
          <div className="mt-2 text-center">
            <p className="text-xs text-red-500">{error}</p>
            {emailGateHit && (
              verifySent ? (
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  <strong>{user?.email}</strong> {MESSAGES.mypage.emailVerification.sentAfterEmail}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleSendVerification}
                  disabled={verifySending}
                  className="mt-1 text-xs font-medium text-orange-600 underline underline-offset-2 hover:text-orange-700 disabled:opacity-50 dark:text-orange-400"
                >
                  {verifySending ? '전송 중…' : '인증 메일 보내기'}
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* 결과 */}
      {result && (
        <div
          className={`animate-fade-in-up rounded-lg border p-4 ${
            result.win
              ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10'
              : 'border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10'
          }`}
        >
          <p
            className={`text-sm font-bold ${
              result.win ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
            }`}
          >
            {result.win
              ? MESSAGES.points.roulette.win(result.opponentNickname, result.resultAmount.toLocaleString())
              : MESSAGES.points.roulette.lose(result.opponentNickname, result.resultAmount.toLocaleString())}
          </p>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            수수료 {result.fee.toLocaleString()}P 차감 · 잔액 {result.balanceAfter.toLocaleString()}P
          </p>

          {!result.opponentLocked && (
            <button
              type="button"
              onClick={() => handleLock(result.opponentId)}
              disabled={lockPending}
              className="mt-3 rounded border border-orange-300 px-2.5 py-1 text-xs font-medium text-orange-600 hover:bg-orange-100 disabled:opacity-50 dark:border-orange-500/40 dark:text-orange-400 dark:hover:bg-orange-500/10"
            >
              {result.opponentNickname}님으로 고정하기
            </button>
          )}
        </div>
      )}
    </div>
  )
}
