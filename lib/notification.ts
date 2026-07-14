import type { Notification, NotificationType } from '@/types'

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
export interface NotificationMeta {
  label: string
  accentText: string
  iconBg: string
  target: 'post' | 'comment'
  suffix: string
  icon: 'comment' | 'reply' | 'like'
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
}

export function notificationMeta(type: NotificationType): NotificationMeta {
  // 백엔드에 새 타입이 생겼는데 프론트가 아직 모르면 댓글 스타일로 폴백.
  return META[type] ?? META.COMMENT
}

// 스크린리더(aria-label)용 순수 텍스트 문구. 화면 렌더는 강조를 위해 컴포넌트가 JSX로 직접 조립한다.
export function notificationText(n: Notification): string {
  const who = notificationSenderLabel(n)
  const meta = notificationMeta(n.type)
  if (meta.target === 'comment') {
    return `${who}님이 회원님의 댓글에 ${meta.label}${meta.suffix}`
  }
  const target = n.postTitle ? `회원님이 작성하신 "${n.postTitle}"에` : '회원님의 게시글에'
  return `${who}님이 ${target} ${meta.label}${meta.suffix}`
}
