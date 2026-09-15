// min-h-screen은 "상세로 이동 시 맨 위로 스크롤" 보장용이다(장식 아님, 지우지 말 것).
// Next는 이 스켈레톤이 뜬 순간 스크롤 여부를 판단하는데, "새 페이지 상단이 이미 화면 안에 보이면
// 스크롤하지 않는다"(Link scroll 문서화된 동작). 스켈레톤이 짧으면 문서가 화면 높이 근처로 줄면서
// 브라우저가 스크롤을 몇 px로 끌어내려 스켈레톤 상단이 "보이는" 상태가 되고 → Next가 스크롤을 건너뛴다.
// 이후 본문이 들어오면 Chrome/Edge의 scroll anchoring이 이전 위치로 되돌려, 하단에서 누른 글이
// 중간부터 보이게 된다. 화면 높이가 스켈레톤 문서 높이(~720px)와 비슷한 데스크탑(배율 125% 등)에서만 재현.
// 스켈레톤을 최소 한 화면 높이로 두면 스크롤이 헤더 높이 이상 남아 상단이 화면 밖이 되므로,
// Next가 항상 scrollTop=0을 직접 수행한다. 목록 스켈레톤(posts/loading 등)도 같은 이유로 동일 적용.
export default function Loading() {
  return (
    <div className="min-h-screen animate-pulse">
      <div className="border-b border-gray-200 dark:border-neutral-800 pb-4 mb-4">
        <div className="h-3 w-16 rounded bg-neutral-200 dark:bg-neutral-700 mb-2" />
        <div className="h-6 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700 mb-3" />
        <div className="flex items-center gap-3">
          <div className="h-3 w-12 rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-3 w-16 rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-3 w-12 rounded bg-neutral-200 dark:bg-neutral-700" />
        </div>
      </div>

      <div className="min-h-40 py-6 space-y-2">
        <div className="h-4 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-4 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-4 w-2/3 rounded bg-neutral-200 dark:bg-neutral-700" />
      </div>

      <div className="mt-8">
        <div className="h-5 w-24 rounded bg-neutral-200 dark:bg-neutral-700 mb-4" />
        <div className="h-16 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
      </div>
    </div>
  )
}
