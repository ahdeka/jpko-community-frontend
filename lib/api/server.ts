import { cookies } from 'next/headers'

// 서버 컴포넌트의 fetch는 브라우저 쿠키를 자동으로 싣지 않으므로,
// 로그인 상태가 필요한 백엔드 요청에는 이 헤더를 함께 전달해야 한다.
export async function authHeaders(): Promise<HeadersInit> {
  const cookieStore = await cookies()
  const cookie = cookieStore.toString()
  return cookie ? { Cookie: cookie } : {}
}
