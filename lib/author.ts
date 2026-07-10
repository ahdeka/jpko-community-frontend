// 탈퇴 회원 작성자명 처리.
//
// 백엔드는 탈퇴한 회원이 쓴 글/댓글의 작성자명을 이 고정 문자열로 내려준다
// (User.getDisplayNickname() → "(탈퇴한 회원)"). 별도의 withdrawn 플래그는 없으므로
// 프론트는 이 문자열로 판별한다. 문자열 매칭은 취약하니, 비교 지점을 이 상수 한 곳으로
// 모아 백엔드 문구가 바뀌어도 여기만 고치면 되게 한다.
export const WITHDRAWN_AUTHOR_LABEL = '(탈퇴한 회원)'

export function isWithdrawnAuthor(author: string | null | undefined): boolean {
  return author === WITHDRAWN_AUTHOR_LABEL
}
