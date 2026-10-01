import SectionCard from '@/components/common/SectionCard'
import InfoPopover from '@/components/common/InfoPopover'
import ExchangeRateTicker from '@/components/home/ExchangeRateTicker'
import { getExchangeRates } from '@/lib/exchange-rate'
import { MESSAGES } from '@/lib/messages'

// 메인 사이드바의 환율 위젯(엔/원 ↔ 달러/엔 자동 전환). 서버 컴포넌트.
//  - 데이터는 lib/exchange-rate의 30분 캐시를 거치므로 페이지 요청마다 외부 API를 부르지 않는다.
//    전환 동작만 클라이언트(ExchangeRateTicker)에서 하고, 인증키·API 호출은 서버에만 머문다.
//  - 조회 실패·키 미설정이면 빈 카드 대신 섹션 자체를 렌더하지 않는다(NoticeSection과 같은 방침).
//  - 매매기준율은 은행 간 기준값이라 실제 환전(현찰 살 때/팔 때) 금액과 다르다. 오해가 없도록
//    "매매기준율"과 기준일·출처를 항상 함께 표시하고, 자세한 설명은 "?" 안내에 둔다.
export default async function ExchangeRateSection() {
  const data = await getExchangeRates()
  if (!data || data.pairs.length === 0) return null

  return (
    <SectionCard title="환율" bulletColor="bg-sky-500">
      <ExchangeRateTicker pairs={data.pairs} />

      {/* 시각은 표기하지 않는다 — 수출입은행은 하루 1회만 고시하므로 우리 캐시 갱신 시각을 붙이면
          그 시각의 시세처럼 오해된다.
          "?"를 제목 옆이 아니라 이 줄 오른쪽 끝에 두는 이유: InfoPopover 패널은 버튼 기준 오른쪽 정렬
          (right-0)로 왼쪽으로 펼쳐지므로, 카드 왼쪽(제목 옆)에 두면 모바일에서 패널이 화면 밖으로 잘린다.
          아래로 연다(기본 placement) — 위로 열면 사용자가 읽던 환율 숫자를 덮는다. 대신 아래 공지 카드를
          잠깐 덮는데, 설명을 읽는 동안엔 공지를 볼 일이 없으므로 이쪽이 낫다. */}
      <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-neutral-400 dark:text-neutral-500">
        <p className="min-w-0 truncate">{data.date} 매매기준율 · 출처 한국수출입은행</p>
        <InfoPopover label={MESSAGES.exchangeRate.infoLabel}>
          <ul className="flex flex-col gap-1.5">
            {MESSAGES.exchangeRate.info.map(line => (
              <li key={line} className="text-[11px] leading-snug text-neutral-600 dark:text-neutral-300">
                {line}
              </li>
            ))}
          </ul>
        </InfoPopover>
      </div>
    </SectionCard>
  )
}
