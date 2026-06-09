'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function Header() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="flex justify-between items-center border-b pb-4 mb-6">
      <Link href="/" className="font-bold text-base">JPKO 커뮤니티</Link>
      <nav className="flex items-center gap-3 text-sm">
        {user ? (
          <>
            <span className="text-gray-600">{user.nickname}</span>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700"
            >
              로그아웃
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-gray-600 hover:text-gray-900">
              로그인
            </Link>
            <Link
              href="/signup"
              className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
            >
              회원가입
            </Link>
          </>
        )}
      </nav>
    </header>
  )
}
