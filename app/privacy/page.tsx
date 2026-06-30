import type { Metadata } from 'next'
import LegalDoc, { Section, Label, Callout } from '@/components/legal/LegalDoc'
import { CONTACT_EMAIL } from '@/lib/site'

export const metadata: Metadata = { title: '개인정보처리방침' }

export default function PrivacyPage() {
  return (
    <LegalDoc active="privacy" effectiveDate="2026년 6월 29일">
      <Section heading="수집하는 개인정보">
        <ul className="list-disc space-y-1 pl-5">
          <li><Label>회원가입 시</Label>: 이메일, 비밀번호(암호화 저장), 닉네임</li>
          <li><Label>서비스 이용 중 자동 수집</Label>: IP 주소, 쿠키 및 인증 토큰</li>
          <li><Label>게시물 작성 시</Label>: 작성한 글·댓글·이미지. 익명 글의 경우 IP 일부를 마스킹하여 표시</li>
        </ul>
      </Section>

      <Section heading="수집 및 이용 목적">
        <ul className="list-disc space-y-1 pl-5">
          <li>회원 식별 및 로그인·인증 유지</li>
          <li>커뮤니티 서비스 제공 및 게시물 관리</li>
          <li>도배·스팸 등 부정 이용 방지</li>
        </ul>
      </Section>

      <Section heading="보유 및 이용 기간">
        <p>회원 탈퇴 시 즉시 폐기합니다. 단, 부정 이용 방지를 위한 접속 기록(IP 등)은 최대 6개월간 보관합니다.</p>
      </Section>

      <Section heading="처리 위탁">
        <ul className="list-disc space-y-1 pl-5">
          <li><Label>Amazon Web Services(AWS)</Label>: 이미지 저장 및 전송(S3·CloudFront)</li>
          <li><Label>Vercel</Label>: 서비스 호스팅 및 성능 분석</li>
        </ul>
      </Section>

      <Section heading="쿠키 사용">
        <p>
          로그인 상태 유지를 위해 인증 토큰을 담은 쿠키를 사용합니다.
          브라우저 설정으로 거부할 수 있으나, 이 경우 로그인 기능이 제한됩니다.
        </p>
      </Section>

      <Section heading="이용자 권리">
        <p>이용자는 언제든지 개인정보를 조회·수정하거나, 회원 탈퇴를 통해 삭제를 요청할 수 있습니다.</p>
      </Section>

      <Section heading="개인정보 보호책임자">
        <Callout>
          책임자: Dam &nbsp;·&nbsp; 문의:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline dark:text-blue-400">
            {CONTACT_EMAIL}
          </a>
        </Callout>
      </Section>
    </LegalDoc>
  )
}
