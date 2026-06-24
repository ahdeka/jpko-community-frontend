// 이미지가 포함된 글 표시용 아이콘.
// 텍스트 글에는 아이콘을 붙이지 않고, 이미지 글에만 색을 넣은 채움형 아이콘을 보여
// 목록에서 사진 글이 한눈에 띄도록 한다. (디시인사이드의 컬러 아이콘 컨셉을 참고)
export default function ImageBadge() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-emerald-500"
      viewBox="0 0 24 24"
      fill="currentColor"
      role="img"
      aria-label="이미지 포함"
    >
      <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM8.5 8a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM5 18l3.25-4.18 2.32 2.79L13.5 13l5.5 5H5z" />
    </svg>
  )
}
