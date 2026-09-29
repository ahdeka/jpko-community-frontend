import type { Metadata } from 'next'
import LegalDoc, { Section, Label, Callout } from '@/components/legal/LegalDoc'
import { CONTACT_EMAIL } from '@/lib/site'

export const metadata: Metadata = { title: '개인정보처리방침' }

const linkClass = 'text-blue-600 hover:underline dark:text-blue-400'

export default function PrivacyPage() {
  return (
    <LegalDoc active="privacy" effectiveDate="2026년 9월 22일">
      <Section heading="수집하는 정보">
        <ul className="list-disc space-y-1 pl-5">
          <li><Label>회원가입 시</Label>: 이메일, 아이디, 비밀번호(암호화 저장), 닉네임</li>
          <li><Label>이용 중 자동 수집</Label>: IP 주소, 쿠키, 브라우저·기기 정보, 이용 기록(글·댓글·출석·포인트 등)</li>
          <li><Label>글 작성 시</Label>: 작성한 글·댓글·이미지. 익명 글은 IP 일부만 표시합니다.</li>
        </ul>
      </Section>

      <Section heading="이용 목적">
        <ul className="list-disc space-y-1 pl-5">
          <li>회원 관리, 로그인, 이메일 인증과 아이디·비밀번호 찾기</li>
          <li>커뮤니티 운영과 게시물 관리</li>
          <li>도배·스팸·자동 가입 방지</li>
          <li>방문 통계, 성능 개선, 광고 게재</li>
        </ul>
      </Section>

      <Section heading="보관 기간">
        <ul className="list-disc space-y-1 pl-5">
          <li>탈퇴하면 이메일과 닉네임은 바로 알아볼 수 없는 값으로 바꿉니다. 아이디는 다른 사람이 같은 아이디로 가입해 사칭하는 일을 막기 위해 남겨 둡니다.</li>
          <li>글·댓글 작성 시 기록한 IP는 6개월, 알림은 30일이 지나면 삭제합니다.</li>
          <li>탈퇴해도 작성한 글·댓글은 남고 작성자는 &ldquo;탈퇴회원&rdquo;으로 표시됩니다. 지우고 싶은 글은 탈퇴 전에 직접 삭제해 주세요.</li>
        </ul>
      </Section>

      <Section heading="위탁 업체">
        <ul className="list-disc space-y-1 pl-5">
          <li><Label>Amazon Web Services</Label>: 서버·DB 운영, 이미지 저장, 인증 메일 발송</li>
          <li><Label>Vercel (미국)</Label>: 웹 호스팅, 방문 통계와 성능 측정</li>
          <li><Label>Cloudflare (미국)</Label>: 로그인·가입·아이디/비밀번호 찾기 시 자동화 프로그램 차단(Turnstile)</li>
        </ul>
        <p>
          Vercel과 Cloudflare는 해외 업체라 사이트를 이용하는 동안 IP와 브라우저 정보가 해당 업체 서버로 전송됩니다.
          원하지 않으면 가입하지 않거나 탈퇴할 수 있지만, 이 경우 서비스를 이용할 수 없습니다.
        </p>
      </Section>

      <Section heading="쿠키와 광고">
        <p>로그인 상태를 유지하기 위해 쿠키를 사용합니다.</p>
        <p>
          사이트에는 Google 광고가 게재됩니다. Google 등 광고 업체는 쿠키를 이용해 이 사이트와 다른 사이트의 방문 기록을 바탕으로
          광고를 보여줄 수 있습니다. 맞춤 광고는{' '}
          <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className={linkClass}>Google 광고 설정</a>
          에서 끌 수 있습니다.
        </p>
        <p>브라우저 설정으로 쿠키를 거부할 수 있지만, 이 경우 로그인을 할 수 없습니다.</p>
      </Section>

      <Section heading="안전 조치">
        <p>
          비밀번호는 되돌릴 수 없는 방식으로 암호화해 저장하고, 모든 통신은 HTTPS로 암호화합니다.
          관리자 기능은 권한이 있는 운영자만 쓸 수 있습니다.
        </p>
      </Section>

      <Section heading="이용자 권리">
        <p>
          마이페이지에서 언제든 정보를 확인·수정하거나 탈퇴할 수 있습니다. 그 밖의 열람·정정·삭제 요청은 아래 메일로 보내 주세요.
          만 14세 미만은 가입할 수 없습니다.
        </p>
      </Section>

      <Section heading="개인정보 보호책임자">
        <Callout>
          책임자: Dam &nbsp;·&nbsp; 문의:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
            {CONTACT_EMAIL}
          </a>
        </Callout>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          개인정보 침해 신고·상담: 개인정보침해신고센터(118), 개인정보분쟁조정위원회(1833-6972), 대검찰청(1301), 경찰청(182)
        </p>
      </Section>

      <Section heading="변경">
        <p>이 방침을 바꿀 때는 시행 7일 전에 공지사항으로 알립니다.</p>
      </Section>
    </LegalDoc>
  )
}
