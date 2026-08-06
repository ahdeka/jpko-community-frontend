'use client'

import { useEffect, useRef, useState } from 'react'
import { pointsApi } from '@/lib/api/points'
import { pachinkoApi } from '@/lib/api/pachinko'
import { authApi } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { useAuth } from '@/lib/auth-context'
import { MESSAGES } from '@/lib/messages'
import type { PachinkoConfig, PachinkoPlayResult } from '@/types'

// 보드 픽셀 치수. rows는 백엔드 설정값이라 가변이지만, 폭/행 높이는 고정폭 보드 안에서
// 슬롯 개수(rows+1)에 맞춰 슬롯 폭만 계산해 나눈다.
const BOARD_WIDTH = 280
const ROW_HEIGHT = 26
const BALL_SIZE = 14
const DROP_DURATION_MS = 2400
const REDUCED_MOTION_DURATION_MS = 400
// transitionend/animation.onfinish가 어떤 이유로든 안 걸리는 극단적 상황을 대비한 안전장치.
const REVEAL_SAFETY_MARGIN_MS = 400

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// bounces(좌/우 순서)로부터 구슬이 각 못 행을 지날 때의 x좌표를 계산해 Web Animations API용
// keyframe 배열을 만든다. 매 튕김마다 슬롯 폭의 절반씩 좌/우로 이동하며, 이 누적 이동량은
// 백엔드가 계산한 slotIndex(우측으로 튕긴 횟수)가 가리키는 슬롯 중앙과 수학적으로 항상 일치한다
// (슬롯 개수 = rows+1이므로 시작점이 정확히 가운데 슬롯들 사이에 오기 때문).
function computeBallKeyframes(bounces: boolean[]): Keyframe[] {
  const rows = bounces.length
  const slotWidth = BOARD_WIDTH / (rows + 1)
  let x = BOARD_WIDTH / 2
  const keyframes: Keyframe[] = [
    { transform: `translate(${x - BALL_SIZE / 2}px, 0px)`, offset: 0 },
  ]
  bounces.forEach((right, i) => {
    x += right ? slotWidth / 2 : -slotWidth / 2
    const y = (i + 1) * ROW_HEIGHT
    keyframes.push({ transform: `translate(${x - BALL_SIZE / 2}px, ${y}px)`, offset: (i + 1) / rows })
  })
  return keyframes
}

// 못 행(row)의 각 못 x좌표. row i(0-indexed)에는 i+1개의 못이, 구슬이 그 행을 지날 때 가능한
// 위치들과 같은 격자 위에 놓인다.
function pegPositions(row: number, rows: number): number[] {
  const slotWidth = BOARD_WIDTH / (rows + 1)
  return Array.from({ length: row + 1 }, (_, k) => BOARD_WIDTH / 2 + (2 * k - row) * (slotWidth / 2))
}

// 파칭코(플린코형 구슬 낙하) 플레이 화면. 유저 대 시스템(하우스) 게임이라 룰렛과 달리 상대가 없다.
// 배당표(슬롯별 배율)는 백엔드가 의도적으로 노출하지만, 못의 좌/우 확률은 노출하지 않는다.
export default function PachinkoGame() {
  const { user, fetchUser } = useAuth()

  const [balance, setBalance] = useState<number | null>(null)
  const [config, setConfig] = useState<PachinkoConfig | null>(null)

  const [betAmount, setBetAmount] = useState('')
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<PachinkoPlayResult | null>(null)

  // 이메일 미인증으로 플레이가 막힌 경우에만 에러 문구 아래 "인증 메일 보내기" 액션을 같이 보여준다.
  const [emailGateHit, setEmailGateHit] = useState(false)
  const [verifySending, setVerifySending] = useState(false)
  const [verifySent, setVerifySent] = useState(false)

  const ballRef = useRef<HTMLDivElement>(null)
  // 서버 응답은 이미 받았지만, 구슬 낙하 애니메이션이 끝날 때까지 결과 공개를 미루기 위한 보관소.
  const pendingResultRef = useRef<PachinkoPlayResult | null>(null)
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false

    pointsApi.getBalance()
      .then(res => { if (!cancelled) setBalance(res.data?.balance ?? 0) })
      .catch(() => {})

    pachinkoApi.getConfig()
      .then(res => {
        if (cancelled || !res.data) return
        setConfig(res.data)
        setBetAmount(String(res.data.minBet))
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    return () => {
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current)
    }
  }, [])

  // 애니메이션이 끝난 뒤(또는 안전장치 타이머가 먼저 울린 뒤) 보관해둔 결과를 실제로 반영한다.
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
    setPlaying(false)
  }

  async function handleSendVerification() {
    setVerifySending(true)
    try {
      await authApi.requestEmailVerification()
      setVerifySent(true)
    } catch (e) {
      if (e instanceof ApiError && e.code === 'ALREADY_VERIFIED_EMAIL') {
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

  async function handlePlay() {
    if (!config) return
    setError('')
    setEmailGateHit(false)

    if (!user?.emailVerified) {
      setError(MESSAGES.points.pachinko.emailNotVerified)
      setEmailGateHit(true)
      return
    }

    const amount = Number(betAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError(MESSAGES.points.pachinko.betRequired)
      return
    }
    if (amount < config.minBet || amount > config.maxBet) {
      setError(MESSAGES.points.pachinko.betRange(config.minBet.toLocaleString(), config.maxBet.toLocaleString()))
      return
    }
    if (amount % config.betUnit !== 0) {
      setError(MESSAGES.points.pachinko.betUnitMismatch(config.betUnit.toLocaleString()))
      return
    }

    setPlaying(true)
    setResult(null)
    try {
      const res = await pachinkoApi.play(amount)
      if (!res.data) {
        setPlaying(false)
        return
      }
      const data = res.data
      pendingResultRef.current = data

      const keyframes = computeBallKeyframes(data.bounces)
      const duration = prefersReducedMotion() ? REDUCED_MOTION_DURATION_MS : DROP_DURATION_MS
      const animation = ballRef.current?.animate(keyframes, { duration, easing: 'ease-in', fill: 'forwards' })
      if (animation) {
        animation.onfinish = revealPendingResult
      }
      revealTimeoutRef.current = setTimeout(revealPendingResult, duration + REVEAL_SAFETY_MARGIN_MS)
    } catch (e) {
      setPlaying(false)
      setError(e instanceof ApiError ? e.message : MESSAGES.points.pachinko.playFailed)
    }
  }

  const rows = config?.rows ?? 0
  const slotCount = rows + 1
  const slotWidth = BOARD_WIDTH / Math.max(slotCount, 1)
  const boardHeight = rows * ROW_HEIGHT

  return (
    <div className="flex flex-col gap-6">
      {/* 잔액 */}
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/50">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">내 잔액</p>
        <p className="mt-1 text-2xl font-bold text-orange-600 dark:text-orange-400">
          {balance === null ? '—' : `${balance.toLocaleString()}P`}
        </p>
      </div>

      {/* 보드 + 베팅 */}
      <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <label htmlFor="pachinko-bet-amount" className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
          배팅액
        </label>
        <input
          id="pachinko-bet-amount"
          type="number"
          value={betAmount}
          onChange={e => setBetAmount(e.target.value)}
          step={config?.betUnit ?? 1}
          min={config?.minBet ?? 0}
          max={config?.maxBet ?? undefined}
          disabled={!config || playing}
          className="mt-2 w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-blue-400 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-blue-500"
        />

        {config && (
          <div className="relative mx-auto my-5" style={{ width: BOARD_WIDTH, height: boardHeight }}>
            {/* 못 */}
            {Array.from({ length: rows }, (_, row) => (
              <div key={row}>
                {pegPositions(row, rows).map((x, k) => (
                  <span
                    key={k}
                    className="absolute h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-neutral-300 dark:bg-neutral-600"
                    style={{ left: x, top: row * ROW_HEIGHT + ROW_HEIGHT / 2 }}
                  />
                ))}
              </div>
            ))}

            {/* 구슬 */}
            <div
              ref={ballRef}
              className="absolute h-3.5 w-3.5 rounded-full bg-orange-500 shadow"
              style={{ transform: `translate(${BOARD_WIDTH / 2 - BALL_SIZE / 2}px, 0px)` }}
            />
          </div>
        )}

        {/* 배당표(슬롯) — 실물 플린코판처럼 항상 노출한다 */}
        {config && (
          <div className="relative mx-auto" style={{ width: BOARD_WIDTH, height: 28 }}>
            {config.slotMultipliers.map((m, i) => {
              const landed = result != null && !playing && result.slotIndex === i
              return (
                <div
                  key={i}
                  className={`absolute flex h-7 items-center justify-center rounded text-[10px] font-bold ${
                    landed
                      ? 'bg-orange-500 text-white'
                      : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                  }`}
                  style={{ left: i * slotWidth + 1, width: slotWidth - 2 }}
                >
                  {m}x
                </div>
              )
            })}
          </div>
        )}

        <button
          type="button"
          onClick={handlePlay}
          disabled={!config || playing}
          className="mt-4 w-full rounded bg-orange-500 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {playing ? '구슬 낙하 중…' : '구슬 던지기'}
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
      {result && !playing && (
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
              ? MESSAGES.points.pachinko.win(Math.abs(result.netAmount).toLocaleString())
              : MESSAGES.points.pachinko.lose(Math.abs(result.netAmount).toLocaleString())}
          </p>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            수수료 {result.fee.toLocaleString()}P 차감 · 배율 {result.multiplier}x · 잔액{' '}
            {result.balanceAfter.toLocaleString()}P
          </p>
        </div>
      )}
    </div>
  )
}
