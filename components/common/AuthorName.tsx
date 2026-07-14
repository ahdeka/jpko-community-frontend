import { isWithdrawnAuthor } from '@/lib/author'
import AdminBadge from './AdminBadge'

// 작성자명 표시 컴포넌트.
// 탈퇴한 회원이면 회색·이탤릭으로 흐리게 처리해, 실제 사용자 닉네임과 시각적으로 구분한다.
// isAdmin이면 닉네임 앞에 "운영진" 왕관 뱃지를 함께 보여준다(진짜 운영진임을 신뢰 있게 표시).
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
  className,
}: {
  author: string
  isAdmin?: boolean
  className?: string
}) {
  const withdrawn = isWithdrawnAuthor(author)

  // 탈퇴 회원: 운영진 뱃지를 숨긴다. 흐린 "(탈퇴한 회원)" 옆에 뱃지가 붙으면 어색하고,
  // 탈퇴한 이상 현재 운영진으로 표시할 이유도 없다.
  if (withdrawn) {
    const cls = `${className ? `${className} ` : ''}author-withdrawn`
    return (
      <span className={cls} title="탈퇴한 회원">
        {author}
      </span>
    )
  }

  // 운영진이 아니면 기존과 동일하게 이름만 렌더한다.
  if (!isAdmin) {
    return <span className={className}>{author}</span>
  }

  return (
    <span className={className}>
      <AdminBadge className="mr-1 align-middle" />
      {author}
    </span>
  )
}
