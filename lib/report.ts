import type { ReportReason, ReportStatus, ReportTargetType } from '@/types'

// 신고 관련 표시 메타데이터의 단일 출처.
// 백엔드는 enum 상수("SPAM", "PENDING" 등)로만 내려주므로 한글 표기·색상은 프론트가 관리한다.
// 신고 모달 / 관리자 신고 페이지 / 마이페이지 "내 신고" 탭이 모두 이곳을 참조한다.
// (lib/grade.ts와 같은 패턴)

// ========== 신고 사유 ==========

export interface ReasonMeta {
  value: ReportReason
  label: string        // 라디오 버튼에 보이는 이름
  description: string  // 그 아래 보조 설명 — 사용자가 사유를 고르는 기준
}

// ⚠️ 배열 순서 = 신고 모달의 라디오 노출 순서. ETC는 상세 입력이 필요하므로 항상 마지막.
export const REPORT_REASONS: ReasonMeta[] = [
  {
    value: 'SPAM',
    label: '스팸 · 광고',
    description: '홍보성 도배, 반복 게시물',
  },
  {
    value: 'ABUSE',
    label: '욕설 · 부적절한 내용',
    description: '욕설, 혐오 표현, 선정적인 내용',
  },
  {
    value: 'ILLEGAL',
    label: '불법 정보 · 개인정보 노출',
    description: '불법 거래, 사기, 타인의 개인정보 게시',
  },
  {
    value: 'ETC',
    label: '기타',
    description: '위에 해당하지 않는 사유 (상세 입력 필수)',
  },
]

// 알 수 없는 값이 와도(백엔드 enum 추가 등) 안전하게 폴백한다.
export const reasonMeta = (reason: ReportReason): ReasonMeta =>
  REPORT_REASONS.find(r => r.value === reason) ?? REPORT_REASONS[REPORT_REASONS.length - 1]

// 상세 사유 최대 길이. 백엔드 @Size(max = 500)과 반드시 일치시킬 것.
export const REPORT_DETAIL_MAX = 500

// ========== 신고 처리 상태 ==========

export interface StatusMeta {
  value: ReportStatus
  label: string   // 뱃지 텍스트
  badge: string   // 뱃지 배경·글자 색 (light + dark)
}

export const REPORT_STATUSES: StatusMeta[] = [
  {
    value: 'PENDING',
    label: '처리 대기',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  },
  {
    value: 'RESOLVED',
    label: '조치 완료',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
  {
    value: 'REJECTED',
    label: '반려',
    badge: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
  },
]

export const statusMeta = (status: ReportStatus): StatusMeta =>
  REPORT_STATUSES.find(s => s.value === status) ?? REPORT_STATUSES[0]

// ========== 신고 대상 ==========

export const targetTypeLabel = (targetType: ReportTargetType): string =>
  targetType === 'POST' ? '게시글' : '댓글'

// 신고 대상의 원문 링크. 게시글이면 글 자체로, 댓글이면 그 댓글이 달린 글로 보낸다.
// null이면 링크를 걸지 말고 일반 텍스트로 렌더해야 한다 — 없는 글로 보내면 404 화면이 뜬다.
//
// 삭제된 대상을 거르는 게 이 함수의 핵심이다. 게시글·댓글은 소프트 삭제라 DB에는 남아 있고,
// 백엔드도 미리보기를 위해 삭제된 대상까지 조회한다. 그래서 "행이 있으니 링크를 걸어도 된다"는
// 추론이 성립하지 않는다 — 반드시 targetDeleted를 봐야 한다.
// (targetDeleted가 true면 백엔드가 postId도 null로 보내주므로 아래 두 가드는 사실상 이중 방어다.)
export function reportTargetHref(
  targetType: ReportTargetType,
  postId: number | null,
  targetDeleted: boolean,
): string | null {
  if (targetDeleted || postId === null) return null
  // 댓글은 게시글 상세의 댓글 영역으로 앵커 이동시킨다.
  return targetType === 'COMMENT' ? `/posts/${postId}#comments` : `/posts/${postId}`
}
