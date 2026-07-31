// 최고 관리자(ROOT) 작성자 표시 뱃지 — 닉네임 옆에 왕관 + "운영자".
//
// AdminBadge("운영진", amber)와 같은 목적(서버 role 기반 신뢰 표시)이되, 운영진 중에서도
// ROOT를 시각적으로 구분하기 위해 라벨("운영자")과 색(violet)을 다르게 준다.
// 백엔드가 작성자 role을 근거로 내려주는 rootAuthor(true)일 때만 붙으며, 닉네임 문자열
// 매칭이 아니라 서버 값 기반이라 사칭이 불가능하다.
//
// ROOT는 통상 1명이라 목록에 도배될 일이 없고, 텍스트("운영자")를 함께 넣어 왕관만으로
// 오해되지 않게 한다. title로도 노출해 접근성을 보완한다.
export default function RootBadge({ className = '' }: { className?: string }) {
  return (
    <span
      title="운영자"
      // 보라→자홍 그라데이션 + 은은한 보라 그림자 + 안쪽 흰색 링으로 '고급진' 광택을 준다.
      // AdminBadge(단색 amber)보다 한 단계 위라는 위계를 색·질감으로 드러낸다.
      className={`inline-flex shrink-0 items-center gap-0.5 rounded bg-gradient-to-r from-violet-600 to-fuchsia-600 px-1 py-px text-[10px] font-bold leading-none text-white shadow-sm shadow-violet-500/40 ring-1 ring-inset ring-white/20 dark:from-violet-500 dark:to-fuchsia-500 ${className}`}
    >
      {/* 왕관 아이콘 (3봉우리 + 받침). AdminBadge와 동일 형태로 그려 계열감을 유지한다. */}
      <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="currentColor" aria-hidden="true">
        <path d="M5 16 3 5l5.5 4L12 4l3.5 5L19 5l-2 11H5Zm0 2h14v2H5v-2Z" />
      </svg>
      운영자
    </span>
  )
}
