import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Next.js 16부터 Middleware는 Proxy로 명칭이 바뀌었다(기능 동일).
//
// 목적: 로그인한 사용자가 /login·/signup에 접근하면 "서버 단"에서 홈으로 리다이렉트.
// 클라이언트 가드(useRedirectIfAuthenticated)만으로는 인증을 /me 응답 이후에야 알 수 있어
// "로그인" 문구가 잠깐 노출되는데, Proxy는 페이지 렌더 전에 돌아 깜빡임 자체를 없앤다.
//
// accessToken 쿠키의 "존재"만 보는 낙관적 검사다. (Proxy 문서 권장 — 전체 세션/인가 검증용 아님)
// 쿠키는 maxAge 1시간 후 브라우저가 자동 삭제하고 로그아웃 시에도 제거되므로,
// 쿠키가 있으면 사실상 로그인 상태로 간주해도 무방하다.
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has('accessToken')
  if (hasSession) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  return NextResponse.next()
}

// 인증 페이지에서만 동작
export const config = {
  matcher: ['/login', '/signup'],
}
