import type { ReactNode } from 'react'
import { MESSAGES } from '@/lib/messages'

// 게임센터 각 게임 우측의 "확률 공개" 패널(룰렛·파칭코·슬롯 공통, 표시 전용).
// 확률·배율은 전부 각 게임의 서버 config 응답에서 오고, 이 컴포넌트는 포맷만 한다.

// cells: 확률 앞에 오는 열들의 값(headers와 같은 순서·개수). 마지막 열은 항상 확률.
export interface OddsRow {
  key: string
  cells: string[]
  probability: number  // 0~1
}

// 확률(0~1) → 퍼센트 문자열. 유효숫자 3자리만 남기고 뒤쪽 0은 떼어낸다.
//  0.5 → "50%", 0.216 → "21.6%", 0.015625 → "1.56%", 0.000125 → "0.0125%"
// 너무 작은 값은 JS가 지수 표기("1e-7")로 바꿔버리므로 하한 밑은 "<0.0001%"로 뭉갠다.
export function formatProbability(p: number): string {
  if (!Number.isFinite(p) || p < 0) return '—'
  if (p === 0) return '0%'
  if (p >= 1) return '100%'
  const percent = p * 100
  if (percent < 0.0001) return '<0.0001%'
  return `${Number(percent.toPrecision(3))}%`
}

// 1% 미만의 희귀 확률은 "0.0125%"보다 "1/8,000"이 체감이 쉬워서 보조로 붙인다.
// 0.05^3처럼 부동소수점 오차(7999.99…)가 있어 반올림한다.
function formatOneIn(p: number): string | null {
  if (!Number.isFinite(p) || p <= 0 || p >= 0.01) return null
  return `1/${Math.round(1 / p).toLocaleString()}`
}

export default function GameOddsPanel({
  headers,
  rows,
  note,
}: {
  headers: string[]
  rows: OddsRow[]
  note?: string
}) {
  const m = MESSAGES.points.odds
  return (
    <aside className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <h2 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{m.title}</h2>

      <table className="mt-2 w-full text-xs tabular-nums">
        <thead>
          <tr className="text-[11px] text-neutral-400 dark:text-neutral-500">
            {headers.map((header, i) => (
              <th key={header} scope="col" className={`py-1 font-normal ${i === 0 ? 'text-left' : 'text-right'}`}>
                {header}
              </th>
            ))}
            <th scope="col" className="py-1 text-right font-normal">{m.probabilityHeader}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const oneIn = formatOneIn(row.probability)
            return (
              <tr key={row.key} className="border-t border-neutral-100 dark:border-neutral-800">
                {row.cells.map((cell, i) => (
                  <td
                    key={i}
                    className={
                      i === 0
                        ? 'py-1.5 text-neutral-700 dark:text-neutral-200'
                        : 'py-1.5 text-right text-neutral-500 dark:text-neutral-400'
                    }
                  >
                    {cell}
                  </td>
                ))}
                <td className="py-1.5 text-right font-medium text-neutral-800 dark:text-neutral-100">
                  {formatProbability(row.probability)}
                  {oneIn && (
                    <span className="block text-[10px] font-normal text-neutral-400 dark:text-neutral-500">{oneIn}</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {note && <p className="mt-2 text-[10px] leading-relaxed text-neutral-400 dark:text-neutral-500">{note}</p>}
    </aside>
  )
}

// 게임 본체 + 우측 확률 패널 2단 레이아웃. 좁은 화면(lg 미만)에선 패널이 게임 아래로 내려간다.
// odds가 없으면(config 로딩 중이거나 구버전 백엔드라 확률 필드가 없을 때) 1단 그대로 둔다 —
// 빈 오른쪽 칸이 자리만 차지하지 않도록.
export function GameLayoutWithOdds({ odds, children }: { odds: ReactNode; children: ReactNode }) {
  if (!odds) return <>{children}</>
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
      <div className="min-w-0">{children}</div>
      {odds}
    </div>
  )
}
