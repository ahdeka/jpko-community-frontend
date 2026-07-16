// types/index.ts

// 백엔드 ApiResponse<T> 구조
export interface ApiResponse<T> {
  status: number;
  code: string;
  message?: string;
  data?: T;        // ok(message)처럼 data 없는 경우도 있어서 optional
}

// 페이지네이션 - Spring의 Page<T> 응답 구조
export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;   // 현재 페이지 (0부터 시작)
  size: number;
}

// 유저 권한(role) — 접근 제어 축. 백엔드 UserRole enum과 1:1.
export type UserRole = 'USER' | 'ADMIN';

// 계정 상태(status) — 백엔드 UserStatus enum과 1:1.
//  ACTIVE: 정상 / SUSPENDED: 관리자 정지 / DELETED: 탈퇴(익명화)
// 관리자 API로는 ACTIVE·SUSPENDED만 지정 가능하며, DELETED는 회원 탈퇴로만 진입한다(읽기 전용).
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';

// 유저 등급(grade) — role과 무관한 별개의 뱃지성 축(사무라이 계급 테마).
// 관리자가 수동 부여하며, 낮은 순 → 높은 순으로 나열한다.
// 백엔드 UserGrade enum과 1:1이며, SHOGUN(쇼군)은 운영진(ADMIN) 전용이다.
export type UserGrade = 'ASHIGARU' | 'SAMURAI' | 'HATAMOTO' | 'DAIMYO' | 'SHOGUN';

// 유저
export interface User {
  id: number;
  email: string;
  nickname: string;
  role: UserRole;
  // 이메일 인증 여부. 미인증이어도 모든 기능은 이용 가능하며, 마이페이지에서 인증을 "권장"만 한다.
  // 백엔드 /api/auth/me(UserInfoResponse)가 내려주는 값.
  emailVerified: boolean;
  // 유저 등급. 백엔드는 enum 상수("ASHIGARU" 등)로만 내려주며,
  // 한글 이름·설명·색상은 프론트(lib/grade.ts)가 매핑한다.
  grade: UserGrade;
}

// 관리자 회원 관리 목록 항목 (백엔드 AdminUserResponse와 1:1)
export interface AdminUser {
  id: number;
  email: string;
  nickname: string;
  role: UserRole;
  status: UserStatus;
  grade: UserGrade;
  displayGradeName: string;  // 등급 한글 표기 (예: "아시가루") — 백엔드 enum 표시명
  emailVerified: boolean;
  createdAt: string;
}

// 카테고리
export interface Category {
  id: number;
  name: string;
  slug: string;
  displayOrder: number;
}

// 게시글 목록용
export interface PostSummary {
  id: number;
  categoryName: string;
  title: string;
  author: string;
  // 작성자가 운영진(ADMIN)인지 — 닉네임 옆 "운영진" 뱃지 표시용.
  // 백엔드는 익명 글이면 false로 내려준다(운영진이 익명으로 써도 신원 노출 방지).
  adminAuthor: boolean;
  anonymous: boolean;
  viewCount: number;
  commentCount: number;
  likeCount: number;
  hasImage: boolean;
  createdAt: string;
}

// 공지사항 목록 / 게시판 상단 고정 노출용
// 백엔드 NoticeSummaryResponse와 1:1 대응한다.
// (목록 응답에는 author/content가 내려오지 않는다 — 상세에서만 제공)
export interface NoticeSummary {
  id: number;
  title: string;
  viewCount: number;
  pinned: boolean;     // 게시판 상단 고정 여부
  featured: boolean;   // 메인 상단 중요 공지 여부
  createdAt: string;
}

// 공지사항 상세용 (백엔드 NoticeDetailResponse)
export interface NoticeDetail {
  id: number;
  title: string;
  content: string;     // 백엔드가 sanitize한 HTML
  author: string;
  viewCount: number;
  pinned: boolean;
  featured: boolean;
  createdAt: string;
}

// 마이페이지 - 내가 쓴 글 (백엔드 MyPostResponse)
export interface MyPost {
  id: number;
  categoryName: string;
  title: string;
  viewCount: number;
  createdAt: string;
}

// 마이페이지 - 내가 쓴 댓글 (백엔드 MyCommentResponse)
export interface MyComment {
  id: number;
  postId: number;       // 클릭 시 원본 게시글로 이동
  postTitle: string;
  content: string;
  createdAt: string;
}

// 게시글 목록 응답 (상단 고정 공지 + 게시글 페이지)
export interface PostListResponse {
  pinnedNotices: NoticeSummary[];
  posts: PageResponse<PostSummary>;
}

// 게시글 검색 범위
export type SearchType = 'TITLE' | 'TITLE_CONTENT';

// 게시글 작성/수정 응답용
export interface PostResponse {
  id: number
}

// 게시글 상세용
// content는 백엔드가 Jsoup으로 sanitize한 HTML 문자열이며, 이미지는
// 별도 배열이 아니라 content 안에 <img> 태그로 인라인 포함된다.
export interface PostDetail extends PostSummary {
  content: string;
  isOwner: boolean;
  likeCount: number;
  dislikeCount: number;
}

// 댓글
export interface Comment {
  id: number;
  author: string;
  // 작성자가 운영진(ADMIN)인지. 백엔드는 삭제·익명 댓글이면 false로 내려준다.
  adminAuthor: boolean;
  anonymous: boolean;
  isOwner: boolean;
  content: string;
  deleted: boolean;
  createdAt: string;
  replies: Comment[];
}

// 좋아요
export interface LikeStatus {
  likeCount: number;
  dislikeCount: number;
  myType: 'LIKE' | 'DISLIKE' | null;
}

// ========== 신고 ==========

// 신고 대상 종류 — 백엔드 ReportTargetType enum과 1:1.
// 백엔드는 (targetType + targetId) 폴리모픽 구조라 대상이 늘어나면 여기에 추가된다.
export type ReportTargetType = 'POST' | 'COMMENT';

// 신고 사유 — 백엔드 ReportReason enum과 1:1.
// ETC는 detail(상세 사유) 입력이 필수이며, 백엔드가 REPORT_DETAIL_REQUIRED로 재검증한다.
export type ReportReason = 'SPAM' | 'ABUSE' | 'ILLEGAL' | 'ETC';

// 신고 처리 상태 — 백엔드 ReportStatus enum과 1:1.
//  PENDING: 접수(처리 대기) / RESOLVED: 조치 완료(대상 삭제 등) / REJECTED: 반려
// 관리자가 대상을 삭제하면 백엔드가 ContentDeletedEvent로 PENDING → RESOLVED 자동 전환한다.
export type ReportStatus = 'PENDING' | 'RESOLVED' | 'REJECTED';

// 신고 접수 요청 (백엔드 ReportCreateRequest와 1:1)
export interface ReportCreateBody {
  targetType: ReportTargetType;
  targetId: number;
  reason: ReportReason;
  detail?: string;   // ETC일 때만 필수, 최대 500자
}

// 신고 접수 응답 (백엔드 ReportResponse)
export interface ReportResponse {
  id: number;
}

// 마이페이지 - 내 신고 내역 (백엔드 MyReportResponse와 1:1)
export interface MyReport {
  id: number;
  targetType: ReportTargetType;
  targetId: number;
  // 원문 게시글 id. 게시글 신고면 targetId와 같고, 댓글 신고면 그 댓글이 달린 게시글 id.
  // ⚠️ targetDeleted가 true면 백엔드가 항상 null로 내려준다 → 링크를 그리려면 null 가드 필수.
  postId: number | null;
  targetPreview: string;   // 제목/본문 앞 40자. 삭제됐으면 "삭제된 게시글입니다." 등으로 대체된다.
  // 신고 대상이 더 이상 볼 수 없는 상태인지. 다음을 모두 포함한다.
  //  - 대상 자체가 삭제됨(소프트 삭제 포함)
  //  - 댓글 신고인데 그 댓글이 달린 게시글이 삭제됨
  // true면 postId가 null이고 targetPreview도 안내 문구로 바뀌므로, 원문 링크를 걸면 안 된다.
  targetDeleted: boolean;
  reason: ReportReason;
  detail: string | null;
  status: ReportStatus;
  createdAt: string;
}

// 관리자 - 신고 집계 목록 항목 (백엔드 AdminReportSummaryResponse와 1:1)
// 신고 "건별"이 아니라 신고 "대상별"로 묶은 집계다.
export interface AdminReportSummary {
  targetType: ReportTargetType;
  targetId: number;
  postId: number | null;   // MyReport.postId와 동일한 규칙 (targetDeleted면 null)
  targetPreview: string;
  // 대상 작성자 닉네임. 삭제된 대상이라도 작성자는 그대로 내려준다(관리자가 누구 글인지 알아야 하므로).
  // 대상 자체를 못 찾은 경우에만 "-"가 온다.
  targetAuthor: string;
  targetDeleted: boolean;  // MyReport.targetDeleted와 동일한 규칙
  // 이 대상의 대표 처리 상태. 한 대상에 상태가 섞여 있으면
  // PENDING > RESOLVED > REJECTED 우선순위로 백엔드가 하나를 골라 내려준다.
  // ⚠️ status 필터를 건 조회에서는 항상 필터값과 같아지므로 의미가 없다.
  status: ReportStatus;
  // 신고 건수. ⚠️ status 필터를 걸면 "전체 건수"가 아니라 "그 상태의 건수"가 된다
  // (백엔드가 WHERE로 거른 뒤 COUNT하기 때문).
  reportCount: number;
  lastReportedAt: string;
}

// 관리자 - 특정 대상의 신고 상세 (백엔드 AdminReportDetailResponse와 1:1)
export interface AdminReportDetail {
  id: number;
  reporterNickname: string;
  reason: ReportReason;
  detail: string | null;
  status: ReportStatus;
  createdAt: string;
}

// 알림 종류 — 백엔드 NotificationType enum과 1:1.
//  COMMENT: 내 게시글에 댓글 / REPLY: 내 댓글에 답글 / LIKE: 내 게시글에 좋아요
//  CONTENT_REMOVED: 관리자가 내 게시글/댓글을 강제 삭제함
//    ⚠️ 다른 타입과 성격이 다르다 — 발신자가 관리자이고, 대상 글이 이미 삭제된 상태라
//       클릭해도 이동할 곳이 없다(404). NotificationBell에서 이동을 막는 분기가 필요하다.
export type NotificationType = 'COMMENT' | 'REPLY' | 'LIKE' | 'CONTENT_REMOVED';

// 알림 (백엔드 NotificationResponse record와 1:1)
// ⚠️ 키 이름 주의: 백엔드 record의 boolean 컴포넌트는 "선언명 그대로" 직렬화된다.
//    (PostDetailResponse의 isOwner 컴포넌트가 JSON "isOwner"로 나가는 것과 동일 규칙)
//    그래서 여기서는 anonymous/read가 아니라 isAnonymous/isRead가 정확한 키다.
export interface Notification {
  id: number;
  type: NotificationType;
  isAnonymous: boolean;       // 익명 댓글/답글로 생긴 알림인지
  senderName: string | null;  // 익명이면 백엔드가 null로 내려줌
  postId: number;             // 클릭 시 이동할 원본 게시글
  // 알림 대상 게시글 제목. 백엔드 NotificationResponse에 postTitle이 추가되면 채워진다.
  // 아직 배포 전이거나 값이 없으면 undefined/null일 수 있어, 렌더 시 "회원님의 게시글"로 폴백한다.
  postTitle?: string | null;
  commentId: number | null;   // 댓글/답글 알림이면 해당 댓글 id, 좋아요면 null
  isRead: boolean;
  createdAt: string;
}