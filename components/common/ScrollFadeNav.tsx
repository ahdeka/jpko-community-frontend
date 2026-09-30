'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

// 가로 스크롤 탭/메뉴 공용 컨테이너 (헤더 카테고리 줄, 마이페이지 탭, 게임센터 탭, 관리자 메뉴).
//
// 해결하는 문제: 폰 폭에서 항목이 넘치면 마지막 항목이 "자|" "일본생"처럼 반쯤 잘린 채 멈춰,
// 스크롤된다는 사실을 모르고 "화면이 깨졌다"고 느끼게 된다.
//
// 동작:
// 1) 가장자리 페이드: 스크롤할 내용이 남아 있는 쪽 가장자리만 투명하게 흐려서 "더 있음"을 알린다.
//    - 왼쪽 끝에 있으면 왼쪽은 선명, 오른쪽 끝까지 가면 오른쪽도 선명. 넘치지 않으면(데스크탑) 페이드 없음.
//    - mask-image는 스크롤 컨테이너 자체 박스에 걸리므로, 내용이 스크롤돼도 페이드는 가장자리에 고정된다.
// 2) 활성 항목 자동 스크롤: 현재 선택된 항목(aria-current)이 화면 밖에 있으면 보이는 위치로 당겨온다.
//    (예: 폰에서 "자유게시판" 카테고리에 들어왔는데 탭 줄에는 그 항목이 오른쪽 밖에 숨어 있던 문제)
//    - 선택 항목에는 호출부가 aria-current를 달아야 한다(링크는 "page", 버튼 탭은 "true").
//    - 스크린리더에도 "현재 페이지"로 읽히므로 접근성 개선을 겸한다.
//
// ⚠️ 스타일(flex, gap, overflow-x-auto 등)은 호출부가 className으로 전부 넘긴다. 여기서는 ref·마스크만 얹는다.
//    overflow-x-auto가 빠지면 스크롤 자체가 안 되므로 호출부에 반드시 포함할 것.

// 페이드 폭(px). 탭 글자 1~2자 정도가 흐려지는 너비라, 잘린 글자가 "의도된 흐림"으로 보인다.
const FADE_PX = 24

interface Props {
  className?: string
  children: ReactNode
  // 선택 항목이 바뀌는 기준값(경로·탭 키). 바뀔 때마다 선택 항목을 화면 안으로 스크롤한다.
  activeKey?: string
  'aria-label'?: string
}

export default function ScrollFadeNav({ className, children, activeKey, 'aria-label': ariaLabel }: Props) {
  const ref = useRef<HTMLElement>(null)
  // start/end: 각각 "왼쪽 끝에 붙어 있음", "오른쪽 끝에 붙어 있음".
  // 초기값을 둘 다 true(=페이드 없음)로 둔다. 서버 렌더(SSR) 시점엔 폭을 잴 수 없는데,
  // 반대로 두면 넘치지 않는 데스크탑에서도 첫 화면에 페이드가 잠깐 보였다 사라진다.
  const [edges, setEdges] = useState({ start: true, end: true })

  // 스크롤 위치·크기 변화 감지 → 페이드 상태 갱신
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const update = () => {
      const max = el.scrollWidth - el.clientWidth
      // 고해상도 화면에서 scrollLeft가 소수(예: 0.5)로 떨어지는 경우가 있어 1px 여유를 둔다.
      const start = el.scrollLeft <= 1
      const end = el.scrollLeft >= max - 1
      // 값이 같으면 이전 객체를 그대로 돌려줘 불필요한 리렌더를 막는다(스크롤 이벤트는 매우 자주 온다).
      setEdges(prev => (prev.start === start && prev.end === end ? prev : { start, end }))
    }

    el.addEventListener('scroll', update, { passive: true })
    // ResizeObserver는 observe() 직후 한 번 콜백을 호출하므로 초기 측정도 여기서 된다
    // (effect 본문에서 바로 setState를 부르지 않아도 됨 — 프로젝트 lint 규칙 set-state-in-effect 준수).
    // 컨테이너(화면 회전·창 크기)와 자식(웹폰트 로딩으로 글자 폭이 바뀌는 경우) 모두 관찰한다.
    const ro = new ResizeObserver(update)
    ro.observe(el)
    for (const child of Array.from(el.children)) ro.observe(child)

    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [])

  // 선택 항목을 보이는 위치로. scrollIntoView 대신 컨테이너만 가로로 움직인다 —
  // scrollIntoView는 페이지 전체를 세로로도 스크롤할 수 있어 헤더 탭 때문에 본문 위치가 튈 수 있다.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const active = el.querySelector<HTMLElement>('[aria-current]:not([aria-current="false"])')
    if (!active) return

    const a = active.getBoundingClientRect()
    const c = el.getBoundingClientRect()
    // 페이드 영역에 걸쳐 흐리게 보이지 않도록 FADE_PX만큼 안쪽까지 들어오게 한다.
    if (a.left < c.left + FADE_PX) {
      el.scrollBy({ left: a.left - c.left - FADE_PX })
    } else if (a.right > c.right - FADE_PX) {
      el.scrollBy({ left: a.right - c.right + FADE_PX })
    }
  }, [activeKey])

  // 넘치지 않거나 양 끝이 모두 붙어 있으면 마스크를 걸지 않는다.
  const mask =
    edges.start && edges.end
      ? undefined
      : `linear-gradient(to right, ${edges.start ? '#000' : 'transparent'}, #000 ${FADE_PX}px, #000 calc(100% - ${FADE_PX}px), ${edges.end ? '#000' : 'transparent'})`

  return (
    <nav
      ref={ref}
      aria-label={ariaLabel}
      className={className}
      // WebkitMaskImage: iOS 15.3 이하 Safari는 접두사 버전만 지원한다.
      style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined}
    >
      {children}
    </nav>
  )
}
