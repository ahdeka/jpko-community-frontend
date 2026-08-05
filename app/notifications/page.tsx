'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Notification } from '@/types'
import { useAuth } from '@/lib/auth-context'
import { notificationsApi, emitNotificationsChanged } from '@/lib/api/notifications'
import { ApiError } from '@/lib/api/client'
import { notificationHref, notificationMeta, notificationText } from '@/lib/notification'
import { TypeIcon, NotificationBody } from '@/components/notifications/notificationVisuals'
import { formatDateTime } from '@/lib/format'
import { MESSAGES } from '@/lib/messages'

const PAGE_SIZE = 20

// 알림 전체보기 페이지. 벨 드롭다운이 "안 읽은 알림"만 보여주는 것과 달리
// 여기서는 읽은 알림까지 포함한 전체 내역을 페이지 단위로 보여주고, 단건/전체 삭제와 전체 읽음을 지원한다.
//
// 데이터 정합 원칙: 서버 응답으로 목록을 채우되, 사용자 조작(읽음/삭제)에는 낙관적으로 로컬 상태를
// 먼저 갱신해 반응성을 확보한다. 요청이 실패하면 refreshKey로 서버 상태를 다시 불러 정정한다.
export default function NotificationsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // 값을 바꿔 아래 useEffect가 현재 페이지를 다시 불러오게 하는 트리거(삭제/읽음 실패 시 정정용).
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)
    setError(null)

    notificationsApi
      .getAll(page, PAGE_SIZE)
      .then(res => {
        if (cancelled) return
        setNotifications(res.data?.content ?? [])
        setTotalPages(res.data?.totalPages ?? 0)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof ApiError ? e.message : MESSAGES.notifications.loadFailed)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page, user, refreshKey])

  // 알림 클릭: 안 읽은 것이면 읽음 처리하고, 이동 대상이 있으면 원본으로 이동한다.
  // (읽은 알림은 목록에서 사라지지 않고 "내역"으로 남는다 — 벨과 다른 점.)
  function handleOpen(n: Notification) {
    if (!n.isRead) {
      setNotifications(list => list.map(x => (x.id === n.id ? { ...x, isRead: true } : x)))
      // 서버 반영에 성공하면 헤더 벨에도 알려 안 읽은 개수를 다시 세게 한다.
      notificationsApi.markAsRead(n.id).then(emitNotificationsChanged).catch(() => {})
    }
    const href = notificationHref(n)
    if (href) router.push(href)
  }

  // 단건 삭제: 낙관적으로 목록에서 빼고, 실패하면 되돌린다.
  // 현재 페이지가 비면 페이지 정합을 맞춘다(마지막 페이지의 마지막 항목을 지운 경우 등).
  async function handleDeleteOne(id: number) {
    const before = notifications
    const remaining = before.filter(n => n.id !== id)
    setNotifications(remaining)
    try {
      await notificationsApi.remove(id)
      emitNotificationsChanged() // 헤더 벨 개수 갱신(안 읽은 알림을 지운 경우 배지가 줄어야 한다)
    } catch {
      setNotifications(before) // 롤백
      return
    }
    if (remaining.length === 0) {
      // 페이지가 비었으면: 앞 페이지로 물러나거나(있으면), 첫 페이지면 다시 불러 최신 상태를 반영한다.
      if (page > 0) setPage(p => p - 1)
      else setRefreshKey(k => k + 1)
    }
  }

  // 전체 삭제: 되돌릴 수 없으므로 반드시 확인을 받는다(CommentItem과 동일하게 네이티브 confirm 사용).
  async function handleDeleteAll() {
    if (notifications.length === 0) return
    if (!confirm(MESSAGES.notifications.deleteAllConfirm)) return

    const before = notifications
    setNotifications([])
    try {
      await notificationsApi.removeAll()
      emitNotificationsChanged() // 헤더 벨도 비워지도록 알린다.
      setPage(0)
      setRefreshKey(k => k + 1) // 첫 페이지를 다시 불러 빈 상태를 확정한다.
    } catch {
      setNotifications(before) // 롤백
    }
  }

  // 전체 읽음: 낙관적으로 현재 페이지 항목을 모두 읽음 처리한다.
  // 백엔드는 안 읽은 알림 전체를 벌크로 처리하므로, 다른 페이지도 다음 조회 때 읽음으로 보인다.
  function handleMarkAllRead() {
    setNotifications(list => list.map(n => ({ ...n, isRead: true })))
    notificationsApi
      .markAllAsRead()
      .then(emitNotificationsChanged) // 헤더 벨 배지도 0으로.
      .catch(() => setRefreshKey(k => k + 1))
  }

  // 인증 확인 중에는 깜빡임을 막기 위해 아무것도 그리지 않는다(마이페이지와 동일).
  if (isLoading) return null

  // 비로그인 사용자 차단 (알림은 로그인 필수)
  if (!user) {
    return (
      <div className="py-16 text-center text-sm text-neutral-500 dark:text-neutral-400">
        <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400">로그인</Link>
        {' '}{MESSAGES.notifications.loginGate}
      </div>
    )
  }

  const hasUnread = notifications.some(n => !n.isRead)
  const hasAny = notifications.length > 0

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-neutral-900 dark:text-white">{MESSAGES.notifications.title}</h1>
        <div className="flex items-center gap-2">
          {hasUnread && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              {MESSAGES.notifications.markAllRead}
            </button>
          )}
          {hasAny && (
            <button
              type="button"
              onClick={handleDeleteAll}
              className="rounded-md border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              {MESSAGES.notifications.deleteAll}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-neutral-400">불러오는 중…</p>
      ) : error ? (
        <p className="py-12 text-center text-sm text-red-500">{error}</p>
      ) : !hasAny ? (
        <div className="py-16 text-center text-sm text-neutral-400 dark:text-neutral-500">
          {MESSAGES.notifications.empty}
        </div>
      ) : (
        <>
          <ul className="divide-y divide-neutral-100 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {notifications.map(n => {
              const meta = notificationMeta(n.type)
              return (
                <li
                  key={n.id}
                  className={`flex items-start gap-2.5 ${n.isRead ? '' : 'bg-orange-50/60 dark:bg-orange-500/[0.06]'}`}
                >
                  {/* 본문 클릭 영역: 읽음 처리 + 원본 이동. 삭제 버튼과 형제로 두어 버튼 중첩(잘못된 HTML)을 피한다. */}
                  <button
                    type="button"
                    onClick={() => handleOpen(n)}
                    aria-label={notificationText(n)}
                    className="flex min-w-0 flex-1 items-start gap-2.5 px-3 py-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                  >
                    <span className={`relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.iconBg}`}>
                      <TypeIcon icon={meta.icon} />
                      {/* 안 읽은 알림 표식(주황 점) */}
                      {!n.isRead && (
                        <span
                          className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-orange-500 dark:border-neutral-900"
                          aria-hidden="true"
                        />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm leading-snug text-neutral-700 dark:text-neutral-200">
                        <NotificationBody n={n} meta={meta} />
                      </span>
                      <time className="mt-1 block text-[11px] text-neutral-400 dark:text-neutral-500">
                        {formatDateTime(n.createdAt)}
                      </time>
                    </span>
                  </button>

                  {/* 단건 삭제 */}
                  <button
                    type="button"
                    onClick={() => handleDeleteOne(n.id)}
                    aria-label={MESSAGES.notifications.deleteOne}
                    className="mr-1 mt-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </li>
              )
            })}
          </ul>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3 text-sm">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
                className="rounded px-3 py-1 text-neutral-500 hover:bg-neutral-100 disabled:opacity-40 dark:hover:bg-neutral-800"
              >
                이전
              </button>
              <span className="text-xs text-neutral-400">{page + 1} / {totalPages}</span>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                className="rounded px-3 py-1 text-neutral-500 hover:bg-neutral-100 disabled:opacity-40 dark:hover:bg-neutral-800"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
