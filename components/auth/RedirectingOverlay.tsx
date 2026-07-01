// 로그인/회원가입 후(또는 이미 로그인한 상태로 진입 시) 리다이렉트가 진행되는 동안
// 잠깐 보여주는 전체 화면 로딩 오버레이.
//
// 왜 카드 안 텍스트가 아니라 fixed 오버레이인가?
//  - 폼은 max-w-sm 카드 안에 있어, 그 자리에 "이동 중…" 텍스트를 넣으면 좁은 카드에
//    문구만 덩그러니 남아 어색했다.
//  - position: fixed + inset-0 는 카드 박스를 벗어나 뷰포트 전체를 덮으므로,
//    "카드 내부 메시지"가 아니라 자연스러운 페이지 전환처럼 읽힌다.
//  - 배경은 앱의 최상위 배경(body)과 동일하게 맞춰, 헤더/카드가 비쳐 보이지 않게 한다.
export default function RedirectingOverlay() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-100 dark:bg-neutral-950"
      role="status"
      aria-label="이동 중"
    >
      {/* 시각적으로는 스피너만 보이고, 스크린리더에는 안내 문구를 전달한다 */}
      <span className="sr-only">이동 중…</span>
      <svg
        className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    </div>
  )
}
