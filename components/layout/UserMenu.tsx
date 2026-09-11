'use client'

import { useCallback, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import type { User } from '@/types'
import { pointsApi, POINT_BALANCE_CHANGED_EVENT, type PointBalanceChangedDetail } from '@/lib/api/points'
import { isStaff } from '@/lib/role'
import CheckInModal from '@/components/points/CheckInModal'

interface Props {
  user: User
  onLogout: () => void
}

// 로그인 상태의 프로필 아이콘. 비로그인 아이콘과 같은 형태로 통일한다.
function UserIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.42 3.58-7 8-7s8 2.58 8 7" />
    </svg>
  )
}

// 닉네임(왼쪽) + 프로필 아이콘(오른쪽). 아이콘을 누르면 메뉴가 열린다.
// 운영진(ADMIN·ROOT)에게만 "관리자 페이지" 항목을 추가로 노출한다.
export default function UserMenu({ user, onLogout }: Props) {
  const [open, setOpen] = useState(false)
  // 출석 모달의 열림 여부. 메뉴 open과 완전히 독립이다 — "출석하기"를 누르면 메뉴는 닫고
  // 모달만 띄우기 때문에, 둘을 한 state로 묶으면 메뉴가 닫히는 순간 모달도 사라진다.
  const [checkInOpen, setCheckInOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  // 잔액은 /api/auth/me에 포함되지 않으므로 이 컴포넌트가 직접 조회한다.
  // 마운트 시 1회 조회하고, 이후 포인트 변동 이벤트(게임 등)를 구독해 새로고침 없이 갱신한다.
  const [balance, setBalance] = useState<number | null>(null)

  // 언마운트 이후 도착하는 응답이 setState를 호출하지 않도록 하는 살아있음 플래그.
  const mountedRef = useRef(true)
  // 마지막으로 시작한 조회의 순번. 잔액이 짧은 간격으로 연달아 바뀌면 getBalance() 응답이
  // 시작 순서와 다르게 도착할 수 있는데, 항상 "가장 최근에 시작한 조회"의 결과만 반영해
  // 낡은 응답이 최신 잔액을 덮어쓰는 것을 막는다.
  const fetchSeqRef = useRef(0)

  const isAdmin = isStaff(user.role)

  const refreshBalance = useCallback(() => {
    const seq = ++fetchSeqRef.current
    pointsApi.getBalance()
      .then(res => {
        // 이 조회가 시작된 뒤 더 최근 조회(또는 이벤트가 실어준 확정값)가 있었다면 이 응답은 낡은 것 → 버린다.
        if (!mountedRef.current || seq !== fetchSeqRef.current) return
        setBalance(res.data?.balance ?? null)
      })
      .catch(() => {
        // 일시적 조회 실패로 잔액이 사라져 보이지 않도록, 기존 표시값을 그대로 유지한다.
        // (첫 조회 실패라면 초기값 null이 유지되어 잔액 줄이 숨겨질 뿐 오작동은 없다.)
      })
  }, [])

  useEffect(() => {
    mountedRef.current = true
    refreshBalance()
    return () => { mountedRef.current = false }
  }, [refreshBalance])

  // 포인트 변동 이벤트 구독. detail.balance가 실려 오면(게임) 추가 조회 없이 즉시 반영하고,
  // 없으면 서버에서 다시 조회한다. 언마운트 시 리스너를 해제해 누수를 막는다.
  useEffect(() => {
    function onBalanceChanged(e: Event) {
      const detail = (e as CustomEvent<PointBalanceChangedDetail>).detail
      if (typeof detail?.balance === 'number') {
        // 이벤트가 확정 잔액을 실어줬으면 이것이 최신이다. 순번을 올려, 뒤늦게 도착할 수 있는
        // 진행 중 getBalance() 응답이 이 값을 덮어쓰지 못하게 한다.
        fetchSeqRef.current++
        setBalance(detail.balance)
      } else {
        refreshBalance()
      }
    }
    window.addEventListener(POINT_BALANCE_CHANGED_EVENT, onBalanceChanged)
    return () => window.removeEventListener(POINT_BALANCE_CHANGED_EVENT, onBalanceChanged)
  }, [refreshBalance])

  // 메뉴가 열려 있을 때만 바깥 클릭 리스너를 달아 닫는다.
  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const menuItem =
    'block w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(prev => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="내 메뉴"
        className="flex items-center gap-2"
      >
        <span className="text-sm text-neutral-600 dark:text-neutral-400">{user.nickname}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-700 text-white hover:bg-neutral-600 dark:bg-neutral-600 dark:hover:bg-neutral-500">
          <UserIcon />
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
        >
          {/* 헤더: 닉네임 + 관리자 배지 */}
          <div className="border-b border-neutral-100 px-4 py-2.5 dark:border-neutral-700">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {user.nickname}
              </p>
              {isAdmin && (
                <span className="shrink-0 rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                  관리자
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-neutral-400 dark:text-neutral-500">{user.email}</p>
            {balance !== null && (
              <p className="mt-0.5 text-xs font-semibold text-orange-600 dark:text-orange-400">
                {balance.toLocaleString()}P
              </p>
            )}
          </div>

          {/* 매일 한 번 누르는 항목이라 맨 위에 둔다. 바로 위 잔액 표시와 붙어 있어,
              출석하면 그 숫자가 올라가는 것이 같은 자리에서 보인다. */}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              setCheckInOpen(true)
            }}
            className={menuItem}
          >
            출석하기
          </button>

          <Link href="/mypage" role="menuitem" className={menuItem} onClick={() => setOpen(false)}>
            마이페이지
          </Link>
          {/* 룰렛·파칭코·슬롯은 게임센터 허브(/game-center)로 통합. 메뉴에서는 진입점 하나만 노출한다. */}
          <Link href="/game-center" role="menuitem" className={menuItem} onClick={() => setOpen(false)}>
            게임센터
          </Link>

          {isAdmin && (
            <Link href="/admin" role="menuitem" className={menuItem} onClick={() => setOpen(false)}>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-500" />
                관리자 페이지
              </span>
            </Link>
          )}

          <div className="my-1 border-t border-neutral-100 dark:border-neutral-700" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onLogout()
            }}
            className={menuItem}
          >
            로그아웃
          </button>
        </div>
      )}

      {/* 모달은 메뉴 팝오버(w-48 · overflow-hidden) 밖에 둔다 — 그 안에 넣으면 잘려 보인다.
          조건부 렌더라 닫을 때마다 언마운트되고, 다시 열면 상태가 초기화되어
          지난번 출석 결과가 남아 있지 않는다. */}
      {checkInOpen && <CheckInModal onClose={() => setCheckInOpen(false)} />}
    </div>
  )
}
