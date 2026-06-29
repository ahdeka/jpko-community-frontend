import type { Metadata } from 'next'
import LegalLayout, { LegalSection } from '@/components/legal/LegalLayout'
import { SITE_NAME } from '@/lib/site'

export const metadata: Metadata = { title: '이용약관' }

export default function TermsPage() {
  return (
    <LegalLayout title="이용약관" effectiveDate="2026-06-29">
      <LegalSection heading="제1조 (목적)">
        <p>
          본 약관은 {SITE_NAME}(이하 &ldquo;서비스&rdquo;)가 제공하는 커뮤니티 서비스의 이용과 관련하여,
          서비스와 이용자 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
        </p>
      </LegalSection>

      <LegalSection heading="제2조 (정의)">
        <ul className="list-disc space-y-1 pl-5">
          <li>&ldquo;이용자&rdquo;란 본 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
          <li>&ldquo;회원&rdquo;이란 서비스에 가입하여 계정을 부여받은 이용자를 말합니다.</li>
          <li>&ldquo;게시물&rdquo;이란 이용자가 서비스에 게시한 글·댓글·이미지 등 일체의 콘텐츠를 말합니다.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="제3조 (약관의 효력 및 변경)">
        <p>
          본 약관은 서비스 화면에 게시함으로써 효력이 발생합니다. 서비스는 관련 법령을 위반하지 않는 범위에서
          약관을 변경할 수 있으며, 변경 시 적용일자와 변경 사유를 명시하여 사전에 공지합니다.
        </p>
      </LegalSection>

      <LegalSection heading="제4조 (회원가입 및 계정)">
        <ul className="list-disc space-y-1 pl-5">
          <li>회원가입은 이용자가 약관에 동의하고 가입 양식을 제출하면 성립합니다.</li>
          <li>이용자는 정확한 정보를 제공해야 하며, 타인의 정보를 도용해서는 안 됩니다.</li>
          <li>계정 관리 책임은 회원 본인에게 있으며, 계정의 부정 사용에 대한 책임은 회원이 부담합니다.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="제5조 (이용자의 의무 및 금지행위)">
        <p>이용자는 다음 각 호의 행위를 해서는 안 됩니다.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>도배, 스팸, 광고 등 서비스 운영을 방해하는 행위</li>
          <li>음란·폭력·혐오 등 불법적이거나 타인에게 불쾌감을 주는 콘텐츠 게시</li>
          <li>타인의 저작권·초상권·명예 등 권리를 침해하는 행위</li>
          <li>허위 정보 유포, 타인 사칭, 개인정보의 무단 수집·게시</li>
          <li>서비스의 정상적인 운영을 방해하거나 시스템에 부정 접근하는 행위</li>
        </ul>
      </LegalSection>

      <LegalSection heading="제6조 (게시물의 관리)">
        <ul className="list-disc space-y-1 pl-5">
          <li>게시물의 저작권은 작성자에게 있으며, 작성자는 게시에 대한 책임을 부담합니다.</li>
          <li>서비스는 제5조를 위반하거나 관련 법령에 위배되는 게시물을 사전 통지 없이 삭제·비공개 처리할 수 있습니다.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="제7조 (서비스의 변경 및 중단)">
        <p>
          서비스는 운영상·기술상 필요에 따라 제공하는 서비스의 전부 또는 일부를 변경·중단할 수 있으며,
          중대한 변경 시 사전에 공지합니다.
        </p>
      </LegalSection>

      <LegalSection heading="제8조 (책임의 한계)">
        <p>
          서비스는 천재지변, 이용자의 귀책사유, 제3자의 행위 등 서비스의 통제 범위를 벗어난 사유로 인한
          손해에 대하여 책임을 지지 않습니다. 이용자 간 또는 이용자와 제3자 간 분쟁에 대해서도 책임을 지지 않습니다.
        </p>
      </LegalSection>

      <LegalSection heading="제9조 (준거법 및 관할)">
        <p>본 약관은 대한민국 법령에 따라 해석되며, 분쟁 발생 시 관련 법령이 정한 절차에 따릅니다.</p>
      </LegalSection>

      <LegalSection heading="부칙">
        <p>본 약관은 2026년 6월 29일부터 시행합니다.</p>
      </LegalSection>
    </LegalLayout>
  )
}
