'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { CheckInInfo, User } from '@/types'
import { authApi } from '@/lib/api/auth'
import { ApiError, SESSION_EXPIRED_EVENT, ACCOUNT_SUSPENDED_EVENT, ACTIVITY_BLOCKED_EVENT, type AccountSuspendedDetail } from '@/lib/api/client'
import SuspendedAccountModal from '@/components/auth/SuspendedAccountModal'
import CheckInResultModal from '@/components/points/CheckInResultModal'
import RedirectingOverlay from '@/components/auth/RedirectingOverlay'
import ActivityBlockScreen from '@/components/auth/ActivityBlockScreen'

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
  // (SuspendedAccountModal과 동일한 이유).
  notifyCheckInResult: (info: CheckInInfo) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // 세션 도중 계정이 정지됐을 때 띄우는 전역 안내 모달의 표시 여부 + 정지 해제 예정 시각(무기한이면 null).
  const [suspended, setSuspended] = useState(false)
  const [suspendedUntil, setSuspendedUntil] = useState<string | null>(null)
  // 세션 도중(또는 새로고침 시점에) 임시 활동 차단이 감지됐는지. true면 children 대신
  // 전체 화면 ActivityBlockScreen을 렌더한다 — 정지와 달리 로그아웃은 하지 않는다.
  const [blocked, setBlocked] = useState(false)
  // 로그인/회원가입 직후 보여줄 출첵 결과. null이면 모달을 띄우지 않는다.
  const [checkInResult, setCheckInResult] = useState<CheckInInfo | null>(null)
  // 여러 요청이 동시에 403을 받아도 로그아웃/상태정리를 딱 한 번만 하기 위한 가드.
  // 리다이렉트(하드 네비게이션) 시 앱이 리로드되며 자연 초기화된다.
  const suspendHandledRef = useRef(false)

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
  // 처리: ① 화면상 로그인 상태 즉시 해제 → ② 전역 정지 모달 표시 → ③ 서버 로그아웃으로 httpOnly 쿠키 제거.
  // logout은 PublicAuthPaths라 정지 유저도 403 없이 호출 가능하다.
  useEffect(() => {
    async function handleAccountSuspended(e: Event) {
      if (suspendHandledRef.current) return   // 다발적 403 중복 처리 차단
      suspendHandledRef.current = true

      setUser(null)
      setSuspendedUntil((e as CustomEvent<AccountSuspendedDetail>).detail?.suspendedUntil ?? null)
      setSuspended(true)
      try {
        await authApi.logout()
      } catch {
        // 로그아웃 요청이 실패해 쿠키가 남아도, 다음 로드 때 /me가 다시 403을 받아 재시도되므로 상태에 갇히지 않는다.
      }
    }
    window.addEventListener(ACCOUNT_SUSPENDED_EVENT, handleAccountSuspended)
    return () => window.removeEventListener(ACCOUNT_SUSPENDED_EVENT, handleAccountSuspended)
  }, [])

  // 임시 활동 차단이 감지되면(403 ACTIVITY_BLOCKED — /api/auth/me 자체도 포함) client.ts가 이 이벤트를 쏜다.
  // 정지와 달리 세션은 유효하므로 로그아웃하지 않는다 — 화면만 ActivityBlockScreen으로 전환한다.
  // 그 화면이 백엔드가 허용한 /api/shop/blocks/me 등으로 직접 상세 정보를 조회한다.
  useEffect(() => {
    function handleActivityBlocked() {
      setBlocked(true)
    }
    window.addEventListener(ACTIVITY_BLOCKED_EVENT, handleActivityBlocked)
    return () => window.removeEventListener(ACTIVITY_BLOCKED_EVENT, handleActivityBlocked)
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
      {/* 온보딩 게이트가 걸린 동안에는 리다이렉트가 끝날 때까지 본문 대신 전환 오버레이만 보여줘
          게이트 대상 페이지 내용이 잠깐 노출되는 것을 막는다.
          차단(blocked)은 그보다 먼저 걸린다 — 차단된 유저는 /api/auth/me 자체가 실패해 user가
          null이라 gating(=!!user 전제)이 애초에 성립하지 않으므로 우선순위 충돌은 없다. */}
      {gating ? <RedirectingOverlay /> : blocked ? (
        <ActivityBlockScreen onResolved={() => { window.location.href = '/' }} />
      ) : children}
      {/* 세션 도중 정지된 경우의 전역 안내. 닫으면 로그인 화면으로 하드 네비게이션해
          RSC 캐시·서버 페치 데이터까지 완전 초기화한다. */}
      <SuspendedAccountModal
        open={suspended}
        onClose={() => { window.location.href = '/login' }}
        suspendedUntil={suspendedUntil}
      />
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
