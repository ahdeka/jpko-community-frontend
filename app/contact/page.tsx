import type { Metadata } from 'next'
import Link from 'next/link'
import InfoDoc from '@/components/legal/InfoDoc'
import { Section, Callout } from '@/components/legal/LegalDoc'
import { SITE_NAME, CONTACT_EMAIL } from '@/lib/site'

export const metadata: Metadata = {
  title: '문의',
  description: `${SITE_NAME} 문의 안내 — 서비스 이용, 게시물 신고·삭제, 개인정보 관련 문의를 받는 경로입니다.`,
}

export default function ContactPage() {
  return (
    <InfoDoc
      title="문의"
      lead="아래 이메일로 연락 주시면 운영진이 확인 후 회신드립니다."
    >
      <Section heading="이메일">
        <Callout>
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline dark:text-blue-400">
            {CONTACT_EMAIL}
          </a>
        </Callout>
        <p>
          운영진이 한 명씩 직접 확인하므로 회신까지 시간이 걸릴 수 있습니다. 같은 내용을 여러 번
          보내시면 오히려 확인이 늦어질 수 있으니 한 번만 보내주세요.
        </p>
      </Section>

      <Section heading="게시물 신고는 사이트 안에서">
        <p>
          특정 글이나 댓글이 문제가 되는 경우에는 이메일보다 해당 게시물의 <strong className="font-medium text-neutral-800 dark:text-neutral-100">신고</strong> 버튼이
          빠릅니다. 어떤 글인지 자동으로 함께 전달되어 운영진이 바로 확인할 수 있습니다.
        </p>
        <p>
          본인이 쓴 글의 삭제는 게시물 화면에서 직접 하실 수 있습니다. 계정을 잃어버려 직접 지울 수
          없는 경우에만 이메일로 문의해주세요.
        </p>
      </Section>

      <Section heading="이런 내용을 보내주세요">
        <ul className="list-disc space-y-1 pl-5">
          <li>서비스 이용 중 생긴 오류 — 어떤 화면에서 무엇을 하다가 생겼는지</li>
          <li>계정 문제 — 로그인, 이메일 인증, 비밀번호 재설정</li>
          <li>권리 침해 신고 — 저작권, 초상권, 명예훼손, 개인정보 노출</li>
          <li>개인정보 열람·정정·삭제 요청</li>
          <li>제휴 및 광고 제안</li>
        </ul>
        <p>
          권리 침해로 인한 삭제 요청은 해당 게시물의 주소(URL)와 어떤 권리가 침해되었는지를 함께
          적어주시면 확인이 빠릅니다.
        </p>
      </Section>

      <Section heading="개인정보 관련 문의">
        <p>
          수집 항목과 보관 기간, 처리 방침은{' '}
          <Link href="/privacy" className="text-blue-600 hover:underline dark:text-blue-400">개인정보처리방침</Link>
          에 정리되어 있습니다. 열람·정정·삭제 요청도 위 이메일로 받습니다.
        </p>
      </Section>
    </InfoDoc>
  )
}
