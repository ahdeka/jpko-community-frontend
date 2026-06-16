// 홈 화면 위젯용 임시 데이터
// TODO: 백엔드 API 준비되면 실제 fetch 호출로 교체
import type { Notice, PopularTag } from '@/types'

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
