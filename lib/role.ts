// lib/role.ts
// 유저 권한(role) 판별 헬퍼 — role 문자열을 여기저기서 직접 비교하지 않고 이 함수를 통한다.
// ROOT가 추가되면서 "운영진 여부"는 더 이상 role === 'ADMIN' 단일 비교로 표현되지 않기 때문에,
// 판별 규칙을 한곳에 모아 누락(ROOT를 빠뜨려 관리자 기능이 막히는 등)을 원천 차단한다.
import type { UserRole } from '@/types'

// 운영진 여부 — 관리자 페이지(회원/신고/공지) 접근권을 가진 role.
// ADMIN과 ROOT를 모두 포함한다. 백엔드도 대부분의 관리자 엔드포인트를
// @PreAuthorize("hasAnyRole('ADMIN', 'ROOT')")로 보호하므로 이 판별과 1:1로 대응한다.
export const isStaff = (role: UserRole): boolean => role === 'ADMIN' || role === 'ROOT'

// 최고 관리자(ROOT) 여부 — USER의 role을 USER↔ADMIN으로 바꾸는 등 ROOT 전용 기능의 게이트.
// 백엔드 role 변경 엔드포인트는 @PreAuthorize("hasRole('ROOT')")로 보호된다.
export const isRoot = (role: UserRole): boolean => role === 'ROOT'
