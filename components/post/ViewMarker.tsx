'use client'

import { useEffect } from 'react'

// 조회수 중복 증가 방지용 브라우저 쿠키를 심는 컴포넌트.
//
// 왜 필요한가:
//  백엔드는 GET /api/posts/{id}·/api/notices/{id} 응답에 HttpOnly 쿠키(`viewedPost_{id}`·
//  `viewedNotice_{id}`)를 내려, 그 쿠키가 있으면 조회수 증가를 건너뛴다. 그런데 프론트는 상세를
//  "서버 컴포넌트(RSC)"에서 조회하므로 (브라우저 → Next 서버 → 백엔드), 백엔드가 준 Set-Cookie는
//  Next 서버의 fetch 응답에서 버려지고 브라우저까지 오지 않는다.
//  → 브라우저가 쿠키를 영영 못 가져 새로고침마다 조회수가 증가.
//
// 해결:
//  브라우저에서 직접 백엔드와 "완전히 동일한 이름"의 쿠키를 심는다. 다음 요청부터 SSR의
//  authHeaders()가 이 쿠키를 백엔드로 전달하고, 백엔드는 쿠키 존재만 확인하므로(HttpOnly 여부
//  무관) 증가를 건너뛴다. 이름이 조금이라도 다르면(예: `viewed_` vs `viewedPost_`) 백엔드가 못 찾아
//  매번 증가하므로, name은 반드시 백엔드 쿠키명과 일치시켜 전달해야 한다.
//
// 흐름:
//  1) 첫 진입: 브라우저에 쿠키 없음 → SSR fetch가 조회수 +1 (정상, 이 조회를 카운트)
//  2) 이 컴포넌트가 마운트되며 브라우저에 쿠키를 심음
//  3) 새로고침: SSR이 쿠키를 백엔드로 전달 → 백엔드가 증가 건너뜀 ✓
//
// 백엔드와 동일하게 24시간 유지. 이미 쿠키가 있으면 다시 쓰지 않아, 만료 시점이
// "첫 조회" 기준으로 고정된다(재조회 때마다 24h가 밀려나지 않도록 — 백엔드 동작 미러링).
const VIEW_COOKIE_MAX_AGE = 60 * 60 * 24 // 24시간(초). 백엔드 *Controller.VIEW_COOKIE_MAX_AGE와 일치

// name: 백엔드가 검사하는 쿠키명 그대로. 게시글은 `viewedPost_{id}`, 공지는 `viewedNotice_{id}`.
export default function ViewMarker({ name }: { name: string }) {
  useEffect(() => {
    // 이미 심어져 있으면 만료 창을 밀지 않기 위해 그대로 둔다.
    const already = document.cookie
      .split('; ')
      .some(c => c.startsWith(`${name}=`))
    if (already) return

    // path=/ 로 전 경로에서 전송되게 하고, 같은 사이트 요청이므로 SameSite=Lax면 충분하다.
    document.cookie = `${name}=1; path=/; max-age=${VIEW_COOKIE_MAX_AGE}; samesite=lax`
  }, [name])

  return null
}
