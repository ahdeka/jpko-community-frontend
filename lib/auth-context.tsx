'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@/types'
import { authApi } from '@/lib/api/auth'
import { ApiError, SESSION_EXPIRED_EVENT } from '@/lib/api/client'

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
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
