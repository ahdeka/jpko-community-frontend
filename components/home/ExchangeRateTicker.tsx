'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import type { RatePair } from '@/lib/exchange-rate'

// 환율 위젯 본문: 통화쌍(엔/원 → 달러/엔)을 ROTATE_MS마다 번갈아 보여준다.
// 데이터는 서버 컴포넌트(ExchangeRateSection)가 캐시에서 꺼내 넘겨주므로, 여기서는 API를 부르지 않는다.
//
// 자동 전환 화면의 접근성 규칙(WCAG 2.2.2: 자동으로 움직이는 콘텐츠는 멈출 수 있어야 함):
//  - 마우스를 올리거나 키보드로 포커스가 들어오면 멈춘다(읽는 도중 바뀌지 않게).
//  - 아래 점 버튼으로 원하는 통화쌍을 직접 고를 수 있다. 고르면 그 시점부터 다시 주기를 센다.
//  - OS의 "동작 줄이기"(prefers-reduced-motion)를 켠 사용자에게는 자동 전환하지 않는다.
//  - 바뀔 때마다 스크린리더가 읽어대지 않도록 aria-live는 걸지 않는다(점 버튼으로 직접 탐색).

// 전환 주기 7초. 5초는 숫자 + 변동률을 읽고 비교하기엔 빠듯하고(모바일은 hover로 멈출 수도 없다),
// 10초는 메인을 잠깐 훑고 지나가는 방문자가 두 번째 통화쌍을 못 보고 떠날 확률이 커진다.
const ROTATE_MS = 7000

// prefers-reduced-motion 구독. useEffect 안에서 matchMedia 결과를 setState하면 마운트 직후
// 동기 setState(set-state-in-effect 규칙 위반)가 되므로, 외부 저장소 구독 훅으로 읽는다.
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
function subscribeReducedMotion(onChange: () => void) {
  const mql = window.matchMedia(REDUCED_MOTION_QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}
const getReducedMotion = () => window.matchMedia(REDUCED_MOTION_QUERY).matches
// 서버 렌더 시에는 알 수 없으므로 "줄이기 아님"으로 그린다. 첫 화면은 어차피 0번 슬라이드라
// 하이드레이션 후 값이 달라져도 깜빡임 없이 자동 전환 여부만 바뀐다.
const getReducedMotionOnServer = () => false

function formatNumber(n: number, fractionDigits: number) {
  return n.toLocaleString('ko-KR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

export default function ExchangeRateTicker({ pairs }: { pairs: RatePair[] }) {
  const [index, setIndex] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getReducedMotionOnServer,
  )

  const paused = hovered || focused || reducedMotion
  const count = pairs.length

  // setInterval이 아니라 index가 바뀔 때마다 새 setTimeout을 건다. 이렇게 하면 점 버튼으로 직접
  // 골랐을 때(index 변경) 타이머가 자연스럽게 초기화되어, 고르자마자 바로 넘어가 버리는 일이 없다.
  // setState는 타이머 콜백(외부 이벤트)에서만 일어나므로 effect 본문 동기 setState가 아니다.
  useEffect(() => {
    if (paused || count < 2) return
    const timer = setTimeout(() => setIndex(i => (i + 1) % count), ROTATE_MS)
    return () => clearTimeout(timer)
  }, [index, paused, count])

  // pairs가 비는 경우는 상위에서 걸러지지만, 길이가 줄어 index가 범위를 벗어나도 안전하게 0번을 쓴다.
  const pair = pairs[index] ?? pairs[0]
  if (!pair) return null

  // 한국 시세 표기 관례: 상승은 빨강 ▲, 하락은 파랑 ▼.
  const direction =
    pair.change === null || pair.change === 0 ? 'flat' : pair.change > 0 ? 'up' : 'down'
  const changeClass =
    direction === 'up'
      ? 'text-red-500 dark:text-red-400'
      : direction === 'down'
        ? 'text-blue-500 dark:text-blue-400'
        : 'text-neutral-400 dark:text-neutral-500'
  const arrow = direction === 'up' ? '▲' : direction === 'down' ? '▼' : '-'

  return (
    <div
      // mouseenter 대신 pointer 이벤트 + pointerType 검사: 모바일 브라우저는 탭할 때 mouseenter를
      // 흉내 내고 mouseleave는 다른 곳을 탭할 때까지 안 보내서, 한 번 탭하면 계속 멈춰 버린다.
      onPointerEnter={e => {
        if (e.pointerType === 'mouse') setHovered(true)
      }}
      onPointerLeave={e => {
        if (e.pointerType === 'mouse') setHovered(false)
      }}
      // 키보드 포커스(:focus-visible)일 때만 멈춘다. 마우스 클릭·모바일 탭으로 점을 누르면 버튼에
      // 포커스가 남는데, 이것까지 멈춤으로 치면 모바일에서 한 번 누른 뒤로 영영 안 넘어간다.
      // (데스크톱 마우스는 hover로 이미 멈춰 있다.)
      onFocus={e => {
        if (e.target.matches(':focus-visible')) setFocused(true)
      }}
      onBlur={e => {
        // 점 버튼끼리 포커스가 옮겨갈 때는 계속 멈춰 있어야 하므로, 영역 밖으로 나갈 때만 해제한다.
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false)
      }}
    >
      {/* 두 통화쌍이 같은 줄 구성이라 바뀌어도 카드 높이가 변하지 않는다(레이아웃 흔들림 없음).
          표기 규칙 — 정보마다 한 번씩만 말한다:
           - 왼쪽(기준 통화) = 수량 + 통화 코드 "100 JPY". 무슨 통화인지 국적 불문 확실히 알려주는 자리.
           - 오른쪽(환산 값) = 기호 + 숫자 "₩861.28". 기호가 숫자에 붙어야 "돈"으로 한눈에 읽힌다.
          기호·코드를 양쪽에 다 붙이면(¥100 JPY = ₩861.28 KRW) 같은 정보가 네 번 반복돼 숫자가 묻힌다.
          key={pair.id}: 통화쌍이 바뀌면 요소를 새로 마운트해 rate-swap 애니메이션을 다시 재생한다. */}
      <div key={pair.id} className="animate-rate-swap flex items-baseline justify-between gap-2">
        <span className="text-sm tabular-nums text-neutral-500 dark:text-neutral-400">
          {formatNumber(pair.base.amount, 0)} {pair.base.code}
        </span>
        <span className="text-xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
          {pair.quote.symbol}
          {formatNumber(pair.rate, 2)}
        </span>
      </div>

      <div className="mt-0.5 flex items-center justify-between gap-2">
        {/* 점 버튼: 현재 위치 표시 + 직접 선택. 터치 영역 확보를 위해 버튼은 점보다 크게 잡는다. */}
        {count > 1 ? (
          <div className="flex items-center">
            {pairs.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${p.label} 환율 보기`}
                aria-current={i === index ? 'true' : undefined}
                className="flex h-5 w-5 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60"
              >
                <span
                  className={`block h-1.5 w-1.5 rounded-full ${
                    i === index
                      ? 'bg-neutral-500 dark:bg-neutral-300'
                      : 'bg-neutral-300 dark:bg-neutral-600'
                  }`}
                />
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}

        {/* 직전 영업일을 못 찾았으면(change=null) 변동 줄을 생략한다 — 0으로 보이면 "변동 없음"으로 오해된다. */}
        {pair.change !== null && pair.changePercent !== null && (
          // 점 버튼은 고정하고 값(변동률)만 위 줄과 함께 바뀌어 보이도록 같은 key·애니메이션을 준다.
          <p key={pair.id} className={`animate-rate-swap text-xs tabular-nums ${changeClass}`}>
            전일 대비 {arrow} {formatNumber(Math.abs(pair.change), 2)} (
            {pair.changePercent > 0 ? '+' : ''}
            {pair.changePercent.toFixed(2)}%)
          </p>
        )}
      </div>
    </div>
  )
}
