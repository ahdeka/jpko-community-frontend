import type { Metadata } from 'next'
import LegalDoc, { Section } from '@/components/legal/LegalDoc'

export const metadata: Metadata = { title: '이용약관' }

export default function TermsPage() {
  return (
    <LegalDoc active="terms" effectiveDate="2026년 6월 29일">
      <Section heading="제1조 (목적)">
        <p>본 약관은 JPKO Community(이하 &ldquo;서비스&rdquo;)의 이용자 간의 권리·의무 및 책임사항을 규정합니다.</p>
      </Section>

      <Section heading="제2조 (이용자 의무)">
        <p>이용자는 다음 행위를 해서는 안 됩니다.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>도배, 스팸, 광고 등 서비스 운영을 방해하는 행위</li>
          <li>음란·폭력·혐오 등 타인에게 불쾌감을 주는 콘텐츠 게시</li>
          <li>타인의 저작권·명예 등 권리를 침해하는 행위</li>
          <li>허위 정보 유포, 타인 사칭, 개인정보 무단 수집</li>
          <li>시스템에 부정 접근하거나 서비스 운영을 방해하는 행위</li>
        </ul>
      </Section>

      <Section heading="제3조 (게시물)">
        <p>
          게시물의 저작권은 작성자에게 있으며, 작성자가 게시에 대한 책임을 부담합니다.
          서비스는 제2조를 위반하는 게시물을 사전 통지 없이 삭제·비공개 처리할 수 있습니다.
        </p>
      </Section>

      <Section heading="제4조 (서비스 변경 및 중단)">
        <p>서비스는 운영상 필요에 따라 서비스를 변경·중단할 수 있으며, 중대한 변경 시 사전에 공지합니다.</p>
      </Section>

      <Section heading="제5조 (책임의 한계)">
        <p>
          서비스는 천재지변, 이용자의 귀책사유, 제3자의 행위 등 통제 범위를 벗어난 사유로 인한 손해에 대해
          책임을 지지 않습니다.
        </p>
      </Section>

      <Section heading="제6조 (준거법)">
        <p>본 약관은 대한민국 법령에 따라 해석됩니다.</p>
      </Section>
    </LegalDoc>
  )
}
