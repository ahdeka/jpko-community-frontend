'use client'

// 라이트 ↔ 다크 색상 테마 토글 버튼.
//
// React state(useState/useEffect)를 쓰지 않는 이유:
//  - 현재 테마는 이미 <html data-theme="...">에 들어 있다. 그 초기값은 app/layout.tsx의
//    인라인 스크립트가 "첫 페인트 전에" 심으므로 화면 깜빡임(FOUC)이 없다.
//  - 어떤 아이콘을 보여줄지는 Tailwind의 dark: 변형(=data-theme 기반)으로 CSS가 정한다.
//    즉 표시 상태를 JS로 계산하지 않으니 서버 렌더 결과와 클라이언트가 항상 일치해
//    하이드레이션 경고가 없고, 프로젝트의 엄격한 set-state-in-effect 린트에도 걸리지 않는다.
export default function ThemeToggle() {
  // 클릭 시점에 DOM의 현재 테마를 읽어 반대로 뒤집고 localStorage에 저장한다.
  // (다음 방문 때 layout의 인라인 스크립트가 이 값을 다시 읽어 복원한다.)
  function toggleTheme() {
    const root = document.documentElement
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
    root.setAttribute('data-theme', next)
    // 시크릿 모드·저장소 차단 환경에선 localStorage 접근이 예외를 던질 수 있어 방어한다.
    // (저장에 실패해도 이번 세션의 화면 전환 자체는 위에서 이미 적용됐다.)
    try {
      localStorage.setItem('theme', next)
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="색상 테마 전환"
      title="색상 테마 전환 (라이트/다크)"
      // 게시글 메인 영역 우측 하단 모서리에 걸치도록 푸터 기준 절대배치.
      // right-4는 메인 카드의 오른쪽 끝(컨테이너 px-4)과 정렬되고,
      // -top-5는 메인 카드 아래 여백으로 살짝 올라가 "본문 우측 하단"에 붙은 느낌을 준다.
      className="absolute -top-5 right-4 flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 shadow-sm transition-colors hover:bg-neutral-100 hover:text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
    >
      {/* 라이트 모드에서 보이는 해 아이콘 (다크에서는 CSS로 숨김) */}
      <svg
        className="h-5 w-5 dark:hidden"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
      {/* 다크 모드에서 보이는 달 아이콘 (라이트에서는 CSS로 숨김) */}
      <svg
        className="hidden h-5 w-5 dark:block"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  )
}
