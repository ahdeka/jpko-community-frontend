import type { Notification } from '@/types'
import {
  isRemovedComment,
  notificationSenderLabel,
  truncatePostTitle,
  type NotificationMeta,
} from '@/lib/notification'
import { MESSAGES } from '@/lib/messages'

// 알림 벨(NotificationBell)과 알림 전체보기 페이지(app/notifications)가 공유하는 표시 조각.
// 두 화면이 같은 아이콘/문구 조립 규칙을 그대로 써야 하므로 여기 한 곳에 모아 재사용한다.
// (순수 표시용 컴포넌트 — hook을 쓰지 않으므로 서버/클라이언트 어느 쪽에서 import돼도 안전하다.)

// 알림 종류별 좌측 아이콘. 색은 감싸는 원형(iconBg)이 입히므로 currentColor만 쓴다.
export function TypeIcon({ icon }: { icon: NotificationMeta['icon'] }) {
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
  // 강제 삭제: 휴지통
  if (icon === 'removed') {
    return (
      <svg {...common}>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    )
  }
  // 레벨업: 위로 향한 화살표(상승) + 아래 받침선.
  // 포인트(동전)와 형태를 확실히 다르게 해서, 색이 비슷하게 보이는 환경에서도 구분되게 한다.
  if (icon === 'level') {
    return (
      <svg {...common}>
        <path d="M12 19V6" />
        <path d="m6 12 6-6 6 6" />
        <path d="M5 21h14" />
      </svg>
    )
  }
  // 포인트 도난: 동전
  if (icon === 'point') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 15.5a2.5 2.5 0 0 0 2.5 1.5c1.5 0 2.5-.9 2.5-2s-1-1.7-2.5-2-2.5-1-2.5-2 1-2 2.5-2a2.5 2.5 0 0 1 2.5 1.5" />
        <path d="M12 7v1M12 16v1" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

// 본문 문구를 강조와 함께 조립한다. "누가 > 무엇에 > 액션" 순으로 시선 위계를 준다.
//  - 발신자 이름: 굵게 + 가장 진한 색으로 "누가"를 최우선 부각
//  - 게시글 제목(또는 인용 댓글): 따옴표 + 이름보다 한 단계 낮춘 톤(중간 굵기)으로 "보조 맥락"으로 둔다
//    (없으면 "회원님의 게시글"로 폴백). 이름(가장 진함/굵음)과 위계를 벌려 가독성을 높인다.
//  - 액션 키워드('댓글'/'답글'/'추천'): 좌측 색상 아이콘이 종류를 알려주므로 본문과 같은 톤으로 둔다
export function NotificationBody({ n, meta }: { n: Notification; meta: NotificationMeta }) {
  // 강제 삭제 알림은 문구 구조가 다르므로 먼저 처리한다.
  //
  // 발신자(관리자)를 일부러 밝히지 않는다 — 백엔드는 senderName에 관리자 닉네임을 실어 보내지만,
  // 조치의 주체는 개인이 아니라 운영이고, 개인이 특정되면 항의·보복 대상이 될 수 있다.
  // 그래서 senderName을 무시하고 "운영 정책에 따라"로 고정한다.
  if (n.type === 'CONTENT_REMOVED') {
    const removed = <span className={`font-semibold ${meta.accentText}`}>삭제</span>

    if (isRemovedComment(n)) {
      return <>운영 정책에 따라 회원님의 댓글이 {removed}되었습니다.</>
    }
    const what = n.postTitle ? (
      <>
        게시글{' '}
        <span className="font-medium text-neutral-700 dark:text-neutral-200">
          “{truncatePostTitle(n.postTitle)}”
        </span>
        이(가){' '}
      </>
    ) : (
      <>게시글이 </>
    )
    return <>운영 정책에 따라 회원님의 {what}{removed}되었습니다.</>
  }

  // 포인트 룰렛으로 뺏긴 경우: 게시글/댓글과 무관하므로 별도 문구로 조립한다.
  // 상대는 익명 처리되지 않는다(백엔드가 isAnonymous를 항상 false로 보냄).
  if (n.type === 'POINT_STOLEN') {
    const who = <span className="font-semibold text-neutral-900 dark:text-white">{notificationSenderLabel(n)}</span>
    return (
      <>
        {who}{MESSAGES.points.notification.stolenAfterName}
        <span className={`font-semibold ${meta.accentText}`}>{(n.amount ?? 0).toLocaleString()}P</span>
        {MESSAGES.points.notification.stolenSuffix}
      </>
    )
  }

  // 포인트 룰렛으로 얻은 경우: POINT_STOLEN과 대칭 문구.
  if (n.type === 'POINT_WON') {
    const who = <span className="font-semibold text-neutral-900 dark:text-white">{notificationSenderLabel(n)}</span>
    return (
      <>
        {who}{MESSAGES.points.notification.wonAfterName}
        <span className={`font-semibold ${meta.accentText}`}>{(n.amount ?? 0).toLocaleString()}P</span>
        {MESSAGES.points.notification.wonSuffix}
      </>
    )
  }

  // 게시글 작성 포인트 지급: 시스템 알림이라 발신자를 밝히지 않는다(POINT_STOLEN/WON과 달리 상대가 없음).
  // 어떤 글인지 제목으로 보여준다(CONTENT_REMOVED의 postTitle 유무 분기와 동일한 패턴).
  if (n.type === 'POST_REWARD') {
    const what = n.postTitle ? (
      <>
        게시글{' '}
        <span className="font-medium text-neutral-700 dark:text-neutral-200">
          “{truncatePostTitle(n.postTitle)}”
        </span>
        {' '}작성으로{' '}
      </>
    ) : (
      <>게시글 작성으로 </>
    )
    return (
      <>
        {what}
        <span className={`font-semibold ${meta.accentText}`}>{(n.amount ?? 0).toLocaleString()}</span>
        {MESSAGES.points.notification.rewardSuffix}
      </>
    )
  }

  // 댓글 작성 포인트 지급: POST_REWARD와 동일한 이유로 발신자를 밝히지 않는다. 어떤 댓글인지 내용으로 보여준다.
  // ⚠️ 원 댓글이 삭제되면 백엔드가 commentContent를 null로 내려주므로(삭제된 원문 노출 방지),
  //    이때는 "댓글 작성으로"로 폴백한다.
  if (n.type === 'COMMENT_REWARD') {
    const what = n.commentContent ? (
      <>
        댓글{' '}
        <span className="font-medium text-neutral-700 dark:text-neutral-200">
          “{truncatePostTitle(n.commentContent)}”
        </span>
        으로{' '}
      </>
    ) : (
      <>댓글 작성으로 </>
    )
    return (
      <>
        {what}
        <span className={`font-semibold ${meta.accentText}`}>{(n.amount ?? 0).toLocaleString()}</span>
        {MESSAGES.points.notification.rewardSuffix}
      </>
    )
  }

  // 레벨업: 시스템 알림이라 발신자가 없다(POST_REWARD/COMMENT_REWARD와 같은 구조).
  // ⚠️ amount는 포인트 액수가 아니라 '도달한 레벨'이라 toLocaleString()으로 천단위를 찍지 않는다
  //    — "Lv.1,000"처럼 보이면 레벨이 아니라 금액으로 읽힌다.
  if (n.type === 'LEVEL_UP') {
    return (
      <>
        {MESSAGES.level.notification.prefix}
        <span className={`font-semibold ${meta.accentText}`}>Lv.{n.amount ?? 0}</span>
        {' '}
        {MESSAGES.level.notification.afterLevel}
      </>
    )
  }

  const who = <span className="font-semibold text-neutral-900 dark:text-white">{notificationSenderLabel(n)}</span>
  // 액션 키워드는 좌측 색상 아이콘이 이미 종류를 알려주므로 별도 색을 넣지 않고 본문과 같은 톤으로 둔다.
  const keyword = meta.label

  if (meta.target === 'comment') {
    return <>{who}님이 회원님의 댓글에 {keyword}{meta.suffix}</>
  }

  const target = n.postTitle ? (
    <>
      회원님이 작성하신{' '}
      <span className="font-medium text-neutral-700 dark:text-neutral-200">
        “{truncatePostTitle(n.postTitle)}”
      </span>
      에{' '}
    </>
  ) : (
    <>회원님의 게시글에 </>
  )

  return <>{who}님이 {target}{keyword}{meta.suffix}</>
}
