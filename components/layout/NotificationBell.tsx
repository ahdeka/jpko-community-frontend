'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Notification } from '@/types'
import { notificationsApi } from '@/lib/api/notifications'
import {
  notificationMeta,
  notificationSenderLabel,
  notificationText,
  truncatePostTitle,
  type NotificationMeta,
} from '@/lib/notification'
import { formatRelativeTime } from '@/lib/format'

function BellIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

// 알림 종류별 좌측 아이콘. 색은 감싸는 원형(iconBg)이 입히므로 currentColor만 쓴다.
function TypeIcon({ icon }: { icon: NotificationMeta['icon'] }) {
  const common = { className: 'h-3.5 w-3.5', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (icon === 'reply') {
    return (
      <svg {...common}>
        <polyline points="9 14 4 9 9 4" />
        <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
      </svg>
    )
  }
  if (icon === 'like') {
    return (
      <svg {...common}>
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z" />
        <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

// 본문 문구를 강조와 함께 조립한다.
//  - 발신자 이름: 굵게 + 진한 색으로 "누가"를 부각
//  - 게시글 제목: 따옴표 + 중간 강조 (없으면 "회원님의 게시글"로 폴백)
//  - 액션 키워드('댓글'/'답글'/'추천'): 타입 색으로 강조해 "무엇을"을 부각
function NotificationBody({ n, meta }: { n: Notification; meta: NotificationMeta }) {
  const who = <span className="font-semibold text-neutral-900 dark:text-white">{notificationSenderLabel(n)}</span>
  // 액션 키워드는 좌측 색상 아이콘이 이미 종류를 알려주므로 별도 색을 넣지 않고 본문과 같은 톤으로 둔다.
  const keyword = meta.label

  if (meta.target === 'comment') {
    return <>{who}님이 회원님의 댓글에 {keyword}{meta.suffix}</>
  }

  const target = n.postTitle ? (
    <>
      회원님이 작성하신{' '}
      <span className="font-semibold text-neutral-800 dark:text-neutral-100">
        “{truncatePostTitle(n.postTitle)}”
      </span>
      에{' '}
    </>
  ) : (
    <>회원님의 게시글에 </>
  )

  return <>{who}님이 {target}{keyword}{meta.suffix}</>
}

// 헤더 알림 벨. 이 컴포넌트는 "로그인 상태에서만" 렌더된다(Header가 user 있을 때만 마운트).
// 따라서 로그아웃 = 언마운트이고, 아래 effect의 cleanup이 SSE 연결을 안전하게 닫는다.
//
// 데이터 모델: 백엔드 GET /api/notifications 는 "안 읽은 알림"만 내려준다.
//   → 목록 length가 곧 안 읽은 개수(배지 숫자)다. 읽음 처리하면 목록에서 빠진다.
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
  function handleItemClick(n: Notification) {
    setOpen(false)
    setNotifications(prev => prev.filter(item => item.id !== n.id))
    notificationsApi.markAsRead(n.id).catch(() => {})
    router.push(`/posts/${n.postId}`)
  }

  // 모두 읽기: 백엔드에 일괄 처리 엔드포인트가 없어 건별 PATCH를 병렬 호출한다.
  // 낙관적으로 먼저 비운 뒤 요청을 보낸다(일부 실패는 다음 재조회에서 자연히 되돌아온다).
  function handleMarkAllRead() {
    const targets = notifications
    setNotifications([])
    void Promise.allSettled(targets.map(n => notificationsApi.markAsRead(n.id)))
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
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">알림</p>
            {count > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                모두 읽기
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
        </div>
      )}
    </div>
  )
}
