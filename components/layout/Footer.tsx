import Link from 'next/link'
import { SITE_NAME, CONTACT_EMAIL } from '@/lib/site'
import ThemeToggle from './ThemeToggle'

// 전 페이지 하단 공통 footer. 법적 링크(이용약관·개인정보처리방침)와
// 저작권·문의처를 담는다. (정적이라 서버 컴포넌트)
export default function Footer() {
  const year = new Date().getFullYear()

  return (
    // 배경/테두리 없이 본문 뒤 배경색(body)에 녹이고, 위아래 여백을 키워 본문과 떨어진 느낌을 준다.
    // relative: 우측 하단에 절대배치되는 테마 토글 버튼의 기준점.
    <footer className="relative mx-auto w-full max-w-5xl px-4 pb-12 pt-10">
      {/* 색상 반전(라이트/다크) 토글. 위치는 본문 우측 하단이지만 DOM/영역상은 푸터에 속한다. */}
      <ThemeToggle />

      <nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs">
        <Link href="/terms" className="text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200">
          이용약관
        </Link>
        <span className="text-neutral-300 dark:text-neutral-700">|</span>
        <Link href="/privacy" className="font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100">
          개인정보처리방침
        </Link>
      </nav>

      <p className="mt-3 text-center text-xs text-neutral-500 dark:text-neutral-500">
        문의: <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-neutral-700 dark:hover:text-neutral-300">{CONTACT_EMAIL}</a>
      </p>
      <p className="mt-1 text-center text-xs text-neutral-400 dark:text-neutral-500">
        © {year} {SITE_NAME}. All rights reserved.
      </p>
    </footer>
  )
}
