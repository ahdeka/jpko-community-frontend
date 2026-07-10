import { isWithdrawnAuthor } from '@/lib/author'

// 작성자명 표시 컴포넌트.
// 탈퇴한 회원이면 회색·이탤릭으로 흐리게 처리해, 실제 사용자 닉네임과 시각적으로 구분한다.
//
// 스타일은 globals.css의 .author-withdrawn 클래스가 담당한다(인라인 style/ CSS 변수 대신).
// 이유: 색을 라이트/다크에서 반대 방향으로 줘야 하는데(라이트는 밝게, 다크는 어둡게),
//  인라인 style은 테마 조건을 표현하지 못한다. CSS 변수를 참조하는 인라인 style도 써봤지만,
//  변수가 비면 color가 무효가 되어 부모 본문색을 상속(다크에서 흰색으로 튐)하는 취약점이 있었다.
//  전용 클래스는 그런 fallback이 없고, [data-theme="dark"] 선택자로 테마를 확실히 처리한다.
export default function AuthorName({
  author,
  className,
}: {
  author: string
  className?: string
}) {
  const withdrawn = isWithdrawnAuthor(author)
  // 호출부의 레이아웃/기본 색 클래스는 그대로 두고, 탈퇴 시 override 클래스만 덧붙인다.
  const cls = withdrawn ? `${className ? `${className} ` : ''}author-withdrawn` : className
  return (
    <span className={cls} title={withdrawn ? '탈퇴한 회원' : undefined}>
      {author}
    </span>
  )
}
