'use client'

import { useEffect } from 'react'

const CONFIRM_MESSAGE =
  '작성 중인 내용이 있습니다.\n페이지를 벗어나면 저장되지 않은 변경 사항이 사라집니다. 이동하시겠습니까?'

// 작성/수정 중(when=true) 페이지 이탈을 막아 작업 유실을 방지하는 훅.
//
// 커버하는 이탈 경로
//  1) 새로고침 / 탭 닫기 / 주소창 직접 입력 / 사이트 밖 이동
//     → beforeunload 이벤트로 브라우저 기본 경고를 띄운다.
//       (브라우저 정책상 경고 "문구"는 커스텀할 수 없다.)
//  2) 브라우저 뒤로가기 버튼
//     → App Router에는 라우트 변경을 취소하는 공식 API가 없어,
//       더미 히스토리 엔트리를 하나 쌓아두고 popstate를 가로채 confirm을 띄운다.
//
// 한계(의도된 범위)
//  - 헤더 로고/카테고리 같은 "앱 내 <Link> 클릭"은 이 훅이 가로채지 않는다.
//    (App Router에 전역 네비게이션 가드가 없어, 막으려면 각 Link에 onNavigate를
//     물려야 하므로 범위를 벗어남)
//  - when이 false로 풀려도 이미 쌓인 더미 엔트리는 남는다(뒤로가기 한 번이 무동작이
//    될 수 있음). 흔치 않고 파괴적이지 않은 부작용이라 허용한다.
export function useUnsavedChanges(when: boolean): void {
  useEffect(() => {
    if (!when) return

    // 1) 언로드(새로고침·탭 닫기·주소창·외부 이동)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      // 일부 구형 브라우저 호환을 위해 returnValue도 설정
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    // 2) 뒤로가기 가로채기 — 더미 엔트리를 쌓아 첫 뒤로가기가 페이지를 떠나지 않게 함
    window.history.pushState(null, '', window.location.href)
    const handlePopState = () => {
      if (window.confirm(CONFIRM_MESSAGE)) {
        // 이동 허용: 리스너를 떼고 더미를 지나 실제 이전 페이지로
        window.removeEventListener('popstate', handlePopState)
        window.history.back()
      } else {
        // 머무름: 더미를 다시 쌓아 다음 뒤로가기도 가로채게 함
        window.history.pushState(null, '', window.location.href)
      }
    }
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [when])
}
