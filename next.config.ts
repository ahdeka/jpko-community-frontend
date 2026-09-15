import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // 기본(구) 스크롤 핸들러는 findDOMNode로 "세그먼트의 첫 DOM 노드"를 스크롤 기준으로 삼는다.
    // generateMetadata가 있는 페이지(게시글 상세 등)는 React가 <title>/<meta>를 <head>로 끌어올려
    // 그 첫 노드가 head 안의 태그가 되고, 크기 0인 형제만 훑다가 스크롤 없이 끝난다.
    // → 상세 하단 목록에서 다른 글로 이동해도 스크롤이 맨 위로 가지 않던 버그.
    // 신 핸들러는 Fragment ref로 실제 페이지 콘텐츠를 기준으로 삼아 이 문제가 없다.
    // (#comments 같은 해시 이동 처리는 동일하게 유지됨. Next가 기본값으로 바꾸면 제거 가능)
    // ※ 이것만으로는 부족했다: loading.tsx 스켈레톤이 짧으면 여전히 스크롤을 건너뛴다.
    //   나머지 절반의 수정은 app/posts/[id]/loading.tsx의 min-h-screen 주석 참고.
    appNewScrollHandler: true,
  },
};

export default nextConfig;
