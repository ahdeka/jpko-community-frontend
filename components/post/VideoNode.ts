import { mergeAttributes, Node } from '@tiptap/core'

// 커스텀 동영상 노드.
// @tiptap/extension-image에는 <video>가 없으므로, Image 확장을 본떠 최소한의
// "블록형 동영상" 노드를 직접 정의한다. 렌더 결과(저장 HTML)는 백엔드 Jsoup Safelist가
// 허용하는 <video controls src ...> 형태와 정확히 맞춘다 — 그래야 저장 시 sanitize를
// 통과해 태그/속성이 살아남는다. (백엔드 ImageService.sanitize의 addAttributes 참고)

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    video: {
      // temp S3 URL을 본문에 동영상으로 삽입한다. 저장 시 백엔드가 posts/{id}로 이동시킨다.
      setVideo: (options: { src: string; poster?: string | null }) => ReturnType
    }
  }
}

export interface VideoOptions {
  // 저장/렌더 HTML에 항상 덧붙일 공통 속성. (여기서는 사용처가 없지만 Image 확장과 형태를 맞춰 둔다)
  HTMLAttributes: Record<string, unknown>
}

export const Video = Node.create<VideoOptions>({
  name: 'video',

  addOptions() {
    return { HTMLAttributes: {} }
  },

  group: 'block',
  // content 스펙을 두지 않으므로 이 노드는 leaf(원자) 노드가 된다 — Image와 동일하게
  // 클릭하면 통째로 선택되고 Backspace/Delete로 한 번에 지워진다(문단 안에 커서가 끼는
  // 애매한 상태가 생기지 않는다).
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      // poster(썸네일)는 백엔드가 아직 생성하지 않지만, 추후 지원 시 그대로 실릴 수 있도록
      // 속성만 미리 왕복(parse↔render) 처리한다. 값이 없으면 renderHTML에서 자동 제외된다.
      poster: { default: null },
    }
  },

  parseHTML() {
    // 수정 모드에서 저장된 본문(HTML)을 다시 노드로 복원할 때 쓰인다.
    return [
      {
        tag: 'video',
        // <video src>와 <video><source src> 두 형태 모두에서 src를 복원한다.
        // (백엔드 Jsoup Safelist가 둘 다 허용하므로 외부/과거 저장분도 대비)
        getAttrs: (el) => {
          const dom = el as HTMLElement
          const src =
            dom.getAttribute('src') ||
            dom.querySelector('source')?.getAttribute('src') ||
            null
          // src가 없는 <video>는 재생할 게 없으므로 노드로 취급하지 않는다.
          if (!src) return false
          return { src, poster: dom.getAttribute('poster') }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    // controls/preload/playsinline은 저장 시 항상 강제한다(모두 백엔드 Safelist 허용 속성).
    //  - controls: 뷰어가 재생/일시정지/음량을 조작할 수 있게 한다.
    //  - preload=metadata: 목록/본문 진입 시 영상 전체가 아니라 메타데이터(길이·크기)만 먼저
    //    받아 불필요한 트래픽을 줄인다.
    //  - playsinline: iOS 사파리에서 전체화면 강제 전환 없이 인라인 재생되게 한다.
    return [
      'video',
      mergeAttributes(
        { controls: 'controls', preload: 'metadata', playsinline: 'true' },
        this.options.HTMLAttributes,
        HTMLAttributes,
      ),
    ]
  },

  addCommands() {
    return {
      setVideo:
        (options) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: options }),
    }
  },
})

export default Video
