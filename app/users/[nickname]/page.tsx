import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { usersApi } from '@/lib/api/users'
import { ApiError } from '@/lib/api/client'
import type { PageResponse, UserPost } from '@/types'
import PublicProfile from '@/components/user/PublicProfile'

// 프로필 목록 한 페이지에 보여줄 글 수
const PAGE_SIZE = 10

// generateMetadata와 본문이 같은 요청에서 프로필을 "한 번만" 조회하도록 캐시한다.
// (프로필 조회는 부작용이 없지만, 중복 네트워크 호출을 피한다.)
const getProfile = cache((nickname: string) => usersApi.getPublicProfile(nickname))

// ⚠️ 이 Next 버전의 동적 라우트 params는 "퍼센트 인코딩된 상태"로 넘어온다
//    (예: /users/관리자 → params.nickname === "%EA%B4%80%EB%A6%AC%EC%9E%90").
//    API 계층(usersApi)이 다시 encodeURIComponent로 한 번 감싸므로, 여기서 먼저 디코딩하지 않으면
//    이중 인코딩(%25EA…)이 되어 백엔드가 400을 반환한다. 그래서 raw 닉네임으로 되돌린 뒤 넘긴다.
//    유효 닉네임은 [가-힣a-zA-Z0-9]+ 라 '%'가 없어, 이미 디코딩된 값이 들어와도 디코딩은 무해(멱등)하다.
//    잘못된 % 시퀀스(사용자가 주소창에 임의 입력)면 예외가 나므로 원본을 그대로 둔다(백엔드가 404 처리).
function decodeNickname(raw: string): string {
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

// searchParams.page("1-based로 보이는 URL"이 아니라 0-based)를 안전하게 정수로 변환한다.
// 음수·NaN·소수는 0으로 흡수한다.
function parsePage(raw: string | undefined): number {
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : 0
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ nickname: string }>
}): Promise<Metadata> {
  const nickname = decodeNickname((await params).nickname)

  const res = await getProfile(nickname).catch(() => null)
  const profile = res?.data
  if (!profile) return { title: '프로필' }

  const title = `${profile.nickname}님의 프로필`
  const description = profile.bio ?? `${profile.nickname}님이 작성한 글을 확인하세요.`
  return {
    title,
    description,
    openGraph: { type: 'profile', title, description },
  }
}

export default async function UserProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ nickname: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const nickname = decodeNickname((await params).nickname)
  const sp = await searchParams
  const page = parsePage(sp.page)

  // 프로필(필수)과 글 목록(부가)을 병렬 조회한다.
  const [profileRes, postsRes] = await Promise.allSettled([
    getProfile(nickname),
    usersApi.getUserPosts(nickname, page, PAGE_SIZE),
  ])

  // 프로필 조회 실패: 404(USER_NOT_FOUND/탈퇴)면 not-found, 그 외는 상위 error 바운더리로.
  if (profileRes.status === 'rejected') {
    const err = profileRes.reason
    if (err instanceof ApiError && err.status === 404) notFound()
    throw err
  }

  const profile = profileRes.value.data
  if (!profile) notFound()

  // 글 목록은 부가 정보라 실패해도 프로필은 보여준다(빈 목록으로 폴백).
  const emptyPage: PageResponse<UserPost> = {
    content: [],
    totalPages: 0,
    totalElements: 0,
    number: page,
    size: PAGE_SIZE,
  }
  const postsPage =
    postsRes.status === 'fulfilled' ? (postsRes.value.data ?? emptyPage) : emptyPage

  return (
    <PublicProfile
      profile={profile}
      postsPage={postsPage}
      currentPage={page}
      nickname={nickname}
    />
  )
}
