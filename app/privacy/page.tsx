import type { Metadata } from 'next'
import LegalLayout, { LegalSection } from '@/components/legal/LegalLayout'
import { SITE_NAME, CONTACT_EMAIL } from '@/lib/site'

export const metadata: Metadata = { title: '개인정보처리방침' }

export default function PrivacyPage() {
  return (
    <LegalLayout title="개인정보처리방침" effectiveDate="2026-06-29">
      <p>
        {SITE_NAME}(이하 &ldquo;서비스&rdquo;)는 이용자의 개인정보를 중요하게 생각하며, 관련 법령에 따라
        아래와 같이 개인정보를 수집·이용·보호합니다.
      </p>

      <LegalSection heading="1. 수집하는 개인정보 항목">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>회원가입 시</strong>: 이메일, 비밀번호(암호화하여 저장), 닉네임</li>
          <li><strong>서비스 이용 과정에서 자동 수집</strong>: IP 주소, 기기정보(User-Agent), 쿠키 및 접속 토큰</li>
          <li><strong>게시물 작성 시</strong>: 작성한 글·댓글·이미지. 익명 글의 경우 IP 일부를 마스킹하여 표시</li>
        </ul>
      </LegalSection>

      <LegalSection heading="2. 개인정보의 수집 및 이용 목적">
        <ul className="list-disc space-y-1 pl-5">
          <li>회원 식별 및 로그인·인증 유지</li>
          <li>커뮤니티 서비스 제공 및 게시물 작성·관리</li>
          <li>부정 이용 방지, 도배·스팸 등 악용 차단 및 보안</li>
          <li>문의 응대 및 공지 전달</li>
        </ul>
      </LegalSection>

      <LegalSection heading="3. 개인정보의 보유 및 이용 기간">
        <p>
          원칙적으로 회원 탈퇴 시 지체 없이 파기합니다. 다만 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안
          보관하며, 부정 이용 방지를 위해 일부 접속 기록(IP 등)은 일정 기간 보관할 수 있습니다.
          <span className="text-neutral-400 dark:text-neutral-500"> (구체적 보유기간은 운영 정책에 맞게 확정 필요)</span>
        </p>
      </LegalSection>

      <LegalSection heading="4. 개인정보의 제3자 제공 및 처리위탁">
        <p>서비스는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않으며, 서비스 운영을 위해 아래와 같이 처리를 위탁합니다.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Amazon Web Services(AWS)</strong>: 업로드 이미지의 저장 및 전송(S3·CloudFront)</li>
          <li><strong>Vercel</strong>: 서비스 호스팅 및 이용 통계·성능 분석</li>
        </ul>
      </LegalSection>

      <LegalSection heading="5. 쿠키의 사용">
        <p>
          서비스는 로그인 상태 유지를 위해 인증 토큰을 담은 쿠키를 사용합니다. 이용자는 브라우저 설정을 통해
          쿠키 저장을 거부할 수 있으나, 이 경우 로그인 등 일부 기능 이용이 제한될 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection heading="6. 이용자의 권리와 행사 방법">
        <p>
          이용자는 언제든지 자신의 개인정보를 조회·수정하거나 회원 탈퇴(가입 해지)를 통해 개인정보 삭제를 요청할 수 있습니다.
          개인정보 관련 문의는 아래 연락처로 요청할 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection heading="7. 개인정보 보호책임자 및 문의처">
        <ul className="list-disc space-y-1 pl-5">
          <li>문의: <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline dark:text-blue-400">{CONTACT_EMAIL}</a></li>
          <li className="text-neutral-400 dark:text-neutral-500">(개인정보 보호책임자 성명·직책 등은 운영 정보로 보완 필요)</li>
        </ul>
      </LegalSection>

      <LegalSection heading="부칙">
        <p>본 방침은 2026년 6월 29일부터 시행합니다.</p>
      </LegalSection>
    </LegalLayout>
  )
}
