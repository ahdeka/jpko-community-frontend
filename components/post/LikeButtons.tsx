// 아카이브: 추천/비추천은 운영 종료 시점의 숫자만 보여준다(누를 수 없음).
// 운영 중 버튼과 같은 모양을 유지해, 글이 얼마나 공감을 받았는지 그대로 읽히게 한다.
interface Props {
  postId: number
  initialLikeCount: number
  initialDislikeCount: number
}

export default function LikeButtons({ initialLikeCount, initialDislikeCount }: Props) {
  const box =
    'flex min-w-[104px] items-center justify-center gap-1.5 rounded-full border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300'
  return (
    <div className="flex gap-3 justify-center py-6">
      <div className={box} aria-label={`추천 ${initialLikeCount}`}>
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M2 21h4V9H2v12zM23 10a2 2 0 0 0-2-2h-6.31l.95-4.57.03-.32a1.5 1.5 0 0 0-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10a2 2 0 0 0 2 2h9a2 2 0 0 0 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
        </svg>
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{initialLikeCount}</span>
      </div>
      <div className={box} aria-label={`비추천 ${initialDislikeCount}`}>
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M22 3h-4v12h4V3zM1 14a2 2 0 0 0 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.58-6.59c.37-.36.59-.86.59-1.41V5a2 2 0 0 0-2-2H6a2 2 0 0 0-1.84 1.22L1.14 11.27c-.09.23-.14.47-.14.73v2z" />
        </svg>
        <span className="font-semibold text-red-500 dark:text-red-400">{initialDislikeCount}</span>
      </div>
    </div>
  )
}
