import Link from 'next/link'
import { isWithdrawnAuthor } from '@/lib/author'
import AdminBadge from './AdminBadge'
import RootBadge from './RootBadge'
import LevelBadge from './LevelBadge'

// 작성자명 표시 컴포넌트.
// 탈퇴한 회원이면 회색·이탤릭으로 흐리게 처리해, 실제 사용자 닉네임과 시각적으로 구분한다.
// isRoot면 "운영자"(보라) 뱃지를, 아니면서 isAdmin이면 "운영진"(amber) 뱃지를 닉네임 앞에 보여준다
// (진짜 운영자/운영진임을 서버 role 기반으로 신뢰 있게 표시). 둘은 백엔드에서 상호배타로 내려오지만,
// 만약을 대비해 프론트에서도 ROOT를 우선해 한 개만 표시한다(뱃지 중복 방지).
//
// level을 넘기면 뱃지들 맨 앞에 활동 레벨 칩을 함께 보여준다.
// ⚠️ Lv.0은 유효한 값이므로 판정은 반드시 `level != null`로 한다(falsy 체크를 쓰면 0이 사라진다).
//    백엔드는 익명 글/댓글·탈퇴 회원·삭제된 댓글이면 authorLevel을 null로 내려주므로,
//    호출부는 그 값을 그대로 넘기기만 하면 마스킹이 자동으로 지켜진다.
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
//
// ⚠️ 닉네임 텍스트 자체는 레벨에 따라 달라지지 않는다 — 색도 굵기도 호출부가 준 값 그대로다.
//    레벨 차이는 앞에 붙는 뱃지 하나가 전부 담당한다(lib/level.ts 주석 참고).
export default function AuthorName({
  author,
  isAdmin,
  isRoot,
  level,
  nickname,
  className,
}: {
  author: string
  isAdmin?: boolean
  isRoot?: boolean
  level?: number | null
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

  // 뱃지 순서: [레벨][운영진/운영자][닉네임].
  // 폭이 고정된 좁은 숫자 칩을 맨 왼쪽에 둬야 여러 줄이 쌓였을 때 세로로 정렬돼 보이고,
  // 텍스트가 있어 폭이 들쭉날쭉한 역할 뱃지는 그 뒤로 밀어 닉네임과 붙여 둔다.
  //
  // ROOT를 우선한다: 백엔드는 상호배타로 내려주지만, 혹시 둘 다 true여도 뱃지는 하나만.
  const body = (
    <>
      {level != null && <LevelBadge level={level} className="mr-1 align-middle" />}
      {isRoot ? (
        <RootBadge className="mr-1 align-middle" />
      ) : (
        isAdmin && <AdminBadge className="mr-1 align-middle" />
      )}
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
