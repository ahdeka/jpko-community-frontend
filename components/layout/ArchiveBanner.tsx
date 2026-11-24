// 아카이브 안내 띠. 모든 페이지 본문 맨 위에 표시해, 들어온 사람이 지금 보는 곳이
// 운영 종료 후 보관 중인 읽기 전용 사이트라는 것을 먼저 알게 한다.
export default function ArchiveBanner() {
  return (
    <div className="mb-5 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
      <p className="font-semibold">JPKO Community는 2026년 11월 24일에 운영을 종료했습니다.</p>
      <p className="mt-1">
        이곳은 운영 기간에 쓰인 게시글과 댓글을 작성자 정보 없이 보관하는 읽기 전용 아카이브입니다.
        글쓰기·댓글·로그인은 더 이상 할 수 없으며, 회원 정보는 모두 파기했습니다.
        보관된 글에 대한 문의는{' '}
        <a href="mailto:jpkocommunity@gmail.com" className="underline">
          jpkocommunity@gmail.com
        </a>
        으로 보내 주세요.
      </p>
    </div>
  )
}
