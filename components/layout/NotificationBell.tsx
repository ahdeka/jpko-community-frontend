'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Notification } from '@/types'
import { notificationsApi, NOTIFICATIONS_CHANGED_EVENT } from '@/lib/api/notifications'
import {
  notificationHref,
  notificationMeta,
  notificationText,
} from '@/lib/notification'
import { TypeIcon, NotificationBody } from '@/components/notifications/notificationVisuals'
import { formatRelativeTime } from '@/lib/format'
import { MESSAGES } from '@/lib/messages'

function BellIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

// 헤더 알림 벨. 이 컴포넌트는 "로그인 상태에서만" 렌더된다(Header가 user 있을 때만 마운트).
// 따라서 로그아웃 = 언마운트이고, 아래 effect의 cleanup이 SSE 연결을 안전하게 닫는다.
//
// 데이터 모델: 백엔드 GET /api/notifications 는 "안 읽은 알림"만 내려준다.
//   → 목록 length가 곧 안 읽은 개수(배지 숫자)다. 읽음 처리하면 목록에서 빠진다.
//   (읽은 알림까지 포함한 전체 "내역"은 별도 페이지 /notifications 에서 GET /all 로 본다.)
//
// 실시간 갱신 전략(중요): SSE는 "새 알림이 생겼다"는 신호로만 쓰고, 표시 데이터는
//   항상 REST(getUnread)를 다시 불러 채운다. push 이벤트에는 발신자 이름이 없고 id만 오는데,
//   부분 데이터로 목록을 직접 조립하면 중복/누락 버그가 생기기 쉽다. "SSE=신호, REST=정답"으로
//   단일 소스를 유지해 그 위험을 없앤다(안 읽은 목록은 크지 않아 재조회 비용도 미미).
export default function NotificationBell() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const count = notifications.length

  // 안 읽은 알림을 다시 불러온다. 실패는 조용히 무시한다 —
  // 세션 만료(401→refresh 실패)는 client.ts가 전역 이벤트로 로그아웃시키므로 여기서 따로 다루지 않는다.
  const fetchUnread = useCallback(async (): Promise<Notification[] | null> => {
    try {
      const res = await notificationsApi.getUnread()
      return res.data ?? []
    } catch {
      return null
    }
  }, [])

  // 마운트 시: 초기 목록 로드 + SSE 실시간 구독.
  useEffect(() => {
    // 언마운트 후 setState를 막는 가드(응답이 늦게 도착하는 엣지케이스 방어).
    let cancelled = false

    const apply = (list: Notification[] | null) => {
      if (!cancelled && list) setNotifications(list)
    }

    fetchUnread().then(apply)

    // EventSource는 HttpOnly accessToken 쿠키로 인증한다 — JS에 토큰이 없어 XSS 탈취에 안전.
    // 프론트(3000)와 API(8080)가 다른 오리진이라 withCredentials로 쿠키를 실어야 하며,
    // 백엔드 CORS(allowCredentials=true)가 이를 허용한다.
    const es = new EventSource(notificationsApi.subscribeUrl(), { withCredentials: true })

    // 새 알림 push → 목록 재조회(단일 소스 원칙). data 페이로드는 신호로만 쓰고 파싱하지 않는다.
    es.addEventListener('notification', () => {
      fetchUnread().then(apply)
    })

    // 연결이 끊기면 EventSource가 자동 재연결한다(서버 SSE 타임아웃 30분마다 정상적으로 재연결됨).
    // accessToken 만료 구간(최대 1시간 주기)에는 재연결이 잠시 실패할 수 있으나,
    // 다른 API 호출의 토큰 refresh로 쿠키가 갱신되면 다음 재연결에서 복구된다.
    es.onerror = () => { /* 브라우저 기본 재연결에 맡긴다 */ }

    return () => {
      cancelled = true
      es.close()
    }
  }, [fetchUnread])

  // 전체보기 페이지 등 다른 컴포넌트가 알림을 읽음/삭제하면(SSE로는 안 오는 변화) 이 이벤트가 발행된다.
  // 벨은 안 읽은 목록을 통째로 다시 받아 배지 숫자를 다시 세므로, 읽음/삭제 어느 경우든 정확히 맞춰진다.
  useEffect(() => {
    let cancelled = false
    const onChanged = () => {
      fetchUnread().then(list => { if (!cancelled && list) setNotifications(list) })
    }
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, onChanged)
    return () => {
      cancelled = true
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, onChanged)
    }
  }, [fetchUnread])

  // 드롭다운이 열려 있을 때만 바깥 클릭 리스너를 달아 닫는다(UserMenu와 동일 패턴).
  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  // 알림 클릭: 낙관적으로 목록에서 제거(=읽음) 후 원본 게시글로 이동.
  // PATCH가 실패해도 사용자 이동은 막지 않는다 — 다음 재조회 때 서버 상태로 정정된다.
  //
  // 이동 경로는 notificationHref가 정한다. null이면(=내 게시글이 삭제됐다는 알림처럼
  // 원문이 사라진 경우) 이동하지 않고 읽음 처리만 한다 — 없는 글로 보내면 404가 되기 때문이다.
  function handleItemClick(n: Notification) {
    setOpen(false)
    setNotifications(prev => prev.filter(item => item.id !== n.id))
    notificationsApi.markAsRead(n.id).catch(() => {})

    const href = notificationHref(n)
    if (href) router.push(href)
  }

  // 모두 읽기: 백엔드 벌크 엔드포인트 한 번으로 처리한다(과거엔 건별 PATCH를 병렬 호출했다).
  // 낙관적으로 먼저 비운 뒤 요청을 보낸다(실패는 다음 재조회에서 자연히 되돌아온다).
  function handleMarkAllRead() {
    if (count === 0) return
    setNotifications([])
    notificationsApi.markAllAsRead().catch(() => {})
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(prev => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={count > 0 ? `알림 ${count}개` : '알림'}
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
      >
        <BellIcon />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold leading-none text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-2 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
        >
          <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2 dark:border-neutral-700">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{MESSAGES.notifications.title}</p>
            {count > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                {MESSAGES.notifications.markAllRead}
              </button>
            )}
          </div>

          {count === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-neutral-400 dark:text-neutral-500">
              새로운 알림이 없습니다.
            </p>
          ) : (
            <ul className="max-h-80 divide-y divide-neutral-200 overflow-y-auto dark:divide-neutral-700">
              {notifications.map(n => {
                const meta = notificationMeta(n.type)
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleItemClick(n)}
                      aria-label={notificationText(n)}
                      className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left hover:bg-neutral-50 dark:hover:bg-neutral-700/40"
                    >
                      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${meta.iconBg}`}>
                        <TypeIcon icon={meta.icon} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] leading-snug text-neutral-600 dark:text-neutral-300">
                          <NotificationBody n={n} meta={meta} />
                        </span>
                        <time className="mt-1 block text-right text-[11px] text-neutral-400 dark:text-neutral-500">
                          {formatRelativeTime(n.createdAt)}
                        </time>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {/* 읽은 알림까지 포함한 전체 내역은 별도 페이지에서. 안 읽은 알림이 없어도 항상 노출한다. */}
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-neutral-200 px-3 py-2 text-center text-[12px] font-medium text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-700/40 dark:hover:text-neutral-200"
          >
            {MESSAGES.notifications.viewAll}
          </Link>
        </div>
      )}
    </div>
  )
}
