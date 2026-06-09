'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@/types'
import { authApi } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'

interface AuthContextType {
  user: User | null
  fetchUser: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const fetchUser = useCallback(async () => {
    try {
      const res = await authApi.me()
      setUser(res.data ?? null)
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setUser(null)
      }
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  async function logout() {
    try {
      await authApi.logout()
    } catch {}
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, fetchUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
