// 홈 화면 위젯용 임시 데이터
// TODO: 백엔드 API 준비되면 실제 fetch 호출로 교체
import type { PopularPost, Notice, PopularTag } from '@/types'

export const MOCK_REALTIME_POPULAR_POSTS: PopularPost[] = [
  { id: 1, title: '도쿄 취업 비자 서류 준비 완전 정리 (2025 최신)' },
  { id: 2, title: '워홀 첫 달 생활비 실제로 얼마 썼나요' },
  { id: 3, title: '일본 편의점 알바 면접 팁 알려드림' },
  { id: 4, title: 'JLPT N2 독학 3개월 합격 후기' },
  { id: 5, title: '오사카 한달살기 동네 추천해주세요' },
  { id: 6, title: '일본 회사 야근 진짜 어떤가요 현실 공유' },
]

export const MOCK_WEEKLY_POPULAR_POSTS: PopularPost[] = [
  { id: 7, title: '일본 취업 현실적인 연봉 가이드' },
  { id: 8, title: '워홀 준비물 최종 체크리스트' },
  { id: 9, title: '도쿄 저렴하게 사는 법 A-Z' },
  { id: 10, title: 'JLPT N2 단기 합격 공부법' },
  { id: 11, title: '일본 은행 계좌 개설 완전 정리' },
]

export const MOCK_NOTICES: Notice[] = [
  { id: 1, title: '커뮤니티 이용 규칙 안내' },
  { id: 2, title: '익명 게시 정책 업데이트' },
  { id: 3, title: '서비스 오픈 안내' },
]

export const MOCK_POPULAR_TAGS: PopularTag[] = [
  { id: 1, label: '#도쿄취업' },
  { id: 2, label: '#워홀후기' },
  { id: 3, label: '#JLPT' },
  { id: 4, label: '#비자' },
  { id: 5, label: '#쉐어하우스' },
  { id: 6, label: '#오사카' },
  { id: 7, label: '#일본어학원' },
  { id: 8, label: '#면접팁' },
]
