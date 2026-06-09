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

// 유저
export interface User {
  nickname: string;
  role: 'USER' | 'ADMIN';
}

// 카테고리
export interface Category {
  id: number;
  name: string;
  slug: string;
  displayOrder: number;
}

// 태그
export interface Tag {
  id: number;
  name: string;
  fixed: boolean;
}

// 게시글 목록용
export interface PostSummary {
  id: number;
  categoryName: string;
  title: string;
  author: string;
  anonymous: boolean;
  viewCount: number;
  tags: Tag[];
  createdAt: string;
}

// 게시글 작성/수정 응답용
export interface PostResponse {
  id: number
}

// 게시글 상세용
export interface PostDetail extends PostSummary {
  content: string;
  likeCount: number;
  dislikeCount: number;
}

// 댓글
export interface Comment {
  id: number;
  author: string;
  anonymous: boolean;
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