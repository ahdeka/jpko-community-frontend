import type { Notification, NotificationType } from '@/types'
import { MESSAGES } from '@/lib/messages'

// 알림 발신자 표시명. 익명 알림은 senderName이 null로 오므로 "익명"으로 대체한다.
// (isAnonymous가 true인데 senderName이 실수로 채워져 오는 경우까지 방어해 항상 "익명" 우선)
export function notificationSenderLabel(n: Notification): string {
  return n.isAnonymous || !n.senderName ? '익명' : n.senderName
}

// 게시글 제목이 길면 잘라준다.
// 문구 안에 인라인으로 강조 렌더하는데, CSS truncate는 inline 요소에서 까다로워
// 글자 수로 자르고 말줄임표를 붙인다.
export function truncatePostTitle(title: string, max = 15): string {
  return title.length > max ? `${title.slice(0, max)}…` : title
}

// 알림 종류별 표시 메타데이터.
//  - label:     상단 뱃지 & 본문 강조 키워드 ('댓글' | '답글' | '추천')
//  - accentText: 키워드/뱃지 글자색 (라이트/다크)
//  - iconBg:    좌측 원형 아이콘의 배경·글자색
//  - target:    알림 대상 — 게시글('post') 인지 내 댓글('comment')인지
//  - suffix:    키워드 뒤에 붙는 서술어
//  - icon:      좌측 아이콘 종류
//
// ⚠️ CONTENT_REMOVED/POINT_STOLEN/POINT_WON/POST_REWARD/COMMENT_REWARD/LEVEL_UP은 문구 구조 자체가
//    달라(첫 번째는 발신자를 밝히지 않고 대상이 이미 삭제됨, 나머지는 시스템 지급이거나 애초에
//    게시글/댓글과 무관함) label/target/suffix를 쓰지 않는다. NotificationBody와 notificationText가
//    별도로 분기하며, 여기서는 아이콘/색만 의미를 갖는다.
export interface NotificationMeta {
  label: string
  accentText: string
  iconBg: string
  target: 'post' | 'comment'
  suffix: string
  icon: 'comment' | 'reply' | 'like' | 'removed' | 'point' | 'level'
}

const META: Record<NotificationType, NotificationMeta> = {
  COMMENT: {
    label: '댓글',
    accentText: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
    target: 'post',
    suffix: '을 남겼습니다.',
    icon: 'comment',
  },
  REPLY: {
    label: '답글',
    accentText: 'text-teal-600 dark:text-teal-400',
    iconBg: 'bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400',
    target: 'comment',
    suffix: '을 남겼습니다.',
    icon: 'reply',
  },
  LIKE: {
    label: '추천',
    accentText: 'text-orange-600 dark:text-orange-400',
    iconBg: 'bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400',
    target: 'post',
    suffix: '을 하였습니다.',
    icon: 'like',
  },
  // 관리자가 내 게시글/댓글을 강제 삭제했을 때. 다른 알림과 달리 '좋은 소식'이 아니므로
  // 빨강 계열로 구분하고, 문구는 NotificationBody가 직접 조립한다.
  CONTENT_REMOVED: {
    label: '삭제',
    accentText: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
    target: 'post',
    suffix: '되었습니다.',
    icon: 'removed',
  },
  // 룰렛(베팅) 대결에서 패배해 내 포인트를 뺏김. target/suffix는 미사용(NotificationBody가 별도 분기).
  POINT_STOLEN: {
    label: '포인트',
    accentText: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
    target: 'post',
    suffix: '',
    icon: 'point',
  },
  // 룰렛(베팅) 대결에서 승리해 포인트를 얻음. POINT_STOLEN과 반대로 좋은 소식이라 에메랄드 계열로 구분한다.
  POINT_WON: {
    label: '포인트',
    accentText: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
    target: 'post',
    suffix: '',
    icon: 'point',
  },
  // 게시글 작성으로 포인트를 받음. 시스템이 지급하는 알림이라 발신자가 없다(POINT_WON과 달리 상대가 없음).
  POST_REWARD: {
    label: '포인트',
    accentText: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
    target: 'post',
    suffix: '',
    icon: 'point',
  },
  // 댓글 작성으로 포인트를 받음.
  COMMENT_REWARD: {
    label: '포인트',
    accentText: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
    target: 'post',
    suffix: '',
    icon: 'point',
  },
  // 활동 경험치가 쌓여 레벨이 올랐음. 시스템 알림이라 발신자가 없고 게시글/댓글과도 무관하다.
  // 색은 포인트(emerald)와 구분되게 indigo로 둔다 — 둘 다 '좋은 소식'이라 같은 색이면
  // 알림 목록에서 포인트 지급과 레벨업이 한 덩어리로 보인다.
  // ⚠️ amount에 담겨 오는 값은 포인트 액수가 아니라 '도달한 레벨'이다.
  LEVEL_UP: {
    label: '레벨',
    accentText: 'text-indigo-600 dark:text-indigo-400',
    iconBg: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400',
    target: 'post',
    suffix: '',
    icon: 'level',
  },
}

export function notificationMeta(type: NotificationType): NotificationMeta {
  // 백엔드에 새 타입이 생겼는데 프론트가 아직 모르면 댓글 스타일로 폴백.
  return META[type] ?? META.COMMENT
}

// 강제 삭제 알림이 "내 댓글"에 대한 것인지 판별한다.
// 백엔드는 게시글 삭제면 commentId=null, 댓글 삭제면 해당 댓글 id를 담아 보낸다.
export function isRemovedComment(n: Notification): boolean {
  return n.commentId !== null
}

// 알림 클릭 시 이동할 경로. null이면 이동시키지 않는다(읽음 처리만).
//
// CONTENT_REMOVED가 특수하다 — 대상이 이미 삭제된 뒤에 오는 알림이라 순진하게 /posts/{postId}로
// 보내면 404가 뜬다. 그래서 두 경우를 나눈다.
//  - 게시글이 삭제된 알림: 원문 자체가 사라졌으므로 이동할 곳이 없다 → null.
//  - 댓글이 삭제된 알림: 원문 게시글은 살아 있으므로 그 글의 댓글 영역으로 보낸다.
//    (내 댓글은 "삭제된 댓글입니다"로 보이지만, 어떤 글에서 벌어진 일인지 맥락은 확인할 수 있다.)
// POINT_STOLEN/POINT_WON(룰렛 알림)은 애초에 게시글/댓글과 무관해 postId가 항상 null로 오므로
// 이동할 곳이 없다.
export function notificationHref(n: Notification): string | null {
  if (n.type === 'CONTENT_REMOVED') {
    return isRemovedComment(n) ? `/posts/${n.postId}#comments` : null
  }
  if (n.type === 'POINT_STOLEN' || n.type === 'POINT_WON') return null
  // 레벨업은 게시글/댓글과 무관해 postId가 항상 null이지만, 이동할 곳이 없는 건 아니다.
  // 마이페이지에 레벨·경험치 카드가 있으므로 거기로 보내 "얼마나 올랐는지"를 바로 확인시킨다.
  if (n.type === 'LEVEL_UP') return '/mypage'
  return n.postId !== null ? `/posts/${n.postId}` : null
}

// 스크린리더(aria-label)용 순수 텍스트 문구. 화면 렌더는 강조를 위해 컴포넌트가 JSX로 직접 조립한다.
export function notificationText(n: Notification): string {
  const meta = notificationMeta(n.type)

  // 강제 삭제는 발신자(관리자)를 밝히지 않는다 — 아래 NotificationBody와 동일한 규칙.
  if (n.type === 'CONTENT_REMOVED') {
    if (isRemovedComment(n)) return '운영 정책에 따라 회원님의 댓글이 삭제되었습니다.'
    const what = n.postTitle ? `게시글 "${n.postTitle}"이(가)` : '게시글이'
    return `운영 정책에 따라 회원님의 ${what} 삭제되었습니다.`
  }

  // 룰렛 대결 결과: 게시글/댓글과 무관하므로 별도 문구로 조립한다.
  // 상대는 익명 처리되지 않는다(백엔드가 isAnonymous를 항상 false로 보냄).
  if (n.type === 'POINT_STOLEN') {
    const who = notificationSenderLabel(n)
    return `${who}${MESSAGES.points.notification.stolenAfterName}${(n.amount ?? 0).toLocaleString()}P${MESSAGES.points.notification.stolenSuffix}`
  }
  if (n.type === 'POINT_WON') {
    const who = notificationSenderLabel(n)
    return `${who}${MESSAGES.points.notification.wonAfterName}${(n.amount ?? 0).toLocaleString()}P${MESSAGES.points.notification.wonSuffix}`
  }

  // 게시글 작성 포인트 지급: 시스템 알림이라 발신자를 밝히지 않는다. 어떤 글인지 제목으로 보여준다.
  if (n.type === 'POST_REWARD') {
    const what = n.postTitle ? `게시글 "${truncatePostTitle(n.postTitle)}" 작성으로` : '게시글 작성으로'
    return `${what} ${(n.amount ?? 0).toLocaleString()}${MESSAGES.points.notification.rewardSuffix}`
  }

  // 댓글 작성 포인트 지급: POST_REWARD와 동일한 이유로 발신자를 밝히지 않는다. 어떤 댓글인지 내용으로 보여준다.
  if (n.type === 'COMMENT_REWARD') {
    const what = n.commentContent ? `댓글 "${truncatePostTitle(n.commentContent)}"으로` : '댓글 작성으로'
    return `${what} ${(n.amount ?? 0).toLocaleString()}${MESSAGES.points.notification.rewardSuffix}`
  }

  // 레벨업: 시스템 알림이라 발신자를 밝히지 않는다(POST_REWARD와 같은 이유).
  // amount가 도달 레벨이며, 혹시 비어 오면 0이 아니라 문구에서 숫자를 뺄 수 없으므로
  // 최소값 0으로 폴백한다(그래도 문장 자체는 성립한다).
  if (n.type === 'LEVEL_UP') {
    return `${MESSAGES.level.notification.prefix}Lv.${n.amount ?? 0} ${MESSAGES.level.notification.afterLevel}`
  }

  const who = notificationSenderLabel(n)
  if (meta.target === 'comment') {
    return `${who}님이 회원님의 댓글에 ${meta.label}${meta.suffix}`
  }
  const target = n.postTitle ? `회원님이 작성하신 "${n.postTitle}"에` : '회원님의 게시글에'
  return `${who}님이 ${target} ${meta.label}${meta.suffix}`
}
