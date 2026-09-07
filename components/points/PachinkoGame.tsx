'use client'

import { useEffect, useRef, useState } from 'react'
import { pointsApi, notifyPointBalanceChanged } from '@/lib/api/points'
import { pachinkoApi } from '@/lib/api/pachinko'
import { ApiError } from '@/lib/api/client'
import { MESSAGES } from '@/lib/messages'
import type { PachinkoConfig, PachinkoPlayResult } from '@/types'

// 보드 픽셀 치수. rows는 백엔드 설정값이라 가변이지만, 폭/행 높이는 고정폭 보드 안에서
// 슬롯 개수(rows+1)에 맞춰 슬롯 폭만 계산해 나눈다.
const BOARD_WIDTH = 280
const ROW_HEIGHT = 26
const BALL_SIZE = 14
const DROP_DURATION_MS = 2400
const REDUCED_MOTION_DURATION_MS = 400
// 구슬 사이 발사 시차. 개수가 많아도 전체 지연이 과하게 길어지지 않도록 상한을 둔다.
const MAX_STAGGER_SPREAD_MS = 1200
const MAX_STAGGER_PER_BALL_MS = 40
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
// 구슬 1개당 가격(ballPrice)이 정해져 있고, 유저가 고른 개수(ballCount)만큼 구슬을 동시에(약간의
// 시차를 두고) 쏴서 각자 독립적으로 못판을 통과해 슬롯에 착지한 결과를 합산해 보여준다.
// 배당표(슬롯별 배율)는 백엔드가 의도적으로 노출하지만, 못의 좌/우 확률은 노출하지 않는다.
export default function PachinkoGame() {
  const [balance, setBalance] = useState<number | null>(null)
  const [config, setConfig] = useState<PachinkoConfig | null>(null)

  const [ballCountInput, setBallCountInput] = useState('')
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<PachinkoPlayResult | null>(null)
  // 애니메이션에 렌더링할 구슬 개수. 응답을 받기 전부터 보드에 구슬 div를 준비해둬야 하므로
  // result와 별도로 들고 있는다(플레이 시작 시 요청한 개수로 세팅, 다음 플레이 전까지 유지).
  const [ballsInFlight, setBallsInFlight] = useState(0)

  const ballRefs = useRef<(HTMLDivElement | null)[]>([])
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
        setBallCountInput(String(res.data.minBalls))
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
    // 헤더 등 다른 곳의 잔액 표시도 새로고침 없이 즉시 맞춘다.
    notifyPointBalanceChanged(data.balanceAfter)
    setPlaying(false)
  }

  async function handlePlay() {
    if (!config) return
    setError('')

    const ballCount = Number(ballCountInput)
    if (!Number.isInteger(ballCount) || ballCount <= 0) {
      setError(MESSAGES.points.pachinko.ballCountRequired)
      return
    }
    if (ballCount < config.minBalls || ballCount > config.maxBalls) {
      setError(MESSAGES.points.pachinko.ballCountRange(String(config.minBalls), String(config.maxBalls)))
      return
    }

    setPlaying(true)
    setResult(null)
    setBallsInFlight(ballCount)
    try {
      const res = await pachinkoApi.play(ballCount)
      if (!res.data) {
        setPlaying(false)
        return
      }
      const data = res.data
      pendingResultRef.current = data

      const reduced = prefersReducedMotion()
      const duration = reduced ? REDUCED_MOTION_DURATION_MS : DROP_DURATION_MS
      const staggerMs = reduced
        ? 0
        : Math.min(MAX_STAGGER_PER_BALL_MS, ballCount > 1 ? MAX_STAGGER_SPREAD_MS / ballCount : 0)

      // 다음 렌더에서 구슬 div가 반영된 뒤 애니메이션을 걸어야 최종 위치가 어긋나지 않는다.
      requestAnimationFrame(() => {
        data.balls.forEach((ball, i) => {
          const el = ballRefs.current[i]
          if (!el) return
          const keyframes = computeBallKeyframes(ball.bounces)
          const delay = i * staggerMs
          const animation = el.animate(keyframes, { duration, delay, easing: 'ease-in', fill: 'forwards' })
          if (i === data.balls.length - 1) {
            animation.onfinish = revealPendingResult
          }
        })
        const maxDelay = (data.balls.length - 1) * staggerMs
        revealTimeoutRef.current = setTimeout(revealPendingResult, maxDelay + duration + REVEAL_SAFETY_MARGIN_MS)
      })
    } catch (e) {
      setPlaying(false)
      setError(e instanceof ApiError ? e.message : MESSAGES.points.pachinko.playFailed)
    }
  }

  const rows = config?.rows ?? 0
  const slotCount = rows + 1
  const slotWidth = BOARD_WIDTH / Math.max(slotCount, 1)
  const boardHeight = rows * ROW_HEIGHT

  const ballCountNumber = Number(ballCountInput)
  const totalCost =
    config && Number.isFinite(ballCountNumber) && ballCountNumber > 0
      ? ballCountNumber * config.ballPrice
      : null

  // 슬롯별 착지 개수. 여러 구슬이 서로 다른 슬롯에 떨어질 수 있으므로 배율 하나만 강조하던 이전과
  // 달리 슬롯마다 몇 개가 착지했는지 함께 보여준다.
  const landedCounts =
    result && !playing
      ? config?.slotMultipliers.map((_, i) => result.balls.filter(b => b.slotIndex === i).length)
      : undefined

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
        <label htmlFor="pachinko-ball-count" className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
          구슬 개수
        </label>
        <input
          id="pachinko-ball-count"
          type="number"
          value={ballCountInput}
          onChange={e => setBallCountInput(e.target.value)}
          step={1}
          min={config?.minBalls ?? 1}
          max={config?.maxBalls ?? undefined}
          disabled={!config || playing}
          className="mt-2 w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-blue-400 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-blue-500"
        />
        {totalCost !== null && (
          <p className="mt-1 text-right text-[11px] text-neutral-400 dark:text-neutral-500">
            총 비용 {totalCost.toLocaleString()}P
          </p>
        )}

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

            {/* 구슬들 — 요청한 개수만큼 렌더링, 각자 서버가 정한 경로로 낙하한다 */}
            {Array.from({ length: ballsInFlight }, (_, i) => (
              <div
                key={i}
                ref={el => { ballRefs.current[i] = el }}
                className="absolute h-3.5 w-3.5 rounded-full bg-orange-500 shadow"
                style={{ transform: `translate(${BOARD_WIDTH / 2 - BALL_SIZE / 2}px, 0px)` }}
              />
            ))}
          </div>
        )}

        {/* 배당표(슬롯) — 실물 플린코판처럼 항상 노출한다. 착지 개수가 있으면 함께 표시. */}
        {config && (
          <div className="relative mx-auto" style={{ width: BOARD_WIDTH, height: 28 }}>
            {config.slotMultipliers.map((m, i) => {
              const count = landedCounts?.[i] ?? 0
              return (
                <div
                  key={i}
                  className={`absolute flex h-7 flex-col items-center justify-center rounded text-[10px] font-bold leading-tight ${
                    count > 0
                      ? 'bg-orange-500 text-white'
                      : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                  }`}
                  style={{ left: i * slotWidth + 1, width: slotWidth - 2 }}
                >
                  <span>{m}x</span>
                  {count > 0 && <span className="text-[9px] font-normal">{count}개</span>}
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
          {playing ? '구슬 낙하 중…' : '구슬 쏘기'}
        </button>

        {config && (
          <p className="mt-2 text-center text-[11px] text-neutral-400 dark:text-neutral-500">
            구슬 개당 {config.ballPrice.toLocaleString()}P · {config.minBalls.toLocaleString()}개 ~{' '}
            {config.maxBalls.toLocaleString()}개 · 수수료 {Math.round(config.feeRate * 100)}%
          </p>
        )}
        {error && <p className="mt-2 text-center text-xs text-red-500">{error}</p>}
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
            구슬 {result.ballCount}개 · 총 비용 {result.totalCost.toLocaleString()}P · 수수료{' '}
            {result.fee.toLocaleString()}P 차감 · 총 획득 {result.totalPayout.toLocaleString()}P · 잔액{' '}
            {result.balanceAfter.toLocaleString()}P
          </p>
        </div>
      )}
    </div>
  )
}
