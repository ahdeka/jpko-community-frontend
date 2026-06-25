'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

// 이미 로그인한 사용자가 로그인/회원가입 페이지에 들어오면 홈으로 돌려보낸다.
// (뒤로가기·주소창 직접 입력 모두 차단)
//
// 동작 원리
//  - 인증 상태(useAuth)는 /api/auth/me 응답으로 클라이언트에서 결정된다.
//  - isLoading 동안에는 판단을 보류한다(아직 모름 → 섣불리 리다이렉트하지 않음).
//  - push가 아닌 replace로 이동해, 히스토리에 로그인 페이지를 남기지 않는다
//    (뒤로가기 → 리다이렉트 → 다시 뒤로가기 루프 방지).
//
// 반환값 blocked: "로그인 상태가 확정되어 리다이렉트가 진행 중"인지 여부.
//  - 비로그인(로그인 페이지의 일반적인 경우)에는 항상 false → 폼이 깜빡임 없이 바로 노출.
//  - 로그인 상태로 진입한 경우에만 true → 폼 대신 잠깐 빈 화면을 보여주고 곧 이동.
export function useRedirectIfAuthenticated(to = '/'): { blocked: boolean } {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) router.replace(to)
  }, [isLoading, user, router, to])

  return { blocked: !isLoading && !!user }
}
