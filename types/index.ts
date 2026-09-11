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

// 유저 레벨/경험치 (백엔드 UserLevelResponse와 1:1).
// role(권한)과 무관한 활동량 축이며, 예전 UserGrade(관리자 수동 부여)를 대체한다.
//
// 백엔드 LevelPolicy: level = floor(totalExp / expPerLevel), expPerLevel은 현재 500이고
// **레벨 상한이 없다**(Lv.100도 가능). 구간별 표시 정책은 lib/level.ts가 단독으로 관리한다.
//  - totalExp:     누적 경험치 전체
//  - expIntoLevel: 현재 레벨 구간에서 모은 경험치 (진행률 분자)
//  - expPerLevel:  한 레벨에 필요한 경험치 (진행률 분모). 백엔드 설정값이라 하드코딩하지 않는다.
export interface UserLevelInfo {
  level: number;
  totalExp: number;
  expIntoLevel: number;
  expPerLevel: number;
}

// 유저
export interface User {
  id: number;
  email: string;
  nickname: string;
  role: UserRole;
  // 내 레벨/경험치. 백엔드 /api/auth/me(UserInfoResponse.level)가 내려주며,
  // 마이페이지 레벨 카드가 이 값만으로 진행바까지 그린다(추가 API 호출 없음).
  // ⚠️ optional인 이유: 프론트(Vercel)가 백엔드(EC2)보다 먼저 배포되면 이 필드가 통째로 없다.
  //    그 경우 레벨 카드만 숨기고 마이페이지의 나머지는 정상 동작해야 한다.
  //    (Notification.postTitle이 optional인 것과 같은 배포 스큐 방어)
  level?: UserLevelInfo;
  // 자기소개(최대 200자). 백엔드 /api/auth/me(UserInfoResponse)가 내려주며, 없으면 null.
  // 마이페이지 자기소개 편집의 현재 값으로 쓴다.
  bio: string | null;
}

// 로그인/회원가입 응답 (백엔드 LoginResponse와 1:1)
// 예전에는 로그인 시 서버가 자동으로 출첵을 처리하고 그 결과(checkIn)를 여기에 실어 보냈지만,
// 출석이 "출석하기 버튼"으로 개편되면서 백엔드 LoginResponse에서 제거됐다(POST /api/check-ins로 이동).
export interface LoginResponse {
  nickname: string;
  role: UserRole;
}

// 공개 프로필 (백엔드 PublicProfileResponse와 1:1)
// GET /api/users/by-nickname/{nickname} 응답. 인증 없이 조회 가능하며,
// 탈퇴(DELETED) 회원은 백엔드가 USER_NOT_FOUND(404)로 막는다(정지 회원은 조회 가능).
export interface PublicProfile {
  id: number;
  nickname: string;
  level: number;              // 활동 레벨 — 닉네임 옆 레벨 뱃지 표시용 (lib/level.ts가 구간·색 매핑)
  adminAuthor: boolean;       // 운영진(ADMIN) 여부 — 닉네임 옆 "운영진" 뱃지 표시용
  rootAuthor: boolean;        // 최고 관리자(ROOT) 여부 — 닉네임 옆 "운영자"(보라) 뱃지 표시용. adminAuthor와 상호배타
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
  createdAt: string;
  // 정지 중일 때의 해제 예정 시각. null이면 정지가 아니거나 ROOT가 건 무기한 정지다
  // (구분은 status로 한다).
  suspendedUntil: string | null;
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
  // 작성자의 활동 레벨. 닉네임 옆 레벨 뱃지 표시용.
  // ⚠️ 익명 글이면 백엔드가 null로 내려준다 — 익명 글에 레벨이 붙으면 같은 글타래에서
  //    작성자를 좁힐 수 있는 식별 단서가 되어 익명성이 깨지기 때문(adminAuthor와 동일 규칙).
  //    탈퇴 회원도 null이다. 0은 유효한 값(=Lv.0)이므로 falsy 체크가 아니라 null 체크로 판별할 것.
  authorLevel: number | null;
  // 작성자가 운영진(ADMIN)인지 — 닉네임 옆 "운영진" 뱃지 표시용.
  // 백엔드는 익명 글이면 false로 내려준다(운영진이 익명으로 써도 신원 노출 방지).
  adminAuthor: boolean;
  // 작성자가 최고 관리자(ROOT)인지 — 닉네임 옆 "운영자"(보라) 뱃지 표시용.
  // adminAuthor와 상호배타적이며, 익명 글이면 마찬가지로 false.
  rootAuthor: boolean;
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

// 인기글 집계 기간. 백엔드 PopularPeriod enum과 1:1.
// 노출 개수는 요청 파라미터가 아니라 백엔드 설정(app.popular-post.display-size)이 정하므로
// 프론트에서 개수를 지정하지 않는다.
export type PopularPeriod = 'TODAY' | 'WEEKLY';

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

// 댓글 목록 응답 (백엔드 CommentPageResponse)
export interface CommentPage {
  // 최상위 댓글 페이지. 각 항목이 자기 대댓글(replies)을 품고 있고,
  // totalElements/number/totalPages는 "최상위 댓글" 기준(삭제된 것 포함)이다.
  comments: PageResponse<Comment>;
  // 헤더 "댓글 N개"용 총개수 — 대댓글 포함, 삭제된 댓글 제외.
  // 위 comments.totalElements(최상위·삭제 포함)와 의미가 다르므로 혼동 주의.
  totalCommentCount: number;
}

// 댓글
export interface Comment {
  id: number;
  author: string;
  // 작성자의 활동 레벨. PostSummary.authorLevel과 동일 규칙이며,
  // 삭제된 댓글도 null이다(백엔드가 작성자 자체를 "(삭제됨)"으로 감추므로).
  authorLevel: number | null;
  // 작성자가 운영진(ADMIN)인지. 백엔드는 삭제·익명 댓글이면 false로 내려준다.
  adminAuthor: boolean;
  // 작성자가 최고 관리자(ROOT)인지 — "운영자"(보라) 뱃지 표시용. adminAuthor와 상호배타.
  rootAuthor: boolean;
  anonymous: boolean;
  isOwner: boolean;
  content: string;
  // 첨부 이미지 URL(단일). 첨부가 없거나 삭제된 댓글이면 백엔드가 null로 내린다.
  imageUrl: string | null;
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
//  GRANT: 시스템 → 유저 지급. 현재 유일한 발생원은 활동 보상(게시글·댓글 작성, 내 글이 받은 좋아요)이다.
//    백엔드에 일일 상한이 있어, 그날 활동 보상 누적이 상한에 닿으면 남은 만큼만 지급되고(부분 지급)
//    상한을 다 채운 뒤에는 거래 자체가 생기지 않는다(원장에도 알림에도 남지 않음). 상한은 KST 자정에 초기화된다.
//    amount는 언제나 "실제 지급된 액수"이므로 프론트가 별도로 보정할 것은 없다.
//  COLLECT: 유저 → 시스템 회수 (현재 어떤 API도 발생시키지 않음, 향후 관리자 차감용)
//  ACCOUNT_OPENED: 포인트 계좌가 최초 생성될 때 남는 감사 로그. amount는 항상 0.
//  CHECKIN: 시스템 → 유저, 헤더 사용자 메뉴 > "출석하기" 모달에서 하루 한 번 받는 출석 보상.
//    개편 전에는 로그인 시 자동 처리에 차감(마이너스)도 있었지만, 지금은 언제나 지급(플러스)뿐이다.
//    이달 누적 출석이 마일스톤(7·15·25일)에 닿은 회차에는 기본 지급액에 보너스가 합쳐진 한 건으로 기록된다.
//  ROULETTE: 유저 ↔ 유저(시스템 경유), 유저가 직접 베팅해 상대와 겨루는 룰렛 승부.
//  ROULETTE_FEE: 유저 → 시스템, 룰렛 판당 수수료.
//  PACHINKO_FEE: 유저 → 시스템, 파칭코 판당 수수료.
//  PACHINKO: 유저 ↔ 시스템, 파칭코 결과 정산(순손익). 방향은 승/패에 따라 갈린다.
//  SLOT_FEE: 유저 → 시스템, 슬롯머신 판당 수수료.
//  SLOT: 유저 ↔ 시스템, 슬롯머신 결과 정산(순손익). 방향은 승/패에 따라 갈린다.
export type TransactionType =
  | 'GRANT' | 'COLLECT' | 'ACCOUNT_OPENED' | 'CHECKIN' | 'ROULETTE' | 'ROULETTE_FEE'
  | 'PACHINKO_FEE' | 'PACHINKO' | 'SLOT_FEE' | 'SLOT';

// 포인트 잔액 (백엔드 PointResponse와 1:1)
export interface PointBalance {
  userId: number | null;
  balance: number;
}

// ========== 포인트 랭킹 ==========

// 랭킹 한 줄 (백엔드 RankingEntryResponse와 1:1).
// rank는 백엔드가 이미 계산해서 내려준다(동점은 정렬 tie-break으로 유니크하게 갈린다 —
// 공동 순위는 없다). 프론트는 이 값을 그대로 표시만 하고 순위를 다시 매기지 않는다.
export interface RankingEntry {
  rank: number;
  userId: number;
  nickname: string;
  balance: number;
}

// 상위 랭킹 (백엔드 TopRankingResponse와 1:1). GET /api/points/ranking/top.
// 비로그인 포함 누구나 조회 가능하며, entries는 상위 top-size(현재 5)명, rank 오름차순.
// 아직 랭킹 대상이 아무도 없으면 빈 배열일 수 있다.
export interface TopRanking {
  entries: RankingEntry[];
}

// 내 순위 + 주변 (백엔드 MyRankingResponse와 1:1). GET /api/points/ranking/me (인증 필수).
//  - myRank      : 내 순위. 내가 랭킹 대상이 아니면 null(이때 neighbors는 빈 배열).
//  - myUserId    : 본인 식별용. top/neighbors 어디서든 userId === myUserId로 "나"를 강조한다.
//  - totalRanked : 전체 랭킹 인원수("전체 N명 중 R위" 표기용).
//  - topEntries  : 상위 top-size명 (top 엔드포인트와 동일). 마이페이지 통합 뷰 상단 블록.
//  - neighbors   : 내 위 k명 + 나 + 아래 k명 (rank 오름차순 연속). myRank=null이면 빈 배열.
// ⚠️ 내가 상위권이면 topEntries와 neighbors가 겹친다 → lib/ranking.ts에서 userId 기준으로 합친다.
export interface MyRanking {
  myRank: number | null;
  myUserId: number | null;
  totalRanked: number;
  topEntries: RankingEntry[];
  neighbors: RankingEntry[];
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

// ========== 출석 ==========

// 이달 누적 출석 횟수에 걸린 보너스 한 칸 (백엔드 CheckInCalendarResponse.Milestone과 1:1).
//  count   : 달성 조건이 되는 그 달의 누적 출석 일수 (백엔드가 1~27로 제한 — 2월도 달성 가능하도록)
//  bonus   : 그 회차에 딱 한 번 얹어주는 보너스 포인트
//  achieved: 조회한 달의 누적 출석이 count 이상인지. '이번 달'이 아니라 '조회한 달' 기준이라
//            과거 달을 열어보면 그 달의 달성 여부가 그대로 온다.
export interface CheckInMilestone {
  count: number;
  bonus: number;
  achieved: boolean;
}

// 출석 달력 (백엔드 CheckInCalendarResponse와 1:1). GET /api/check-ins?year=&month=
export interface CheckInCalendar {
  year: number;
  month: number;             // 1~12
  daysInMonth: number;       // 그 달의 마지막 날(28~31). 윤년 계산을 프론트가 하지 않도록 서버가 준다.
  // 서버가 KST로 판단한 '오늘'("YYYY-MM-DD"). 브라우저 타임존과 무관하게 이 값으로 오늘 칸을 칠한다
  // — new Date()로 추측하면 UTC+9 밖 사용자에게 하루씩 어긋난다.
  today: string;
  checkedInDays: number[];   // 조회한 달에 출석한 '일'만 (예: [1, 2, 5, 7])
  monthlyCount: number;      // = checkedInDays.length (조회한 달 기준)
  checkedInToday: boolean;   // 조회한 달과 무관하게 항상 '오늘' 기준 — 출석 버튼 활성화용
  dailyAmount: number;       // 출석 1회 기본 지급 포인트 (백엔드 app.checkin.amount)
  dailyExp: number;          // 출석 1회 지급 경험치 (백엔드 app.exp.check-in, 일일 상한 제외)
  milestones: CheckInMilestone[];
}

// 출석 실행 결과 (백엔드 CheckInOutcome과 1:1). POST /api/check-ins
// 잔액도 갱신된 출석일 목록도 들어있지 않으므로, 성공 후에는 달력을 다시 조회하고
// 헤더 잔액·레벨은 각각 notifyPointBalanceChanged()·fetchUser()로 따로 갱신해야 한다.
export interface CheckInOutcome {
  amount: number;      // 기본 + 보너스 합계. 개편 후로는 항상 양수(차감이 없다).
  bonusAmount: number;  // 마일스톤 보너스만. 달성 회차가 아니면 0.
  monthlyCount: number; // 이번 출석까지 포함한 이달 누적 출석 일수
  // 실제로 지급된 경험치. 출석 exp는 일일 상한을 타지 않아 보통 dailyExp와 같지만,
  // 서버가 UserLevel 행을 못 찾으면 0이 온다(경고 로그만 남기고 출석 자체는 성공) → 0이면 표시하지 않는다.
  expAmount: number;
}

// 룰렛(베팅형 대결) 설정. 승률은 의도적으로 노출하지 않는다.
export interface RouletteConfig {
  betUnit: number;
  minBet: number;
  maxBet: number;
  feeRate: number;
  agreed: boolean;
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

// 파칭코(플린코형 구슬 낙하) 설정. 구슬 1개당 가격(ballPrice)과 한 판에 쏠 수 있는 개수 범위.
// 못의 좌/우 확률은 의도적으로 노출하지 않는다.
export interface PachinkoConfig {
  ballPrice: number;
  minBalls: number;
  maxBalls: number;
  feeRate: number;
  rows: number;
  slotMultipliers: number[];
}

// 구슬 1개의 결과 (백엔드 PachinkoBallResult와 1:1)
export interface PachinkoBallResult {
  bounces: boolean[];   // true = 오른쪽으로 튕김
  slotIndex: number;
  multiplier: number;
  payout: number;       // round(ballPrice * multiplier)
}

// 파칭코 한 판의 결과 (백엔드 PachinkoPlayResponse와 1:1). 구슬 ballCount개를 각각 독립적으로 쏘고
// 그 결과를 합산한다.
export interface PachinkoPlayResult {
  ballCount: number;
  ballPrice: number;
  totalCost: number;    // ballCount * ballPrice
  fee: number;
  balls: PachinkoBallResult[];   // 구슬 개수만큼, 쏜 순서 그대로
  totalPayout: number;
  netAmount: number;    // totalPayout - totalCost (음수면 순손실)
  win: boolean;
  balanceAfter: number;
}

// 슬롯머신(3릴, 트리플 매치만 당첨) 설정. 심볼별 등장 확률(weight)은 의도적으로 노출하지 않는다.
export interface SlotConfig {
  betUnit: number;
  minBet: number;
  maxBet: number;
  feeRate: number;
  symbols: { name: string; multiplier: number }[];
}

// 슬롯머신 한 판의 결과 (백엔드 SlotPlayResponse와 1:1)
export interface SlotPlayResult {
  betAmount: number;
  fee: number;
  symbols: string[];   // 릴 3개에 나온 심볼 이름
  tripleMatch: boolean;
  multiplier: number;
  payout: number;
  netAmount: number;
  win: boolean;
  balanceAfter: number;
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
//  LEVEL_UP: 활동 경험치가 쌓여 레벨이 올랐음. 시스템 알림이라 sender가 항상 null이고,
//    postId/commentId도 항상 null이다(DB 제약 ck_notifications_post_id_by_type로 보장).
//    ⚠️ amount에 "도달한 레벨"이 담겨 온다 — 포인트 알림의 amount(포인트 액수)와 의미가 다르다.
export type NotificationType = 'COMMENT' | 'REPLY' | 'LIKE' | 'CONTENT_REMOVED' | 'POINT_STOLEN' | 'POINT_WON' | 'POST_REWARD' | 'COMMENT_REWARD' | 'LEVEL_UP';

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
  // 타입별로 의미가 다르다(백엔드 NotificationResponse.amount 주석과 동일):
  //  POINT_STOLEN/POINT_WON/POST_REWARD/COMMENT_REWARD → 오간 포인트 액수
  //  LEVEL_UP                                          → 도달한 레벨
  //  그 외 타입                                         → null
  amount: number | null;
}

// 본인의 정지 현황 (백엔드 SuspensionStatusResponse와 1:1, GET /api/users/me/suspension).
// suspended가 false면 suspendedUntil은 의미 없다(null).
// suspended=true인데 suspendedUntil이 null이면 ROOT가 건 무기한 정지다.
export interface SuspensionStatus {
  suspended: boolean;
  suspendedUntil: string | null;
}