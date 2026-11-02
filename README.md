# jpkocommunity — Frontend

일본 취업 · 워킹홀리데이 · 유학 · 일본생활 · 여행에 관심 있는 한국인을 위한 커뮤니티 서비스의 프론트엔드입니다.
기획부터 설계, 개발, 배포, 운영까지 1인으로 진행했습니다.

> **📦 운영 종료 안내**
> 이 서비스는 2026년 6월부터 11월까지 실제로 운영되었고, **2026-11-25에 운영을 종료**했습니다.
> 지금은 게시글을 작성자 정보 없이 보여주는 읽기 전용 아카이브로 전환되어 있습니다.

- 백엔드: [ahdeka/jpko-community](https://github.com/ahdeka/jpko-community)
- 서비스: https://www.jpkocommunity.site (아카이브)

---

## 스크린샷

| 메인 | 게시글 상세 |
|---|---|
| ![메인](docs/screenshots/home.png) | ![게시글](docs/screenshots/post-detail.png) |

| 글쓰기 에디터 | 모바일 |
|---|---|
| ![에디터](docs/screenshots/post-editor.png) | ![모바일](docs/screenshots/mobile.png) |

---

## 기술 스택

| 영역 | 기술 |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Editor | Tiptap 3 (이미지 삽입 확장) |
| 배포 | Vercel (Analytics, Speed Insights) |
| 외부 API | 한국수출입은행 환율 Open API |

## 화면 구성

| 영역 | 경로 |
|---|---|
| 게시판 | `/posts`, `/posts/category/[slug]`, `/posts/[id]`, `/posts/search`, `/posts/new` |
| 공지 | `/notices`, `/notices/[id]` |
| 회원 | `/signup`, `/login`, `/find-account`, `/reset-password`, `/mypage`, `/users/[nickname]` |
| 알림 | `/notifications` |
| 관리자 | `/admin`, `/admin/reports`, `/admin/users`, `/admin/notices` |
| 정책 | `/terms`, `/privacy`, `/about`, `/contact` |

---

## 구현하면서 고민한 것들

### 1. 인증 상태 깜빡임 제거
토큰은 HttpOnly 쿠키라 JS에서 읽을 수 없고, 클라이언트는 `/me` 응답을 받은 뒤에야 로그인 여부를 압니다.
그래서 로그인한 사용자가 `/login`에 들어오면 "로그인" 화면이 잠깐 보였다가 이동하는 문제가 있었습니다.
**Next.js Proxy(구 Middleware)**에서 쿠키 존재 여부만 보고 렌더 전에 리다이렉트해 해결했습니다. 실제 인가 검증은 백엔드가 담당하고, 프론트는 낙관적 검사만 합니다.

### 2. 서버 전용 모듈로 API 키 보호
환율 API 키는 `NEXT_PUBLIC_` 접두어를 붙이지 않아 클라이언트 번들에 포함되지 않게 했고, 서버 컴포넌트에서만 호출합니다.
`unstable_cache`로 응답을 캐싱해 영업일 1회 고시되는 데이터를 매 요청마다 부르지 않도록 했습니다.

### 3. API 레이어 분리
`lib/api/`에 도메인별 API 함수를 두고, 클라이언트용(`client.ts`)과 서버 컴포넌트용(`server.ts`) 호출을 나눴습니다.
브라우저 fetch는 쿠키를 자동으로 싣지만 서버 컴포넌트의 fetch는 그렇지 않아서, 서버 쪽에서는 요청 쿠키를 헤더로 직접 전달해야 하기 때문입니다.

### 4. 검색엔진 색인 제어
`NEXT_PUBLIC_ALLOW_INDEXING=true`일 때만 색인을 허용하도록 해서, 프리뷰 배포가 검색에 노출되지 않게 했습니다.
운영 환경에서는 sitemap과 robots.txt를 통해 Google Search Console에 등록했습니다.

---

## 프로젝트 구조

```
app/          # App Router 페이지
components/   # 도메인별 컴포넌트 (post, comment, admin, auth, layout ...)
lib/
├── api/      # 백엔드 API 호출 (도메인별)
├── auth-context.tsx
└── ...       # 포맷, 레벨, 알림, 환율 등 유틸
types/        # 공통 타입
proxy.ts      # 인증 페이지 리다이렉트
```

## 로컬 실행

```bash
npm install
npm run dev   # http://localhost:3000
```

백엔드 주소 등 환경변수는 `.env.local`에 설정합니다.
