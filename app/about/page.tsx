import type { Metadata } from 'next'
import Link from 'next/link'
import InfoDoc from '@/components/legal/InfoDoc'
import { Section, Callout } from '@/components/legal/LegalDoc'
import { SITE_NAME, SITE_DESCRIPTION, CONTACT_EMAIL } from '@/lib/site'

export const metadata: Metadata = {
  title: '사이트 소개',
  description: `${SITE_NAME} — ${SITE_DESCRIPTION}`,
}

// 카테고리 소개. 실제 게시판 구성과 맞춰둔 정적 목록이다.
// 백엔드에서 받아오지 않는 이유: 설명 문구는 DB에 없고, 이 페이지는 "무엇을 다루는 곳인지"를
// 사람 말로 풀어주는 자리라 카테고리가 추가돼도 문구를 손으로 쓰는 편이 낫다.
const TOPICS = [
  { name: '취업', desc: '일본 취업 준비, 이직, 면접과 서류, 비자 스폰서' },
  { name: '워킹홀리데이', desc: '워홀 비자 신청, 출국 준비, 현지 아르바이트' },
  { name: '유학', desc: '어학원과 전문학교, 대학 진학, 학비와 장학금' },
  { name: '일본생활', desc: '집 구하기, 행정 절차, 병원과 보험, 생활비' },
  { name: '여행', desc: '지역별 여행기, 맛집, 교통 패스' },
  { name: '자유게시판', desc: '주제를 가리지 않는 잡담과 근황' },
]

export default function AboutPage() {
  return (
    <InfoDoc title={`${SITE_NAME} 소개`} lead={SITE_DESCRIPTION}>
      <Section heading="어떤 곳인가요">
        <p>
          {SITE_NAME}는 일본에 살고 있거나 일본행을 준비하는 한국인들이 정보와 경험을 나누는
          커뮤니티입니다. 취업·유학·워킹홀리데이처럼 준비 과정이 복잡한 주제일수록 먼저 겪은
          사람의 이야기가 가장 정확한 자료가 된다는 생각에서 출발했습니다.
        </p>
        <p>
          글은 누구나 읽을 수 있고, 가입하면 글과 댓글을 쓸 수 있습니다. 가입은 이메일 인증을
          거치며, 만 14세 이상만 이용할 수 있습니다.
        </p>
      </Section>

      <Section heading="다루는 주제">
        <ul className="list-disc space-y-1 pl-5">
          {TOPICS.map(topic => (
            <li key={topic.name}>
              <strong className="font-medium text-neutral-800 dark:text-neutral-100">{topic.name}</strong>
              {' — '}
              {topic.desc}
            </li>
          ))}
        </ul>
      </Section>

      <Section heading="운영 원칙">
        <p>
          게시물의 저작권과 책임은 작성자에게 있습니다. 운영진은 도배·스팸·홍보, 비방과 혐오 표현,
          다른 사람의 개인정보를 올리는 글에 대해 삭제나 이용 제한 조치를 합니다. 자세한 기준은{' '}
          <Link href="/terms" className="text-blue-600 hover:underline dark:text-blue-400">이용약관</Link>
          에 정리해두었습니다.
        </p>
        <p>
          문제가 되는 글과 댓글은 각 게시물의 신고 기능으로 알려주시면 운영진이 확인합니다.
          수집하는 개인정보와 보관 기간은{' '}
          <Link href="/privacy" className="text-blue-600 hover:underline dark:text-blue-400">개인정보처리방침</Link>
          에서 확인하실 수 있습니다.
        </p>
      </Section>

      <Section heading="포인트">
        <p>
          글쓰기와 댓글 등 활동에 따라 포인트가 쌓이고, 게임센터에서 사용할 수 있습니다. 포인트는
          사이트 안에서만 쓰이는 숫자이며 현금이나 물건으로 바꿀 수 없고, 이용자끼리 거래할 수도
          없습니다.
        </p>
      </Section>

      <Section heading="문의">
        <Callout>
          서비스 이용 문의, 게시물 관련 요청은{' '}
          <Link href="/contact" className="text-blue-600 hover:underline dark:text-blue-400">문의 안내</Link>
          를 참고해주세요. 이메일:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline dark:text-blue-400">
            {CONTACT_EMAIL}
          </a>
        </Callout>
      </Section>
    </InfoDoc>
  )
}
