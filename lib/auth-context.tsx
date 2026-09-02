'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { CheckInInfo, User } from '@/types'
import { authApi } from '@/lib/api/auth'
import { ApiError, SESSION_EXPIRED_EVENT, ACCOUNT_SUSPENDED_EVENT } from '@/lib/api/client'
import SuspendedScreen from '@/components/auth/SuspendedScreen'
import CheckInResultModal from '@/components/points/CheckInResultModal'
import RedirectingOverlay from '@/components/auth/RedirectingOverlay'

// 계정 전환(온보딩)이 필요한 유저에게도 접근을 허용하는 경로.
// 이 목록 밖의 모든 경로는 전역 가드가 /onboarding으로 되돌린다.
//  - /onboarding          : 전환 화면 그 자체
//  - /verify-email-change  : 온보딩 중 등록한 이메일의 인증 링크 착지점
//  - /terms, /privacy      : 전환 화면에서 여는 약관/개인정보(새 탭) 열람 허용
const ONBOARDING_ALLOWED_PATHS = new Set(['/onboarding', '/verify-email-change', '/terms', '/privacy'])

interface AuthContextType {
  user: User | null
  isLoading: boolean
  fetchUser: () => Promise<void>
  logout: () => Promise<void>
  // 서버가 이미 세션을 종료한 뒤(회원 탈퇴 등) 클라이언트 로그인 상태만 즉시 비운다.
  // logout()과 달리 /api/auth/logout을 호출하지 않는다 — 탈퇴 응답이 이미 쿠키를 지웠으므로
  // 추가 호출은 불필요하고, 인증 없는 상태라 401만 유발할 수 있다.
  clearAuth: () => void
  // 로그인(또는 회원가입 직후 자동 로그인) 직후 출첵 결과를 전역에 알린다. LoginForm/SignupForm이
  // 성공 시 호출하며, AuthProvider가 렌더하는 CheckInResultModal이 이 값을 소비하고 null로 되돌린다.
  // 두 폼 모두 성공 즉시 router.replace로 이동하고 useRedirectIfAuthenticated가 폼을 언마운트하므로,
  // 폼 내부가 아니라 여기(AuthProvider)에서 상태를 들고 있어야 페이지 전환 중에도 모달이 살아남는다
  // (SuspendedScreen과 동일한 이유).
  notifyCheckInResult: (info: CheckInInfo) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // 세션 도중(또는 새로고침 시점에) 관리자 정지가 감지됐는지. true면 children 대신 전체 화면
  // SuspendedScreen을 렌더한다 — 정지돼도 세션 자체는 유효하다(로그인은 되고 출첵도 처리됨).
  const [suspended, setSuspended] = useState(false)
  // 로그인/회원가입 직후 보여줄 출첵 결과. null이면 모달을 띄우지 않는다.
  const [checkInResult, setCheckInResult] = useState<CheckInInfo | null>(null)

  const fetchUser = useCallback(async () => {
    try {
      const res = await authApi.me()
      setUser(res.data ?? null)
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setUser(null)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  // 어떤 요청에서든 "재발급까지 실패한 401"(세션 만료)이 나면 client.ts가 이 이벤트를 쏜다.
  // 그 순간 전역 로그인 상태를 비워, 헤더 등 UI가 곧바로 로그아웃으로 동기화되게 한다.
  // (이벤트는 브라우저에서만 발생하며, 리스너는 언마운트 시 해제해 누수를 막는다.)
  useEffect(() => {
    function handleSessionExpired() {
      setUser(null)
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
  }, [])

  // 세션 도중 계정이 정지되면 client.ts가 이 이벤트를 쏜다(403 + code SUSPENDED_ACCOUNT).
  // 로그아웃하지는 않는다 — 정지된 계정도 세션 자체는 유효하고, SuspendedScreen이 그 안에서
  // 정지 사유·기한 조회와 로그아웃까지 처리한다(SuspendAllowedPaths로 제한된 API만 사용).
  useEffect(() => {
    function handleAccountSuspended() {
      setSuspended(true)
    }
    window.addEventListener(ACCOUNT_SUSPENDED_EVENT, handleAccountSuspended)
    return () => window.removeEventListener(ACCOUNT_SUSPENDED_EVENT, handleAccountSuspended)
  }, [])

  async function logout() {
    try {
      await authApi.logout()
    } catch {}
    setUser(null)
  }

  const clearAuth = useCallback(() => {
    setUser(null)
  }, [])

  // checkedIn=false(오늘 이미 했음)는 보여줄 정보가 없으므로 무시한다.
  const notifyCheckInResult = useCallback((info: CheckInInfo) => {
    if (info.checkedIn) setCheckInResult(info)
  }, [])

  // ===== 전역 온보딩 하드 게이트 =====
  // 기존 유저는 배포 전 발급된 세션 쿠키를 그대로 들고 있어 "재로그인 없이" 로그인 상태로 진입한다.
  // 그래서 로그인 시점 리다이렉트만으로는 전환을 강제할 수 없다 → 어느 경로에 있든 needsOnboarding
  // 유저를 /onboarding으로 모은다. (인증 상태 확정 전(isLoading)에는 판단을 보류한다.)
  // pathname이 null인 과도기에는 섣불리 리다이렉트하지 않는다.
  const gating =
    !isLoading &&
    !!user &&
    user.needsOnboarding &&
    pathname !== null &&
    !ONBOARDING_ALLOWED_PATHS.has(pathname)

  useEffect(() => {
    if (gating) router.replace('/onboarding')
  }, [gating, router])

  return (
    <AuthContext.Provider value={{ user, isLoading, fetchUser, logout, clearAuth, notifyCheckInResult }}>
      {/* 정지(suspended)가 최우선이다 — 정지된 유저는 /api/auth/me 자체가 403이라 user가 null로
          남으므로 gating(=!!user 전제)이 애초에 성립하지 않는다. 그래도 순서를 명시해 우선순위
          충돌 없이 SuspendedScreen을 보여준다.
          온보딩 게이트가 걸린 동안에는 리다이렉트가 끝날 때까지 본문 대신 전환 오버레이만 보여줘
          게이트 대상 페이지 내용이 잠깐 노출되는 것을 막는다. */}
      {suspended ? (
        <SuspendedScreen onResolved={() => { window.location.href = '/' }} />
      ) : gating ? <RedirectingOverlay /> : children}
      <CheckInResultModal
        info={checkInResult}
        onClose={() => setCheckInResult(null)}
      />
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
