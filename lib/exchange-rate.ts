import { unstable_cache } from 'next/cache'

// 한국수출입은행 "현재환율" Open API로 엔화·달러 환율을 가져온다. **서버 전용 모듈.**
//
// 보안: 인증키(KOREAEXIM_API_KEY)는 NEXT_PUBLIC_ 접두어가 없어 클라이언트 번들에 절대 포함되지 않는다.
// 이 모듈은 서버 컴포넌트에서만 import할 것('use client' 파일에서 import하면 키가 undefined라 그냥 실패한다).
// 키가 URL 쿼리에 들어가므로 요청 URL을 로그로 남기지 않는다.
//
// API 동작(2026-10-01 실측):
//  - 영업일 1회 고시(오전 11시경). 주말·공휴일이나 고시 전 시각에는 HTTP 200 + 빈 배열 []을 준다.
//  - 키 오류 등은 HTTP 200 + [{ result: 3, ...null }] 형태다. 즉 HTTP 상태코드로는 실패를 알 수 없고
//    result === 1인지로만 판단해야 한다. (2: DATA 코드 오류, 3: 인증코드 오류, 4: 일일제한횟수 마감)
//  - 숫자는 "1,540.29"처럼 천 단위 쉼표가 들어간 문자열이다.
//  - 엔화는 cur_unit이 "JPY(100)" — 100엔 기준 원화 금액이다. 달러는 "USD" — 1달러 기준.
//  - 모든 값이 원화 기준이다. 달러/엔처럼 원화가 없는 통화쌍은 직접 주지 않으므로 두 원화 값으로
//    나눠 계산한다(재정환율). 국제 시장의 실제 달러/엔 시세와는 약간 다를 수 있다.
//  - 일일 호출 제한 1,000회.

const API_URL = 'https://oapi.koreaexim.go.kr/site/program/financial/exchangeJSON'
const JPY_UNIT = 'JPY(100)'
const USD_UNIT = 'USD'

// 영업일을 찾기 위해 오늘(KST)부터 하루씩 거슬러 올라가는 최대 일수.
// 추석·설 연휴 + 주말이 붙으면 비영업일이 10일 가까이 이어질 수 있어 넉넉히 14일로 둔다.
// 정상적인 평일엔 2~3회 호출로 끝난다(오늘 + 전 영업일). 한 번 호출에 전 통화가 오므로
// 표시 통화쌍을 늘려도 호출 수는 그대로다.
const MAX_LOOKBACK_DAYS = 14

// 요청 1건 타임아웃. 메인 페이지 렌더가 이 조회를 기다리므로 외부 API가 느려도 오래 붙잡지 않는다.
const REQUEST_TIMEOUT_MS = 3000

// 캐시 주기(초). 고시 시각이 "11시경"으로 매일 조금씩 달라 정확한 갱신 시점을 알 수 없으므로,
// 주기적으로 확인해 새 값이 나오면 늦어도 30분 안에 반영되게 한다.
// 호출량 상한 계산: 평일 ~3회 × 하루 48주기 ≈ 150회, 긴 연휴 최악 ~15회 × 48 ≈ 720회 → 1,000회 제한 안쪽.
// 실패 결과(null)도 같은 주기로 캐시된다 — 키 만료 같은 지속 장애 때 매 요청마다 API를 두드려
// 일일 제한을 태우지 않게 하려는 의도다(대가: 일시 장애면 최대 30분간 위젯이 숨겨짐).
const CACHE_SECONDS = 1800

// 위젯이 보여주는 통화쌍 하나. "base.amount 만큼의 base 통화 = rate 만큼의 quote 통화".
//  예) ¥100 = ₩861.28  → base { symbol:'¥', amount:100 }, quote { symbol:'₩' }, rate 861.28
//      $1 = ¥159.73    → base { symbol:'$', amount:1 },   quote { symbol:'¥' }, rate 159.73
// 클라이언트 컴포넌트로 그대로 넘어가므로 직렬화 가능한 값만 둔다.
export interface RatePair {
  id: 'JPY_KRW' | 'USD_JPY'
  // 스크린리더·점 버튼 이름용 ("엔/원")
  label: string
  base: { symbol: string; code: string; amount: number }
  quote: { symbol: string; code: string }
  rate: number
  // 직전 영업일 대비 변동. 직전 영업일을 lookback 범위 안에서 못 찾으면 null.
  change: number | null
  changePercent: number | null
}

export interface ExchangeRates {
  // 고시 기준일 'YYYY-MM-DD' (KST)
  date: string
  pairs: RatePair[]
}

interface RawRate {
  result: number
  cur_unit: string | null
  deal_bas_r: string | null
}

// 하루치 원화 기준값
interface DailyRates {
  jpy100Krw: number // 100엔당 원
  usdKrw: number // 1달러당 원
}

// KST 기준 날짜를 'YYYYMMDD'로. 서버(Vercel)는 UTC로 돌기 때문에 반드시 timeZone을 명시한다.
// (UTC로 계산하면 KST 00~09시 사이에 "어제"를 오늘로 착각한다.)
function toKstYmd(date: Date): string {
  // en-CA 로캘은 'YYYY-MM-DD' 형식을 준다.
  return date
    .toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
    .replaceAll('-', '')
}

function formatYmd(ymd: string): string {
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`
}

// "1,540.29" → 1540.29. 숫자가 아니면 null(0이나 NaN을 환율로 보여주지 않기 위해).
function parseRate(value: string | null | undefined): number | null {
  if (!value) return null
  const n = Number(value.replaceAll(',', ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

// 소수 둘째 자리 반올림. 부동소수 오차(861.28-863.16 = -1.8799999…)를 표시 전에 정리한다.
function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// 특정 날짜의 원화 기준값을 조회한다.
//  - 비영업일([]) → null  : 호출부가 하루 더 거슬러 올라간다.
//  - 키 오류/한도 초과/네트워크 오류/형식 이상 → throw : 더 거슬러 올라가 봐야 같은 결과라 즉시 중단.
async function fetchRatesOn(apiKey: string, ymd: string): Promise<DailyRates | null> {
  const url = `${API_URL}?authkey=${encodeURIComponent(apiKey)}&searchdate=${ymd}&data=AP01`
  const res = await fetch(url, {
    // 캐싱은 바깥 unstable_cache가 전담한다. fetch 단에서도 캐시하면 에러 응답(HTTP 200)까지
    // 날짜별로 따로 캐시되어 장애가 풀린 뒤에도 남아 있을 수 있으므로 여기서는 끈다.
    cache: 'no-store',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!res.ok) throw new Error(`exchange rate api http ${res.status}`)

  const data: unknown = await res.json()
  if (!Array.isArray(data)) throw new Error('exchange rate api: unexpected body')
  if (data.length === 0) return null // 비영업일

  const rows = data as RawRate[]
  // 정상 응답은 모든 행이 result=1. 첫 행이 1이 아니면 오류 응답이다(키 이름은 result 코드만 남긴다).
  if (rows[0]?.result !== 1) throw new Error(`exchange rate api result ${rows[0]?.result}`)

  const find = (unit: string) => parseRate(rows.find(row => row.cur_unit === unit)?.deal_bas_r)
  const jpy100Krw = find(JPY_UNIT)
  const usdKrw = find(USD_UNIT)
  // 영업일인데 필요한 행이 없거나 값이 깨졌으면 형식이 바뀐 것 — 조용히 틀린 값을 보여주느니 실패시킨다.
  if (jpy100Krw === null || usdKrw === null) throw new Error('exchange rate api: JPY/USD row missing')
  return { jpy100Krw, usdKrw }
}

// 1달러당 엔 = (1달러당 원) ÷ (1엔당 원). 1엔당 원 = 100엔당 원 / 100.
function usdJpy(day: DailyRates): number {
  return day.usdKrw / (day.jpy100Krw / 100)
}

function buildPair(
  base: Omit<RatePair, 'rate' | 'change' | 'changePercent'>,
  latest: number,
  previous: number | null,
): RatePair {
  const change = previous === null ? null : latest - previous
  return {
    ...base,
    rate: round2(latest),
    change: change === null ? null : round2(change),
    // previous > 0은 parseRate가 보장하므로 0 나눗셈은 없다.
    changePercent: change === null || previous === null ? null : round2((change / previous) * 100),
  }
}

async function loadExchangeRates(): Promise<ExchangeRates | null> {
  const apiKey = process.env.KOREAEXIM_API_KEY
  if (!apiKey) return null // 환경변수 미설정(로컬 등) — 위젯만 숨긴다.

  try {
    // 최신 영업일(latest)과 그 직전 영업일(previous)을 찾을 때까지 하루씩 거슬러 올라간다.
    // 순차 호출인 이유: 대부분 첫 1~2번에서 끝나므로, 14일치를 병렬로 쏘면 호출 한도만 낭비한다.
    const found: { ymd: string; rates: DailyRates }[] = []
    const cursor = new Date()
    for (let i = 0; i < MAX_LOOKBACK_DAYS && found.length < 2; i++) {
      const ymd = toKstYmd(cursor)
      const rates = await fetchRatesOn(apiKey, ymd)
      if (rates !== null) found.push({ ymd, rates })
      // 24시간 빼기. KST는 서머타임이 없어 날짜가 건너뛰거나 겹치지 않는다.
      cursor.setTime(cursor.getTime() - 24 * 60 * 60 * 1000)
    }

    const [latest, previous] = found
    if (!latest) return null // 14일 내내 비영업일 — 사실상 API 이상

    return {
      date: formatYmd(latest.ymd),
      pairs: [
        buildPair(
          {
            id: 'JPY_KRW',
            label: '엔/원',
            base: { symbol: '¥', code: 'JPY', amount: 100 },
            quote: { symbol: '₩', code: 'KRW' },
          },
          latest.rates.jpy100Krw,
          previous?.rates.jpy100Krw ?? null,
        ),
        buildPair(
          {
            id: 'USD_JPY',
            label: '달러/엔',
            base: { symbol: '$', code: 'USD', amount: 1 },
            quote: { symbol: '¥', code: 'JPY' },
          },
          usdJpy(latest.rates),
          previous ? usdJpy(previous.rates) : null,
        ),
      ],
    }
  } catch (e) {
    // URL에 인증키가 있으므로 에러 객체 전체가 아닌 메시지만 남긴다.
    console.error('[exchange-rate]', e instanceof Error ? e.message : 'unknown error')
    return null
  }
}

// 모든 요청이 같은 캐시 항목을 공유한다(인자 없음 → 키는 keyParts 하나).
// 서버리스 인스턴스가 여러 개여도 Next 데이터 캐시는 공유되므로 호출량 계산이 그대로 유효하다.
// 캐시 키에 v2를 붙인 이유: 반환 형태가 바뀌었으므로(JpyRate → ExchangeRates) 배포 직후 예전 형태의
// 캐시 항목이 새 코드에 읽혀 화면이 깨지는 일을 막는다.
export const getExchangeRates = unstable_cache(loadExchangeRates, ['exchange-rates-v2'], {
  revalidate: CACHE_SECONDS,
})
