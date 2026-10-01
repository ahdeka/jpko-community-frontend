import { unstable_cache } from 'next/cache'

// 한국수출입은행 "현재환율" Open API로 엔화(100엔) 매매기준율을 가져온다. **서버 전용 모듈.**
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
//  - 엔화는 cur_unit이 "JPY(100)" — 100엔 기준 원화 금액이다.
//  - 일일 호출 제한 1,000회.

const API_URL = 'https://oapi.koreaexim.go.kr/site/program/financial/exchangeJSON'
const JPY_UNIT = 'JPY(100)'

// 영업일을 찾기 위해 오늘(KST)부터 하루씩 거슬러 올라가는 최대 일수.
// 추석·설 연휴 + 주말이 붙으면 비영업일이 10일 가까이 이어질 수 있어 넉넉히 14일로 둔다.
// 정상적인 평일엔 2~3회 호출로 끝난다(오늘 + 전 영업일).
const MAX_LOOKBACK_DAYS = 14

// 요청 1건 타임아웃. 메인 페이지 렌더가 이 조회를 기다리므로 외부 API가 느려도 오래 붙잡지 않는다.
const REQUEST_TIMEOUT_MS = 3000

// 캐시 주기(초). 고시는 하루 1회라 30분이면 충분히 신선하다.
// 호출량 상한 계산: 평일 ~3회 × 하루 48주기 ≈ 150회, 긴 연휴 최악 ~15회 × 48 ≈ 720회 → 1,000회 제한 안쪽.
// 실패 결과(null)도 같은 주기로 캐시된다 — 키 만료 같은 지속 장애 때 매 요청마다 API를 두드려
// 일일 제한을 태우지 않게 하려는 의도다(대가: 일시 장애면 최대 30분간 위젯이 숨겨짐).
const CACHE_SECONDS = 1800

export interface JpyRate {
  // 100엔당 원화 매매기준율 (예: 861.28)
  rate: number
  // 고시 기준일 'YYYY-MM-DD' (KST)
  date: string
  // 직전 영업일 대비 변동. 직전 영업일을 lookback 범위 안에서 못 찾으면 null.
  change: number | null
  changePercent: number | null
}

interface RawRate {
  result: number
  cur_unit: string | null
  deal_bas_r: string | null
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
function parseRate(value: string | null): number | null {
  if (!value) return null
  const n = Number(value.replaceAll(',', ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

// 특정 날짜의 엔화 기준율을 조회한다.
//  - 비영업일([]) → null  : 호출부가 하루 더 거슬러 올라간다.
//  - 키 오류/한도 초과/네트워크 오류/형식 이상 → throw : 더 거슬러 올라가 봐야 같은 결과라 즉시 중단.
async function fetchJpyOn(apiKey: string, ymd: string): Promise<number | null> {
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

  const jpy = rows.find(row => row.cur_unit === JPY_UNIT)
  const rate = parseRate(jpy?.deal_bas_r ?? null)
  // 영업일인데 엔화 행이 없거나 값이 깨졌으면 형식이 바뀐 것 — 조용히 틀린 값을 보여주느니 실패시킨다.
  if (rate === null) throw new Error('exchange rate api: JPY row missing')
  return rate
}

async function loadJpyRate(): Promise<JpyRate | null> {
  const apiKey = process.env.KOREAEXIM_API_KEY
  if (!apiKey) return null // 환경변수 미설정(로컬 등) — 위젯만 숨긴다.

  try {
    // 최신 영업일(latest)과 그 직전 영업일(previous)을 찾을 때까지 하루씩 거슬러 올라간다.
    // 순차 호출인 이유: 대부분 첫 1~2번에서 끝나므로, 14일치를 병렬로 쏘면 호출 한도만 낭비한다.
    const found: { ymd: string; rate: number }[] = []
    const cursor = new Date()
    for (let i = 0; i < MAX_LOOKBACK_DAYS && found.length < 2; i++) {
      const ymd = toKstYmd(cursor)
      const rate = await fetchJpyOn(apiKey, ymd)
      if (rate !== null) found.push({ ymd, rate })
      // 24시간 빼기. KST는 서머타임이 없어 날짜가 건너뛰거나 겹치지 않는다.
      cursor.setTime(cursor.getTime() - 24 * 60 * 60 * 1000)
    }

    const [latest, previous] = found
    if (!latest) return null // 14일 내내 비영업일 — 사실상 API 이상

    const change = previous ? latest.rate - previous.rate : null
    return {
      rate: latest.rate,
      date: formatYmd(latest.ymd),
      // 부동소수 오차(861.28-863.16 = -1.8799999…)를 표시 전에 정리한다.
      change: change === null ? null : Math.round(change * 100) / 100,
      changePercent:
        change === null || !previous ? null : Math.round((change / previous.rate) * 10000) / 100,
    }
  } catch (e) {
    // URL에 인증키가 있으므로 에러 객체 전체가 아닌 메시지만 남긴다.
    console.error('[exchange-rate]', e instanceof Error ? e.message : 'unknown error')
    return null
  }
}

// 모든 요청이 같은 캐시 항목을 공유한다(인자 없음 → 키는 keyParts 하나).
// 서버리스 인스턴스가 여러 개여도 Next 데이터 캐시는 공유되므로 호출량 계산이 그대로 유효하다.
export const getJpyRate = unstable_cache(loadJpyRate, ['jpy-exchange-rate'], {
  revalidate: CACHE_SECONDS,
})
