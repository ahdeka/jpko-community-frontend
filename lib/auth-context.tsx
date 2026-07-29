'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@/types'
import { authApi } from '@/lib/api/auth'
import { ApiError, SESSION_EXPIRED_EVENT, ACCOUNT_SUSPENDED_EVENT } from '@/lib/api/client'
import SuspendedAccountModal from '@/components/auth/SuspendedAccountModal'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  fetchUser: () => Promise<void>
  logout: () => Promise<void>
  // 서버가 이미 세션을 종료한 뒤(회원 탈퇴 등) 클라이언트 로그인 상태만 즉시 비운다.
  // logout()과 달리 /api/auth/logout을 호출하지 않는다 — 탈퇴 응답이 이미 쿠키를 지웠으므로
  // 추가 호출은 불필요하고, 인증 없는 상태라 401만 유발할 수 있다.
  clearAuth: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // 세션 도중 계정이 정지됐을 때 띄우는 전역 안내 모달의 표시 여부.
  const [suspended, setSuspended] = useState(false)
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
    async function handleAccountSuspended() {
      if (suspendHandledRef.current) return   // 다발적 403 중복 처리 차단
      suspendHandledRef.current = true

      setUser(null)
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
      {children}
      {/* 세션 도중 정지된 경우의 전역 안내. 닫으면 로그인 화면으로 하드 네비게이션해
          RSC 캐시·서버 페치 데이터까지 완전 초기화한다. */}
      <SuspendedAccountModal
        open={suspended}
        onClose={() => { window.location.href = '/login' }}
      />
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
