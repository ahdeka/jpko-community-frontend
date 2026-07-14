// 운영진(ADMIN) 작성자 표시 뱃지 — 닉네임 옆에 왕관 + "운영진".
//
// 목적은 '진위 신뢰'다: 닉네임만으로는 진짜 운영진인지 알 수 없으므로, 백엔드가
// 작성자 role을 근거로 내려주는 adminAuthor(true)일 때만 이 뱃지를 붙인다. 닉네임
// 문자열 매칭이 아니라 서버 role 기반이라 사칭이 불가능하다.
//
// 운영진은 소수라 목록에 도배될 일이 없고, 텍스트("운영진")를 함께 넣어 왕관만으로
// '상위 유저' 등으로 오해되지 않게 한다. title로도 노출해 접근성을 보완한다.
export default function AdminBadge({ className = '' }: { className?: string }) {
  return (
    <span
      title="운영진"
      className={`inline-flex shrink-0 items-center gap-0.5 rounded bg-amber-500 px-1 py-px text-[10px] font-bold leading-none text-white dark:bg-amber-500 ${className}`}
    >
      {/* 왕관 아이콘 (3봉우리 + 받침). 작은 크기라 단순한 채움 형태로 그린다. */}
      <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="currentColor" aria-hidden="true">
        <path d="M5 16 3 5l5.5 4L12 4l3.5 5L19 5l-2 11H5Zm0 2h14v2H5v-2Z" />
      </svg>
      운영진
    </span>
  )
}
