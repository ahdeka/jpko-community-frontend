'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { checkInsApi } from '@/lib/api/checkins'
import { ApiError } from '@/lib/api/client'
import { notifyPointBalanceChanged } from '@/lib/api/points'
import { useAuth } from '@/lib/auth-context'
import InfoPopover from '@/components/common/InfoPopover'
import SakuraStamp from '@/components/common/SakuraStamp'
import type { CheckInCalendar, CheckInOutcome } from '@/types'
import { MESSAGES } from '@/lib/messages'

// 조회할 달. null이면 파라미터 없이 요청해 서버가 KST 기준 이번 달을 고른다
// — 프론트가 "지금 몇 월인지"를 스스로 정하지 않게 하기 위한 초기 상태다.
type Cursor = { year: number; month: number } | null

// "YYYY-MM-DD"를 숫자 3개로 쪼갠다. 서버의 today는 시각이 아니라 날짜라 Date로 파싱할 이유가 없고,
// 파싱하면 오히려 브라우저 타임존이 끼어들어 하루가 밀릴 수 있다(예: UTC 파싱 후 로컬 출력).
// 형식이 예상과 다르면 null을 돌려주고, 호출부는 '오늘 표시'만 포기한다(달력 자체는 정상 렌더).
function parseYmd(ymd: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd)
  if (!m) return null
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) }
}

// 그 달 1일의 요일(0=일 … 6=토). Date.UTC로 만들어 getUTCDay로 읽으면 브라우저 타임존과 무관하게
// 같은 값이 나온다(로컬 생성자 + getDay는 타임존에 따라 하루 어긋날 수 있다).
function firstWeekdayOf(year: number, month: number): number {
  return new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
}

interface Props {
  onClose: () => void
}

// 출석 모달. 헤더의 사용자 메뉴 > "출석하기"로 열린다.
//
// 이 모달 하나가 출석의 전부다 — 달력(이력)도, 출석 버튼(실행)도, 결과(보상)도 여기 있다.
// 결과를 별도 모달로 또 띄우지 않고 같은 모달 안에서 상태만 바꾸는 이유는 두 가지다.
//  - 모달 위에 모달이 겹치는 구조를 피한다.
//  - 출석의 보람이 "오늘 칸에 도장이 찍히는 것"인데, 그걸 보여주려면 달력이 그대로 떠 있어야 한다.
//
// 마운트되는 순간이 곧 열리는 순간이다(부모가 조건부로 렌더한다). 그래서 open 플래그가 없고,
// 닫았다 다시 열면 상태가 초기화되어 낡은 결과가 남지 않는다.
export default function CheckInModal({ onClose }: Props) {
  const { user, fetchUser } = useAuth()
  const dialogRef = useRef<HTMLDivElement>(null)

  const [cursor, setCursor] = useState<Cursor>(null)
  // 같은 달을 강제로 다시 불러오기 위한 카운터. 출석 성공 직후처럼 cursor가 그대로여도
  // 재조회가 필요한 경우에 쓴다(setCursor(null)은 이미 null이면 리렌더를 만들지 않는다).
  const [reloadKey, setReloadKey] = useState(0)

  const [data, setData] = useState<CheckInCalendar | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  // 이번에 모달을 연 뒤 방금 도장을 찍은 날(=오늘). 그 칸에만 '찍히는' 애니메이션을 붙이려고
  // 기억해 둔다. 열자마자 이미 출석 완료였다면 null로 남아 아무 칸도 튀지 않는다.
  const [stampedDay, setStampedDay] = useState<number | null>(null)
  // 방금 출석으로 받은 것(포인트·경험치·마일스톤 보너스). 응답을 통째로 들고 있는 이유는
  // 세 곳이 같은 값을 쓰기 때문이다 — 오늘 칸의 획득 표시, 꽃잎 양, 마일스톤 배너.
  // 열자마자 이미 출석 완료였다면 null로 남아 아무 연출도 나오지 않는다.
  const [outcome, setOutcome] = useState<CheckInOutcome | null>(null)

  // 모달 공통 셸: ESC로 닫기, 배경 스크롤 잠금, 열릴 때 포커스 이동.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    dialogRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)
    setLoadError(null)

    checkInsApi
      .getCalendar(cursor?.year, cursor?.month)
      .then(res => {
        if (cancelled) return
        // data가 비어 오는 일은 없지만(200이면 항상 본문이 있다), 방어적으로 이전 값을 유지한다.
        if (res.data) setData(res.data)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setLoadError(e instanceof ApiError ? e.message : MESSAGES.points.checkin.loadFailed)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user, cursor, reloadKey])

  // 이번 달로 되돌리면서 강제 재조회. 출석 직후와 "이번 달로" 버튼이 공유한다.
  const reloadThisMonth = useCallback(() => {
    setCursor(null)
    setReloadKey(k => k + 1)
  }, [])

  async function handleCheckIn() {
    // 연타 방지. 서버도 시스템 계정 락 + 이중 검사로 막지만, 여기서 먼저 끊어 불필요한 요청을 없앤다.
    if (submitting) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await checkInsApi.checkIn()
      setStampedDay(today?.day ?? null)
      setOutcome(res.data ?? null)

      // 출석 한 번에 세 가지가 동시에 변한다. 응답에는 이 중 아무것도 들어있지 않으므로 각각 갱신한다.
      //  1) 헤더 잔액 — 인자 없이 알리면 구독자(UserMenu)가 스스로 재조회한다. 이 모달을 띄운
      //     장본인이 바로 그 UserMenu라, 모달 뒤에서 잔액이 즉시 올라간다.
      //  2) 레벨/경험치 — /api/auth/me를 다시 받아 레벨 뱃지를 맞춘다(출석 exp는 일일 상한 제외).
      //  3) 달력 자체 — 오늘 칸 도장·이달 누적·마일스톤 achieved를 서버 값으로 다시 받는다.
      notifyPointBalanceChanged()
      await fetchUser()
      reloadThisMonth()
    } catch (e) {
      // 다른 탭이나 다른 기기에서 이미 출석한 뒤라면 409가 온다. 이건 사용자가 뭔가 잘못한 게 아니라
      // 화면이 낡은 것뿐이므로, 에러를 띄우는 대신 조용히 최신 상태로 맞춘다(버튼이 '출석 완료'로 바뀐다).
      if (e instanceof ApiError && e.code === 'ALREADY_CHECKED_IN') {
        reloadThisMonth()
      } else if (e instanceof ApiError) {
        // 정지 계정(403 SUSPENDED_ACCOUNT)도 여기로 오지만, client.ts가 이미 전역 이벤트를 쏴서
        // AuthProvider가 전체 화면을 SuspendedScreen으로 바꾼다 — 이 문구는 그 전환 전 찰나에만 보인다.
        setSubmitError(e.message)
      } else {
        setSubmitError(MESSAGES.points.checkin.checkInFailed)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const today = data ? parseYmd(data.today) : null
  // 조회 중인 달이 '오늘이 속한 달'인지. 과거 달을 보고 있으면 오늘 표시도, 미래 칸 흐리기도 하지 않는다.
  const viewingTodayMonth =
    data !== null && today !== null && today.year === data.year && today.month === data.month
  const todayDay = viewingTodayMonth && today ? today.day : null

  // 다음 달 이동은 오늘이 속한 달까지만 허용한다. 미래 달을 조회해봐야 빈 달력일 뿐이고,
  // 백엔드 year에는 범위 검증이 없어 극단값을 보내면 500이 난다.
  const canGoNext =
    data !== null &&
    today !== null &&
    (data.year < today.year || (data.year === today.year && data.month < today.month))

  // 달력 격자는 달에 상관없이 항상 6주(42칸)로 그린다.
  //
  // 실제로 필요한 줄 수는 4~6줄로 달마다 다른데(2월이 일요일에 시작하면 4줄, 31일인 달이
  // 금·토요일에 시작하면 6줄), 그대로 두면 달을 넘길 때마다 달력 높이가 바뀐다. 그러면 모달
  // 전체 높이가 따라 바뀌고 — 모달은 세로 가운데 정렬이라 — 방금 누른 이전/다음 달 화살표가
  // 발밑에서 움직인다. 남는 줄은 빈 칸으로 채워 기하를 고정한다.
  const leadingBlanks = data ? firstWeekdayOf(data.year, data.month) : 0
  const trailingBlanks = data ? 42 - leadingBlanks - data.daysInMonth : 0

  // 12월 +1 → 이듬해 1월, 1월 -1 → 전년 12월. Date를 거치지 않고 0-based 월로 정규화한다.
  function moveMonth(base: CheckInCalendar, delta: number) {
    const zeroBased = base.month - 1 + delta
    setCursor({
      year: base.year + Math.floor(zeroBased / 12),
      month: (((zeroBased % 12) + 12) % 12) + 1,
    })
  }

  const arrowClass =
    'flex h-6 w-6 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-30 dark:text-neutral-400 dark:hover:bg-neutral-700'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkin-modal-title"
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        // scrollbar-gutter:stable — 스크롤바가 생기거나 사라져도 콘텐츠 폭이 변하지 않게
        // 자리를 항상 예약해 둔다. 이게 없으면 스크롤바가 나타나는 순간 안쪽이 통째로
        // 좌우로 밀려 버튼 위치가 어긋난다.
        //
        // 전체 높이는 약 490px을 넘지 않게 맞췄다. 14인치 노트북 + Windows 150% 배율이면
        // CSS 뷰포트 높이가 590px 안팎이라 90vh가 530px 정도인데, 그 안에 들어가야 스크롤이 안 생긴다.
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl outline-none [scrollbar-gutter:stable] dark:bg-neutral-900"
      >
        {/* 닫기는 우상단 X로 옮겼다. 하단 전체 폭 버튼은 세로로 약 48px을 먹는데,
            ESC·배경 클릭으로도 닫히는 마당에 그만한 자리를 줄 이유가 없다. */}
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <h2
          id="checkin-modal-title"
          className="text-center text-base font-bold text-neutral-900 dark:text-neutral-100"
        >
          {MESSAGES.points.checkin.modalTitle}
        </h2>

        {/* 첫 조회 전에는 달력 자리만 비워둔다. 이후 달 이동에서는 이전 달력을 남겨둔 채
            갱신해(아래 opacity) 모달 높이가 튀지 않게 한다. */}
        {!data ? (
          <p
            className={`py-16 text-center text-xs ${loadError ? 'text-red-500' : 'text-neutral-400'}`}
          >
            {loadError ?? '불러오는 중…'}
          </p>
        ) : (
          <>
            {/* ── 달력. 모달 폭(최대 448px)보다 좁게 묶어 가운데 정렬한다 ── */}
            <div className="mx-auto mt-3 w-full max-w-[18rem]">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                  {MESSAGES.points.checkin.monthLabel(data.year, data.month)}
                </span>
                <span className="flex shrink-0 items-center">
                  <button
                    type="button"
                    onClick={() => moveMonth(data, -1)}
                    disabled={loading}
                    aria-label={MESSAGES.points.checkin.prevMonth}
                    className={arrowClass}
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveMonth(data, 1)}
                    disabled={loading || !canGoNext}
                    aria-label={MESSAGES.points.checkin.nextMonth}
                    className={arrowClass}
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </span>
              </div>

              <div className={`mt-2 grid grid-cols-7 gap-1 ${loading ? 'opacity-50' : ''}`}>
                {MESSAGES.points.checkin.weekdays.map((w, i) => (
                  <div
                    key={w}
                    className={`text-center text-[11px] font-medium leading-5 ${
                      i === 0
                        ? 'text-red-400 dark:text-red-400/70'
                        : 'text-neutral-400 dark:text-neutral-500'
                    }`}
                  >
                    {w}
                  </div>
                ))}

                {/* 1일이 시작되는 요일까지 앞을 빈 칸으로 채운다.
                    aspect-square가 반드시 있어야 한다 — 그리드 행 높이는 그 행에 놓인 항목의
                    최대 높이로 정해지는데, 내용 없는 div는 높이가 0이라 행이 통째로 접힌다. */}
                {Array.from({ length: leadingBlanks }, (_, i) => (
                  <div key={`lead-${i}`} className="aspect-square" aria-hidden="true" />
                ))}

                {Array.from({ length: data.daysInMonth }, (_, i) => i + 1).map(day => {
                  const checked = data.checkedInDays.includes(day)
                  const isToday = day === todayDay
                  // 이번 달을 보고 있을 때만 '아직 오지 않은 날'이 존재한다. 과거 달은 전부 지난 날이다.
                  const isFuture = todayDay !== null && day > todayDay

                  return (
                    <div
                      key={day}
                      aria-label={`${data.month}월 ${day}일${checked ? ' 출석' : ''}`}
                      className={[
                        // 도장을 날짜 위에 겹쳐 찍기 위한 기준점.
                        'relative flex aspect-square items-center justify-center rounded text-xs tabular-nums',
                        // 출석한 날도 같은 타일 위에 둔다 — 격자가 고르게 유지되고,
                        // 도장이 '칸을 칠한 것'이 아니라 '종이에 찍힌 것'처럼 읽힌다.
                        checked
                          ? 'bg-neutral-50 font-bold text-red-600 dark:bg-neutral-800 dark:text-red-400'
                          : isFuture
                            ? 'text-neutral-300 dark:text-neutral-600'
                            : 'bg-neutral-50 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
                        // 오늘은 테두리로 표시한다 — 도장(출석 여부)과 겹쳐 보여야 하므로 배경색을 쓰지 않는다.
                        isToday ? 'ring-1 ring-orange-400' : '',
                      ].join(' ')}
                    >
                      {/* 칸을 살짝 넘치게(-inset-px) 두어 도장이 격자에 갇힌 게 아니라 위에 찍힌 것처럼 보이게 한다. */}
                      {checked && (
                        <SakuraStamp
                          className={`pointer-events-none absolute -inset-px ${
                            day === stampedDay ? 'animate-stamp-press' : ''
                          }`}
                        />
                      )}
                      <span className="relative">{day}</span>
                    </div>
                  )
                })}

                {/* 남는 칸을 채워 항상 6줄을 유지한다(위 leadingBlanks 주석 참고).
                    여기가 특히 중요하다 — 뒤쪽 빈 칸은 한 행 전체를 채우는 경우가 있어
                    (예: 2026년 6월은 앞 1칸 + 30일 = 31칸이라 뒤 11칸 중 7칸이 한 행을 독차지),
                    높이가 없으면 그 행이 사라져 달마다 달력 높이가 도로 달라진다. */}
                {Array.from({ length: trailingBlanks }, (_, i) => (
                  <div key={`trail-${i}`} className="aspect-square" aria-hidden="true" />
                ))}
              </div>

              {/* min-h-6이 필요한 이유: 오른쪽 "이번 달로" 버튼은 과거 달을 볼 때만 나타나는데,
                  버튼(py-0.5 포함 약 20px)과 텍스트만 있을 때(약 16px)의 행 높이가 달라
                  달을 넘길 때마다 아래의 출석 버튼과 "?"가 몇 px씩 밀린다. 높이를 고정해 막는다. */}
              <div className="mt-2 flex min-h-5 items-center justify-between gap-2">
                <span className="text-[11px] tabular-nums text-neutral-500 dark:text-neutral-400">
                  {MESSAGES.points.checkin.monthlyCount(data.month, data.monthlyCount)}
                </span>
                {/* 과거 달을 보다가 한 번에 돌아오는 길. 이번 달을 보고 있을 때는 숨긴다. */}
                {!viewingTodayMonth && (
                  <button
                    type="button"
                    onClick={reloadThisMonth}
                    disabled={loading}
                    className="shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium text-orange-600 transition-colors hover:bg-orange-50 disabled:opacity-40 dark:text-orange-400 dark:hover:bg-orange-500/10"
                  >
                    {MESSAGES.points.checkin.backToThisMonth}
                  </button>
                )}
              </div>
            </div>

            {/* ── 달력 아래: 출석 버튼 → 보상 안내 ── */}
            <div className="mt-4">
              {/* checkedInToday는 조회 중인 달과 무관하게 항상 '오늘' 기준이라,
                  과거 달을 열어둔 채로도 오늘 출석이 가능하다. */}
              <button
                type="button"
                onClick={handleCheckIn}
                disabled={data.checkedInToday || submitting || loading}
                className="w-full rounded-lg bg-orange-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500 dark:disabled:bg-neutral-700 dark:disabled:text-neutral-400"
              >
                {data.checkedInToday
                  ? MESSAGES.points.checkin.alreadyCheckedIn
                  : submitting
                    ? MESSAGES.points.checkin.checkingIn
                    : MESSAGES.points.checkin.checkInButton}
              </button>

              {submitError && (
                <p className="mt-2 text-center text-[11px] text-red-500">{submitError}</p>
              )}
              {/* 달력은 이미 떠 있는데 이후 재조회가 실패한 경우. 화면을 비우지 않고 사유만 덧붙인다. */}
              {loadError && (
                <p className="mt-2 text-center text-[11px] text-red-500">{loadError}</p>
              )}

              {/* 상시 노출되는 설명은 이 한 줄뿐이다. 누적 보너스는 매일 확인할 내용이 아니라
                  "?" 팝오버 안으로 넣어, 모달이 세로로 길어지지 않게 한다. */}
              <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] leading-snug text-neutral-500 dark:text-neutral-400">
                <span>
                  {MESSAGES.points.checkin.dailyReward(
                    data.dailyAmount.toLocaleString(),
                    data.dailyExp.toLocaleString(),
                  )}
                </span>
                {data.milestones.length > 0 && (
                  <InfoPopover
                    label={MESSAGES.points.checkin.bonusPopoverLabel}
                    widthClass="w-56"
                    // 이 "?"는 모달 맨 아래에 있다. 아래로 열면 스크롤 영역이 늘어나
                    // 스크롤바가 생기고 그만큼 안쪽이 밀리므로, 위로 열어 기존 영역에 겹친다.
                    placement="top"
                  >
                    <p className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500">
                      {MESSAGES.points.checkin.milestoneHeading}
                    </p>
                    <ul className="mt-1 space-y-1">
                      {data.milestones.map(m => (
                        <li
                          key={m.count}
                          className="flex items-center justify-between gap-2 text-[11px]"
                        >
                          <span
                            className={
                              m.achieved
                                ? 'text-neutral-400 line-through dark:text-neutral-500'
                                : 'text-neutral-600 dark:text-neutral-300'
                            }
                          >
                            {MESSAGES.points.checkin.milestoneRow(m.count, m.bonus.toLocaleString())}
                          </span>
                          {m.achieved && (
                            <span className="shrink-0 rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">
                              {MESSAGES.points.checkin.milestoneAchieved}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[11px] leading-snug text-neutral-400 dark:text-neutral-500">
                      {MESSAGES.points.checkin.milestoneNote}
                    </p>
                  </InfoPopover>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── 출석 성공 연출 ──
            모달 한가운데에 띄운다. 달력 칸(38px) 옆에 붙이면 글자가 작아 눈에 들어오지 않는다.
            절대배치 + pointer-events-none이라 레이아웃에도, 조작에도 영향이 없다.
            마일스톤 보너스도 이 안에 함께 넣는다 — 따로 띄우면 화면 가운데에서 서로 겹친다. */}
        {outcome && (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center px-6">
            {/* 달력 위에 겹쳐 뜨므로 배경을 거의 불투명하게(/95) 두고 테두리로 경계를 만든다.
                밝은 배경에 그림자만 있으면 흰 달력 위에서 카드 윤곽이 뭉개진다. */}
            <div className="animate-reward-pop flex flex-col items-center gap-1 rounded-2xl border border-neutral-200 bg-white/95 px-7 py-6 text-center shadow-2xl dark:border-neutral-700 dark:bg-neutral-900/95">
              <span className="text-3xl font-extrabold text-orange-600 dark:text-orange-400">
                {MESSAGES.points.checkin.rewardPoint(outcome.amount.toLocaleString())}
              </span>
              {/* 출석 exp는 일일 상한을 타지 않지만, 서버가 UserLevel 행을 못 찾으면 0이 온다. */}
              {outcome.expAmount > 0 && (
                <span className="text-sm font-medium text-neutral-500 dark:text-neutral-300">
                  {MESSAGES.points.checkin.rewardExp(outcome.expAmount.toLocaleString())}
                </span>
              )}
              {/* 마일스톤 회차가 아니면 bonusAmount는 0이라 이 줄이 빠진다. */}
              {outcome.bonusAmount > 0 && (
                <span className="mt-1.5 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">
                  {MESSAGES.points.checkin.resultBonus(
                    outcome.monthlyCount,
                    outcome.bonusAmount.toLocaleString(),
                  )}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
