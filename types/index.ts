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
// ROOT: 최고 관리자(운영자). ADMIN보다 상위이며 role 변경 등 ROOT 전용 기능을 가진다.
// 판별은 문자열 직접 비교 대신 lib/role.ts의 isStaff/isRoot를 사용한다.
export type UserRole = 'USER' | 'ADMIN' | 'ROOT';

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
  // 자기소개(최대 200자). 백엔드 /api/auth/me(UserInfoResponse)가 내려주며, 없으면 null.
  // 마이페이지 자기소개 편집의 현재 값으로 쓴다.
  bio: string | null;
  // 계정 전환(온보딩)이 아직 필요한지. 백엔드 isFullyOnboarded()의 반대값으로,
  // loginId가 아직 없거나(마이그레이션 대상) 이메일 미인증이면 true.
  // true인 유저는 전역 가드(AuthProvider)가 /onboarding으로 강제 이동시킨다.
  // ⚠️ 마이그레이션이 끝나면 백엔드와 함께 정리될 필드.
  needsOnboarding: boolean;
}

// 로그인/회원가입 응답 (백엔드 LoginResponse와 1:1)
// 회원가입도 자동 로그인이라 checkIn이 실제로 채워져 온다(로그인과 동일하게 하루 1회 대상).
export interface LoginResponse {
  nickname: string;
  role: UserRole;
  checkIn: CheckInInfo;
  // 로그인(또는 회원가입 완료 직후 자동 로그인) 시점에 계정 전환이 아직 필요한지.
  // true면 로그인 폼이 홈 대신 /onboarding으로 보낸다. (User.needsOnboarding과 동일 규칙)
  needsOnboarding: boolean;
}

// 공개 프로필 (백엔드 PublicProfileResponse와 1:1)
// GET /api/users/by-nickname/{nickname} 응답. 인증 없이 조회 가능하며,
// 탈퇴(DELETED) 회원은 백엔드가 USER_NOT_FOUND(404)로 막는다(정지 회원은 조회 가능).
export interface PublicProfile {
  id: number;
  nickname: string;
  grade: UserGrade;
  displayGradeName: string;   // 등급 한글 표기 (프론트 lib/grade.ts와 별개로 백엔드가 내려주는 표시명)
  adminAuthor: boolean;       // 운영진(ADMIN) 여부 — 닉네임 옆 "운영진" 뱃지 표시용
  suspended: boolean;         // 관리자에 의해 정지(SUSPENDED)된 계정인지
  bio: string | null;         // 자기소개(최대 200자). 없으면 null.
  createdAt: string;          // 가입일
}

// 공개 프로필 - 해당 유저가 쓴 글 (백엔드 UserPostResponse와 1:1)
// 익명 글은 백엔드 쿼리에서 제외되므로 여기엔 공개 글만 내려온다.
// PostSummary와 달리 author/anonymous/hasImage가 없다(본인 프로필이라 작성자 자명).
export interface UserPost {
  id: number;
  categoryName: string;
  title: string;
  viewCount: number;
  commentCount: number;
  likeCount: number;
  createdAt: string;
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

// 게시글 검색 범위. 백엔드 SearchType enum과 1:1.
// NICKNAME은 닉네임 "정확 일치"이며, 익명글(anonymous)은 결과에서 제외된다.
export type SearchType = 'TITLE' | 'TITLE_CONTENT' | 'NICKNAME';

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
//  USER: 회원 신고. targetId는 신고 대상 유저의 id이며, 원문 게시글이 없어 postId는 항상 null로 온다.
export type ReportTargetType = 'POST' | 'COMMENT' | 'USER';

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

// ========== 포인트 ==========

// 포인트 거래 유형 — 백엔드 TransactionType enum과 1:1.
//  GRANT: 시스템 → 유저 지급 (현재는 어떤 API도 직접 발생시키지 않음, 향후 활동 보상 등)
//  COLLECT: 유저 → 시스템 회수 (현재 어떤 API도 발생시키지 않음, 향후 관리자 차감용)
//  ACCOUNT_OPENED: 포인트 계좌가 최초 생성될 때 남는 감사 로그. amount는 항상 0.
//  CHECKIN: 시스템 ↔ 유저, 매일 로그인 시 자동 출첵. amount는 플러스(지급)·마이너스(차감) 둘 다 가능.
//  ROULETTE: 유저 ↔ 유저(시스템 경유), 유저가 직접 베팅해 상대와 겨루는 룰렛 승부.
//  ROULETTE_FEE: 유저 → 시스템, 룰렛 판당 수수료.
//  TRANSFER: 유저 → 유저, 회원이 직접 다른 회원에게 보내는 포인트 송금.
//  TRANSFER_FEE: 송금 시 붙는 수수료. 랜덤이라 방향이 뒤바뀔 수 있다(유저→시스템이 기본이지만,
//    음수로 뽑히면 시스템→유저로 오히려 보너스가 지급된다). sender/recipient 중 하나가 시스템(null)이다.
//  BLOCK_PURCHASE: 유저 → 시스템, 다른 유저에게 활동 차단권 사용.
//  BLOCK_UNBLOCK: 유저 → 시스템, 본인 차단을 포인트로 즉시 해제.
//  BID_HOLD: 유저 → 시스템, 권한 경매 입찰 시 예탁(에스크로). 재입찰(인상) 시 차액만큼 추가로 발생.
//  BID_REFUND: 시스템 → 유저, 낙찰 실패 또는 입찰 취소 시 예탁금 환불.
export type TransactionType =
  | 'GRANT' | 'COLLECT' | 'ACCOUNT_OPENED' | 'CHECKIN' | 'ROULETTE' | 'ROULETTE_FEE' | 'TRANSFER' | 'TRANSFER_FEE'
  | 'BLOCK_PURCHASE' | 'BLOCK_UNBLOCK' | 'BID_HOLD' | 'BID_REFUND';

// 포인트 잔액 (백엔드 PointResponse와 1:1)
export interface PointBalance {
  userId: number | null;
  balance: number;
}

// 포인트 거래 내역 (백엔드 TransactionResponse와 1:1)
// senderId/recipientId가 null이면 시스템 계좌를 뜻한다(GRANT는 sender=null, COLLECT는 recipient=null).
export interface PointTransaction {
  transactionId: number;
  senderId: number | null;
  senderNickname: string | null;
  recipientId: number | null;
  recipientNickname: string | null;
  amount: number;
  type: TransactionType;
  createdAt: string;
}

// 로그인/회원가입 시 출첵 결과 (백엔드 LoginResponse.CheckInInfo와 1:1)
// checkedIn=false: 오늘 이미 했음 → 보여줄 정보 없음.
// checkedIn=true: 이번 로그인(또는 회원가입 직후 자동 로그인)에서 출첵이 실행됨.
// amount는 음수(차감)일 수도, 0일 수도, 양수(지급)일 수도 있다.
export interface CheckInInfo {
  checkedIn: boolean;
  amount: number | null;
}

// 룰렛(베팅형 대결) 설정. 승률은 의도적으로 노출하지 않는다.
export interface RouletteConfig {
  betUnit: number;
  minBet: number;
  maxBet: number;
  feeRate: number;
}

// 현재 고정된 룰렛 상대. 고정된 상대가 없으면 data 자체가 없다(undefined).
export interface RouletteOpponent {
  opponentId: number;
  opponentNickname: string;
}

// 룰렛 한 판의 결과 (백엔드 RouletteSpinResponse와 1:1)
export interface RouletteSpinResult {
  win: boolean;
  betAmount: number;
  fee: number;
  resultAmount: number;   // 실제로 오간 금액(상대 잔액 부족 시 배팅액보다 작을 수 있음)
  balanceAfter: number;
  opponentId: number;
  opponentNickname: string;
  opponentLocked: boolean;
}

// 포인트 송금 요청 (백엔드 TransferRequest와 1:1)
export interface TransferRequestBody {
  recipientId: number;
  amount: number;
}

// 포인트 송금 결과 (백엔드 TransferResponse와 1:1)
// ⚠️ 이 API는 항상 HTTP 200으로 응답한다 — 실제 성공/실패는 이 안의 status로 판단해야 한다.
// (ApiError의 HTTP status 기반 분기가 통하지 않는 유일한 API)
export interface TransferResult {
  status: 'ACCEPTED' | 'NOT_ACCEPTABLE';
  code?: string;              // 실패 시 백엔드 ErrorCode 이름(예: INSUFFICIENT_BALANCE). 없을 수도 있다.
  transfer?: PointTransaction | null;
  fee?: PointTransaction | null;
  e?: string;                 // 실패 시 예외 메시지. code가 없을 때의 폴백으로 쓴다.
}

// 알림 종류 — 백엔드 NotificationType enum과 1:1.
//  COMMENT: 내 게시글에 댓글 / REPLY: 내 댓글에 답글 / LIKE: 내 게시글에 좋아요
//  CONTENT_REMOVED: 관리자가 내 게시글/댓글을 강제 삭제함
//    ⚠️ 다른 타입과 성격이 다르다 — 발신자가 관리자이고, 대상 글이 이미 삭제된 상태라
//       클릭해도 이동할 곳이 없다(404). NotificationBell에서 이동을 막는 분기가 필요하다.
//  POINT_STOLEN: 룰렛(베팅) 대결에서 패배해 포인트를 뺏김. postId/commentId가 항상 null이고
//    amount(뺏긴 금액)가 채워진다. 발신자(상대)는 익명 처리되지 않는다(isAnonymous 항상 false).
//  POINT_WON: 룰렛(베팅) 대결에서 승리해 포인트를 얻음. POINT_STOLEN과 postId/amount 규칙은 동일.
//  POST_REWARD: 게시글 작성으로 포인트를 받음. postId/postTitle은 채워지고, sender는 시스템 지급이라 항상 null.
//  COMMENT_REWARD: 댓글 작성으로 포인트를 받음. postId/commentId 둘 다 채워지고, sender는 항상 null.
//  LIKE_REWARD: 내 게시글이 좋아요를 받아 포인트를 받음. postId가 채워지고, sender는 항상 null.
//  TRANSFER: 다른 회원이 나에게 포인트를 송금함. postId/commentId 항상 null, amount(받은 금액,
//    수수료 제외)가 채워진다. POINT_STOLEN/WON과 마찬가지로 isAnonymous 항상 false.
export type NotificationType = 'COMMENT' | 'REPLY' | 'LIKE' | 'CONTENT_REMOVED' | 'POINT_STOLEN' | 'POINT_WON' | 'POST_REWARD' | 'COMMENT_REWARD' | 'LIKE_REWARD' | 'TRANSFER';

// 알림 (백엔드 NotificationResponse record와 1:1)
// ⚠️ 키 이름 주의: 백엔드 record의 boolean 컴포넌트는 "선언명 그대로" 직렬화된다.
//    (PostDetailResponse의 isOwner 컴포넌트가 JSON "isOwner"로 나가는 것과 동일 규칙)
//    그래서 여기서는 anonymous/read가 아니라 isAnonymous/isRead가 정확한 키다.
export interface Notification {
  id: number;
  type: NotificationType;
  isAnonymous: boolean;       // 익명 댓글/답글로 생긴 알림인지
  senderName: string | null;  // 익명이면 백엔드가 null로 내려줌
  // 클릭 시 이동할 원본 게시글. ⚠️ POINT_STOLEN/POINT_WON은 항상 null (DB 제약 ck_notifications_post_id_by_type로 보장).
  postId: number | null;
  // 알림 대상 게시글 제목. 백엔드 NotificationResponse에 postTitle이 추가되면 채워진다.
  // 아직 배포 전이거나 값이 없으면 undefined/null일 수 있어, 렌더 시 "회원님의 게시글"로 폴백한다.
  postTitle?: string | null;
  commentId: number | null;   // 댓글/답글 알림이면 해당 댓글 id, 좋아요면 null
  // COMMENT_REWARD처럼 어떤 댓글로 포인트를 받았는지 보여줘야 하는 타입 전용. 그 외 타입은 null.
  commentContent: string | null;
  isRead: boolean;
  createdAt: string;
  amount: number | null;      // POINT_STOLEN/POINT_WON 전용, 오간 포인트 액수. 그 외 타입은 null.
}

// ========== 상점 ==========

// 상점 상품 종류 — 백엔드 ShopItemType enum과 1:1.
//  BLOCK: 정가 판매되는 임시 활동 차단권 (price/durationMinutes 사용)
//  ROLE_AUCTION: 주기적으로 경매가 열리는 UserRole 판매 설정 (targetRole~cadenceDays 사용)
export type ShopItemType = 'BLOCK' | 'ROLE_AUCTION';

// 상점 상품 (백엔드 ShopItemResponse와 1:1)
// type에 따라 사용되는 필드가 다르다 — BLOCK은 price/durationMinutes만, ROLE_AUCTION은 나머지만 채워진다.
export interface ShopItem {
  id: number;
  type: ShopItemType;
  name: string;
  price: number | null;
  durationMinutes: number | null;
  targetRole: UserRole | null;
  quantity: number | null;
  minPrice: number | null;
  durationDays: number | null;
  cadenceDays: number | null;
  active: boolean;
}

// 임시 활동 차단 구매 요청 (백엔드 PurchaseBlockRequest와 1:1)
export interface PurchaseBlockBody {
  targetUserId: number;
  itemId: number;
}

// 내 차단 상태 (백엔드 BlockStatusResponse와 1:1)
// blocked=false면 나머지 필드는 내려오지 않는다.
export interface BlockStatus {
  blocked: boolean;
  reason?: string;            // "OO님이 [24시간 차단권]을 사용해 차단했습니다" 형태의 조합 문구
  blockerNickname?: string;
  itemName?: string;
  expiresAt?: string;
  unblockItemName?: string;   // 해제에 사용할 상품명 (= 차단에 쓰인 상품과 동일)
  unblockPrice?: number;      // 해제에 필요한 포인트
}

// 차단 이의제기 접수 요청 (백엔드 BlockAppealRequest와 1:1)
export interface BlockAppealBody {
  message: string;
}

// 관리자 - 차단 이의제기 목록 항목 (백엔드 BlockAppealResponse와 1:1)
export interface BlockAppeal {
  id: number;
  activityBlockId: number;
  senderNickname: string;
  message: string;
  handled: boolean;
  createdAt: string;
}

// 진행 중인 권한 경매 회차 (백엔드 RoleAuctionRoundResponse와 1:1)
export interface RoleAuctionRound {
  id: number;
  shopItemId: number;   // 어떤 ROLE_AUCTION 상품(shop_item)에서 열린 회차인지 — 관리자 화면에서 매칭용
  targetRole: UserRole;
  quantity: number;
  minPrice: number;
  startAt: string;
  endAt: string;
  topBidAmount: number | null;   // 입찰이 없으면 null
  activeBidCount: number;
}

// 입찰/재입찰 요청 (백엔드 PlaceBidRequest와 1:1)
export interface PlaceBidBody {
  amount: number;
}

// 진행 중인 경매 회차 종료 시각 수정 요청 (백엔드 UpdateRoleAuctionRoundRequest와 1:1, ROOT 전용)
// endAt이 현재/과거 시각이면 조기 종료(즉시 정산)로 처리된다.
export interface UpdateRoleAuctionRoundBody {
  endAt: string;
}

// 내 권한 경매 낙찰(보유) 현황 (백엔드 RolePurchaseStatusResponse와 1:1)
// active=false면 나머지 필드는 내려오지 않는다.
export interface RolePurchaseStatus {
  active: boolean;
  targetRole?: UserRole;
  expiresAt?: string;
}

// 관리자 - 경매로 role을 보유 중인 유저 현황 (백엔드 RolePurchaseAdminResponse와 1:1)
export interface RolePurchaseAdmin {
  userId: number;
  nickname: string;
  targetRole: UserRole;
  previousRole: UserRole;
  expiresAt: string;
}

// 상점 상품 등록 요청 (백엔드 CreateShopItemRequest와 1:1, ROOT 전용)
// type=BLOCK이면 price/durationMinutes만, type=ROLE_AUCTION이면 targetRole~cadenceDays만 채운다.
export interface CreateShopItemBody {
  type: ShopItemType;
  name: string;
  price?: number;
  durationMinutes?: number;
  targetRole?: UserRole;
  quantity?: number;
  minPrice?: number;
  durationDays?: number;
  cadenceDays?: number;
}

// 상점 상품 수정 요청 (백엔드 UpdateShopItemRequest와 1:1, ROOT 전용)
// 필드는 모두 선택 — 넘긴 값만 반영된다. 이미 OPEN인 경매 회차에는 소급 적용되지 않는다.
export interface UpdateShopItemBody {
  price?: number;
  durationMinutes?: number;
  quantity?: number;
  minPrice?: number;
  durationDays?: number;
  cadenceDays?: number;
  active?: boolean;
}