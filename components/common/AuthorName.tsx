import Link from 'next/link'
import { isWithdrawnAuthor } from '@/lib/author'
import AdminBadge from './AdminBadge'

// 작성자명 표시 컴포넌트.
// 탈퇴한 회원이면 회색·이탤릭으로 흐리게 처리해, 실제 사용자 닉네임과 시각적으로 구분한다.
// isAdmin이면 닉네임 앞에 "운영진" 왕관 뱃지를 함께 보여준다(진짜 운영진임을 신뢰 있게 표시).
//
// nickname을 넘기면 이름을 공개 프로필(/users/{nickname})로 가는 링크로 감싼다.
// ⚠️ 호출부는 "링크를 걸어도 되는 경우"에만 nickname을 넘겨야 한다:
//    - 익명 글/댓글: author가 "ㅇㅇ(마스킹IP)"라 실제 닉네임이 아님 → 넘기지 말 것.
//    - 탈퇴 회원: 프로필이 없음(백엔드 404) → 넘기지 말 것(넘겨도 아래 withdrawn 분기가 먼저 막는다).
//   보통 nickname으로는 author와 동일한 실제 닉네임 문자열을 그대로 넘긴다.
//
// 스타일은 globals.css의 .author-withdrawn 클래스가 담당한다(인라인 style/ CSS 변수 대신).
// 이유: 색을 라이트/다크에서 반대 방향으로 줘야 하는데(라이트는 밝게, 다크는 어둡게),
//  인라인 style은 테마 조건을 표현하지 못한다. CSS 변수를 참조하는 인라인 style도 써봤지만,
//  변수가 비면 color가 무효가 되어 부모 본문색을 상속(다크에서 흰색으로 튐)하는 취약점이 있었다.
//  전용 클래스는 그런 fallback이 없고, [data-theme="dark"] 선택자로 테마를 확실히 처리한다.
//
// 뱃지는 flex가 아니라 인라인 요소로 넣는다. 이렇게 해야 호출부가 className으로 주는
// truncate / text-center / hidden md:block 등 텍스트 레이아웃이 그대로 유지된다.
export default function AuthorName({
  author,
  isAdmin,
  nickname,
  className,
}: {
  author: string
  isAdmin?: boolean
  nickname?: string | null
  className?: string
}) {
  const withdrawn = isWithdrawnAuthor(author)

  // 탈퇴 회원: 링크·운영진 뱃지 없이 흐린 텍스트만. 흐린 "(탈퇴한 회원)" 옆에 뱃지가 붙으면
  // 어색하고, 탈퇴한 이상 프로필도 없어(백엔드 404) 링크를 걸면 안 된다.
  if (withdrawn) {
    const cls = `${className ? `${className} ` : ''}author-withdrawn`
    return (
      <span className={cls} title="탈퇴한 회원">
        {author}
      </span>
    )
  }

  const body = (
    <>
      {isAdmin && <AdminBadge className="mr-1 align-middle" />}
      {author}
    </>
  )

  // 프로필 링크: nickname이 있을 때만. hover:underline으로 클릭 가능함을 드러낸다.
  if (nickname) {
    return (
      <Link
        href={`/users/${encodeURIComponent(nickname)}`}
        className={`${className ? `${className} ` : ''}hover:underline`}
      >
        {body}
      </Link>
    )
  }

  return <span className={className}>{body}</span>
}
