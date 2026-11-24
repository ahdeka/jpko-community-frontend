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
  async redirects() {
    return [
      // 비밀번호 찾기가 아이디/비밀번호 찾기로 통합되며 URL이 바뀌었다. 즐겨찾기 등 구 URL 진입을 살린다.
      // 308(permanent)이라 브라우저·검색엔진이 영구 캐시한다 — 되돌릴 일 없는 이동이므로 적합.
      // 아카이브 전환(2026-11-24): 로그인·글쓰기·마이페이지 등 상호작용 페이지는 삭제했다.
      // 즐겨찾기·검색엔진에 남은 구 URL이 404 대신 홈으로 가도록 묶어서 보낸다.
      // 아카이브는 되돌릴 일이 없지만, 혹시 몰라 permanent: false(307)로 둔다 — 브라우저가 영구 캐시하지 않게.
      ...[
        '/forgot-password', '/find-account', '/reset-password', '/verify-email-change',
        '/login', '/signup', '/signup/:path*', '/mypage/:path*', '/notifications',
        '/admin/:path*', '/game-center/:path*', '/roulette', '/pachinko', '/slot',
        '/users/:path*', '/posts/new', '/posts/:id/edit',
      ].map(source => ({ source, destination: '/', permanent: false })),
    ];
  },
};

export default nextConfig;
