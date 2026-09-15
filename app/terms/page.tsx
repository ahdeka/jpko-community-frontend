import type { Metadata } from 'next'
import LegalDoc, { Section } from '@/components/legal/LegalDoc'

export const metadata: Metadata = { title: '이용약관' }

export default function TermsPage() {
  return (
    <LegalDoc active="terms" effectiveDate="2026년 9월 22일">
      <Section heading="제1조 (목적)">
        <p>본 약관은 JPKO Community(이하 &ldquo;서비스&rdquo;)를 이용하는 데 필요한 조건과 서비스·이용자의 권리와 책임을 정합니다.</p>
      </Section>

      <Section heading="제2조 (가입과 계정)">
        <p>
          만 14세 미만은 가입할 수 없습니다. 계정은 본인이 관리해야 하며, 다른 사람에게 넘기거나 빌려주거나 팔 수 없습니다.
        </p>
      </Section>

      <Section heading="제3조 (금지 행위)">
        <ul className="list-disc space-y-1 pl-5">
          <li>도배, 스팸, 홍보성 광고</li>
          <li>음란·폭력·혐오 등 불쾌감을 주는 게시물</li>
          <li>저작권·초상권·명예 등 다른 사람의 권리 침해</li>
          <li>허위 사실 유포, 사칭, 다른 사람의 개인정보 게시</li>
          <li>매크로·버그 악용·다중 계정 등 비정상적인 이용</li>
          <li>포인트를 현금이나 물건과 거래하는 행위</li>
        </ul>
      </Section>

      <Section heading="제4조 (게시물)">
        <p>
          게시물의 저작권과 책임은 작성자에게 있습니다. 서비스는 게시물을 사이트에 보여주기 위해 필요한 범위에서
          저장·전송하고, 이미지 압축처럼 형식을 바꿀 수 있습니다.
        </p>
        <p>
          탈퇴해도 작성한 글·댓글은 삭제되지 않습니다. 제3조를 어긴 게시물은 알리지 않고 삭제하거나 숨길 수 있습니다.
        </p>
      </Section>

      <Section heading="제5조 (이용 제한)">
        <p>약관을 어기면 위반 정도에 따라 게시물 삭제, 기간 정지, 영구 정지 조치를 할 수 있습니다.</p>
      </Section>

      <Section heading="제6조 (포인트와 게임)">
        <p>
          포인트는 사이트 안에서만 쓰는 점수로, 현금 가치가 없고 환전·환불·양도할 수 없습니다.
          룰렛 등 게임은 포인트로만 즐기는 기능이며 확률은 사이트에 공개합니다.
        </p>
        <p>부정한 방법으로 얻은 포인트는 회수할 수 있고, 탈퇴하면 남은 포인트는 사라집니다.</p>
      </Section>

      <Section heading="제7조 (광고)">
        <p>서비스는 사이트에 광고를 게재할 수 있습니다. 광고를 통해 이루어진 거래는 해당 광고주와 이용자 사이의 일입니다.</p>
      </Section>

      <Section heading="제8조 (서비스 변경과 책임)">
        <p>
          서비스는 운영상 필요에 따라 기능을 바꾸거나 중단할 수 있으며, 중요한 변경은 미리 공지합니다.
          서비스는 무료로 제공되며, 천재지변이나 이용자 과실 등 서비스가 통제할 수 없는 사유로 생긴 손해는 책임지지 않습니다.
        </p>
      </Section>

      <Section heading="제9조 (약관 변경과 준거법)">
        <p>
          약관을 바꿀 때는 시행 7일 전(이용자에게 불리한 변경은 30일 전)에 공지합니다.
          바뀐 약관에 동의하지 않으면 탈퇴할 수 있습니다. 본 약관은 대한민국 법에 따릅니다.
        </p>
      </Section>
    </LegalDoc>
  )
}
