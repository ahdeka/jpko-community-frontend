'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@/types'
import { authApi } from '@/lib/api/auth'
import { ApiError, SESSION_EXPIRED_EVENT, ACCOUNT_SUSPENDED_EVENT } from '@/lib/api/client'
import SuspendedScreen from '@/components/auth/SuspendedScreen'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  fetchUser: () => Promise<void>
  logout: () => Promise<void>
  // 서버가 이미 세션을 종료한 뒤(회원 탈퇴 등) 클라이언트 로그인 상태만 즉시 비운다.
  // logout()과 달리 /api/auth/logout을 호출하지 않는다 — 탈퇴 응답이 이미 쿠키를 지웠으므로
  // 추가 호출은 불필요하고, 인증 없는 상태라 401만 유발할 수 있다.
  clearAuth: () => void
  // 출첵 결과 모달은 더 이상 여기 있지 않다. 로그인 시 자동 출첵이 폐지되고 헤더 사용자 메뉴의
  // "출석하기"로 옮겨가면서, 결과도 그 모달(CheckInModal) 안에서 상태 전환으로 보여준다
  // — 페이지 전환을 넘어 살아남아야 할 이유가 사라졌기 때문이다.
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // 세션 도중(또는 새로고침 시점에) 관리자 정지가 감지됐는지. true면 children 대신 전체 화면
  // SuspendedScreen을 렌더한다 — 정지돼도 세션 자체는 유효하다(로그인은 된다).
  const [suspended, setSuspended] = useState(false)

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

  return (
    <AuthContext.Provider value={{ user, isLoading, fetchUser, logout, clearAuth }}>
      {/* 정지(suspended)면 children 대신 전체 화면 SuspendedScreen을 렌더한다.
          정지된 유저는 /api/auth/me 자체가 403이라 user는 null로 남지만, 세션은 유효해서
          그 화면 안에서 정지 사유·기한 조회와 로그아웃까지 처리한다. */}
      {suspended ? (
        <SuspendedScreen onResolved={() => { window.location.href = '/' }} />
      ) : children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
