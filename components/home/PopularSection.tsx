import SectionCard from '@/components/common/SectionCard'
import RankedPostList from '@/components/common/RankedPostList'
import type { PostSummary } from '@/types'

interface Props {
  title: string
  bulletColor: string
  posts: PostSummary[]
}

// 메인 사이드바의 인기글 카드(오늘/주간 공용). 데이터는 받아서 그리기만 한다.
//  - 조회를 page.tsx로 올린 이유: 섹션마다 await하면 오늘/주간 요청이 순차 워터폴이 된다.
//    메인은 revalidate = 0(매 요청 동적 렌더)이라 그 지연이 그대로 사용자 대기시간이 되므로
//    page.tsx의 Promise.all에 묶어 병렬로 받는다.
//  - posts가 비면 RankedPostList가 "게시글 없음" 문구를 그린다. 특히 TODAY는 자정 직후
//    후보 글이 없어 정상적으로 빈 목록이 되므로, 카드를 숨기지 않고 문구를 보여준다
//    (시간대에 따라 사이드바 구성이 바뀌면 레이아웃이 들쭉날쭉해진다).
export default function PopularSection({ title, bulletColor, posts }: Props) {
  return (
    <SectionCard title={title} bulletColor={bulletColor}>
      <RankedPostList posts={posts} />
    </SectionCard>
  )
}
