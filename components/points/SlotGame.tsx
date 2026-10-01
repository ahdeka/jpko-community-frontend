'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { pointsApi, notifyPointBalanceChanged } from '@/lib/api/points'
import { slotApi } from '@/lib/api/slot'
import { ApiError } from '@/lib/api/client'
import { MESSAGES } from '@/lib/messages'
import GameOddsPanel, { GameLayoutWithOdds } from './GameOddsPanel'
import type { SlotConfig, SlotPlayResult } from '@/types'

// 백엔드 심볼 이름 문자열 -> 화면 표시용 매핑. 목록에 없는(향후 추가된) 심볼은 이름 그대로 보여준다.
const SYMBOL_DISPLAY: Record<string, string> = {
  CHERRY: '🍒',
  BELL: '🔔',
  BAR: '🎰',
  SEVEN: '7️⃣',
}
function displaySymbol(name: string): string {
  return SYMBOL_DISPLAY[name] ?? name
}

const SYMBOL_HEIGHT = 56
const STRIP_LENGTH = 24 // 마지막 한 칸만 서버가 정한 결과, 나머지는 연출용 랜덤 채움
// 릴마다 정지 시각을 다르게 둬(1번 릴 먼저 정지 -> 3번 릴 마지막 정지) 클래식 슬롯머신 느낌을 낸다.
const REEL_BASE_DURATION_MS = 1600
const REEL_STAGGER_MS = 500
const REDUCED_MOTION_DURATION_MS = 300
// animation.onfinish가 어떤 이유로든 안 걸리는 극단적 상황을 대비한 안전장치.
const REVEAL_SAFETY_MARGIN_MS = 400

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// 마지막 칸이 finalSymbol이 되도록 나머지 칸은 연출용으로 무작위 채운 릴 스트립을 만든다.
function buildReelStrip(finalSymbol: string, allSymbolNames: string[]): string[] {
  const strip: string[] = []
  for (let i = 0; i < STRIP_LENGTH - 1; i++) {
    strip.push(allSymbolNames[Math.floor(Math.random() * allSymbolNames.length)])
  }
  strip.push(finalSymbol)
  return strip
}

// 한 판 결과를 이익/본전/손실로 가른다. 백엔드의 win·netAmount는 "payout > 0" 기준이라 배율 1x(본전)도
// win=true, netAmount=payout으로 온다 — 그대로 쓰면 본전을 "1,000P 벌음"으로 잘못 보여준다.
// 그래서 실제 순이익(payout - betAmount)으로 판정한다. 수수료는 결과 아래 줄에 따로 표시한다.
type SlotOutcome = 'win' | 'even' | 'lose'
function slotOutcome(r: SlotPlayResult): SlotOutcome {
  const profit = r.payout - r.betAmount
  if (profit > 0) return 'win'
  if (profit === 0) return 'even'
  return 'lose'
}
const OUTCOME_BOX_CLASS: Record<SlotOutcome, string> = {
  win: 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10',
  even: 'border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50',
  lose: 'border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10',
}
const OUTCOME_TEXT_CLASS: Record<SlotOutcome, string> = {
  win: 'text-emerald-700 dark:text-emerald-400',
  even: 'text-neutral-700 dark:text-neutral-200',
  lose: 'text-red-700 dark:text-red-400',
}
function outcomeMessage(r: SlotPlayResult, outcome: SlotOutcome): string {
  if (outcome === 'win') return MESSAGES.points.slot.win((r.payout - r.betAmount).toLocaleString())
  if (outcome === 'even') return MESSAGES.points.slot.breakEven(r.payout.toLocaleString())
  return MESSAGES.points.slot.lose((r.betAmount - r.payout).toLocaleString())
}

// 슬롯머신(3릴, 트리플 매치만 당첨) 플레이 화면. 유저 대 시스템(하우스) 게임이라 룰렛과 달리 상대가 없다.
// ranking: 게임 페이지(서버)가 넘겨주는 포인트 랭킹 패널. 우측 칸 확률 표 위에 그린다(GameLayoutWithOdds 참고).
export default function SlotGame({ ranking }: { ranking?: ReactNode }) {
  const [balance, setBalance] = useState<number | null>(null)
  const [config, setConfig] = useState<SlotConfig | null>(null)

  const [betAmount, setBetAmount] = useState('')
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<SlotPlayResult | null>(null)

  // 릴 3개의 스트립(각 칸에 표시할 심볼 이름). 처음엔 빈 스트립(첫 심볼 하나만 정지 표시).
  const [reelStrips, setReelStrips] = useState<string[][]>([[], [], []])
  const reelInnerRefs = useRef<(HTMLDivElement | null)[]>([null, null, null])
  const pendingResultRef = useRef<SlotPlayResult | null>(null)
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false

    pointsApi.getBalance()
      .then(res => { if (!cancelled) setBalance(res.data?.balance ?? 0) })
      .catch(() => {})

    slotApi.getConfig()
      .then(res => {
        if (cancelled || !res.data) return
        setConfig(res.data)
        setBetAmount(String(res.data.minBet))
        const firstSymbol = res.data.symbols[0]?.name ?? ''
        setReelStrips([[firstSymbol], [firstSymbol], [firstSymbol]])
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    return () => {
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current)
    }
  }, [])

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

    const amount = Number(betAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError(MESSAGES.points.slot.betRequired)
      return
    }
    if (amount < config.minBet || amount > config.maxBet) {
      setError(MESSAGES.points.slot.betRange(config.minBet.toLocaleString(), config.maxBet.toLocaleString()))
      return
    }
    if (amount % config.betUnit !== 0) {
      setError(MESSAGES.points.slot.betUnitMismatch(config.betUnit.toLocaleString()))
      return
    }

    setPlaying(true)
    setResult(null)
    try {
      const res = await slotApi.play(amount)
      if (!res.data) {
        setPlaying(false)
        return
      }
      const data = res.data
      pendingResultRef.current = data

      const allSymbolNames = config.symbols.map(s => s.name)
      const strips = data.symbols.map(finalSymbol => buildReelStrip(finalSymbol, allSymbolNames))
      setReelStrips(strips)

      const reduced = prefersReducedMotion()
      let maxDuration = 0
      // 다음 렌더에서 스트립 DOM이 반영된 뒤 애니메이션을 걸어야 최종 위치가 어긋나지 않는다.
      requestAnimationFrame(() => {
        strips.forEach((strip, i) => {
          const duration = reduced
            ? REDUCED_MOTION_DURATION_MS
            : REEL_BASE_DURATION_MS + i * REEL_STAGGER_MS
          maxDuration = Math.max(maxDuration, duration)

          const el = reelInnerRefs.current[i]
          if (!el) return
          const finalY = -(strip.length - 1) * SYMBOL_HEIGHT
          const animation = el.animate(
            [
              { transform: 'translateY(0px)' },
              { transform: `translateY(${finalY}px)` },
            ],
            { duration, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)', fill: 'forwards' }
          )
          if (i === strips.length - 1) {
            animation.onfinish = revealPendingResult
          }
        })
        revealTimeoutRef.current = setTimeout(revealPendingResult, maxDuration + REVEAL_SAFETY_MARGIN_MS)
      })
    } catch (e) {
      setPlaying(false)
      setError(e instanceof ApiError ? e.message : MESSAGES.points.slot.playFailed)
    }
  }

  // 확률 공개 패널. 구버전 백엔드 응답이라 확률 필드가 비어 있으면 패널 자체를 숨긴다(NaN% 방지).
  const hasOdds = config?.symbols.every(s => typeof s.tripleProbability === 'number') ?? false
  const oddsPanel = config && hasOdds ? (
    <GameOddsPanel
      headers={[MESSAGES.points.odds.outcomeHeader, MESSAGES.points.odds.multiplierHeader]}
      rows={config.symbols.map(s => ({
        key: s.name,
        cells: [`${displaySymbol(s.name)} x3`, `${s.multiplier}x`],
        probability: s.tripleProbability ?? 0,
      }))}
    />
  ) : null

  const outcome = result ? slotOutcome(result) : null

  return (
    <GameLayoutWithOdds odds={oddsPanel} ranking={ranking}>
      <div className="flex flex-col gap-6">
        {/* 잔액 */}
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/50">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">내 잔액</p>
          <p className="mt-1 text-2xl font-bold text-orange-600 dark:text-orange-400">
            {balance === null ? '—' : `${balance.toLocaleString()}P`}
          </p>
        </div>

        {/* 릴 + 베팅 */}
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <label htmlFor="slot-bet-amount" className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            배팅액
          </label>
          <input
            id="slot-bet-amount"
            type="number"
            value={betAmount}
            onChange={e => setBetAmount(e.target.value)}
            step={config?.betUnit ?? 1}
            min={config?.minBet ?? 0}
            max={config?.maxBet ?? undefined}
            disabled={!config || playing}
            className="mt-2 w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-blue-400 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-blue-500"
          />

          <div className="mx-auto my-5 flex w-fit gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900">
            {reelStrips.map((strip, i) => (
              <div
                key={i}
                className="overflow-hidden rounded bg-white dark:bg-neutral-800"
                style={{ width: SYMBOL_HEIGHT, height: SYMBOL_HEIGHT }}
              >
                <div ref={el => { reelInnerRefs.current[i] = el }}>
                  {strip.map((name, j) => (
                    <div
                      key={j}
                      className="flex items-center justify-center text-2xl"
                      style={{ height: SYMBOL_HEIGHT }}
                    >
                      {displaySymbol(name)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 배당표(심볼별 트리플 배율) — 실물 슬롯머신처럼 항상 노출한다 */}
          {config && (
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-neutral-500 dark:text-neutral-400">
              {config.symbols.map(s => (
                <span key={s.name}>
                  {displaySymbol(s.name)} x3 = {s.multiplier}x
                </span>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={handlePlay}
            disabled={!config || playing}
            className="mt-4 w-full rounded bg-orange-500 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {playing ? '릴 회전 중…' : '릴 돌리기'}
          </button>

          {config && (
            <p className="mt-2 text-center text-[11px] text-neutral-400 dark:text-neutral-500">
              {config.betUnit.toLocaleString()}P 단위 · {config.minBet.toLocaleString()}P ~{' '}
              {config.maxBet.toLocaleString()}P · 수수료 {Math.round(config.feeRate * 100)}%
            </p>
          )}
          {error && <p className="mt-2 text-center text-xs text-red-500">{error}</p>}
        </div>

        {/* 결과 */}
        {result && outcome && !playing && (
          <div className={`animate-fade-in-up rounded-lg border p-4 ${OUTCOME_BOX_CLASS[outcome]}`}>
            <p className={`text-sm font-bold ${OUTCOME_TEXT_CLASS[outcome]}`}>
              {outcomeMessage(result, outcome)}
            </p>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              수수료 {result.fee.toLocaleString()}P 차감 · 배율 {result.multiplier}x · 잔액{' '}
              {result.balanceAfter.toLocaleString()}P
            </p>
          </div>
        )}
      </div>
    </GameLayoutWithOdds>
  )
}
