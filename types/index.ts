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