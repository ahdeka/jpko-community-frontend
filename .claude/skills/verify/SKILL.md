---
name: verify
description: Run the jpko-community frontend against the real backend to observe a change end-to-end.
---

# Verifying jpko-community-frontend

이 프론트는 백엔드(jpko-community, Spring Boot)와 Postgres 없이는 아무것도 검증할 수 없다.
세 개를 모두 띄운 뒤 실제 요청을 구동한다.

## 1. Postgres

이미 떠 있는 경우가 많다. 확인:

```bash
docker ps --format "{{.Names}}"        # jpko-postgres 가 있으면 그대로 사용
docker exec jpko-postgres psql -U jpko -d jpko_community -c "\dt"
```

계정은 `jpko` / DB는 `jpko_community` (docker-compose.yml + 백엔드 .env).

## 2. 백엔드

**반드시 GraalVM 21로 실행한다.** 기본 JDK(25/26)로는 Gradle이 죽는다.

```powershell
# PowerShell 툴 사용 (Bash로 JAVA_HOME을 넘기면 경로 형식이 안 맞아 실패)
Set-Location "C:\Users\3031426\Desktop\Github\jpko-community"
$env:JAVA_HOME = "C:\Users\3031426\.jdks\graalvm-ce-21.0.2"
.\gradlew.bat bootRun --console=plain
```

준비 확인: `until curl -s -m 3 http://localhost:8080/api/categories >/dev/null; do sleep 2; done`

## 3. 프론트

```bash
npx next dev          # http://localhost:3000, .env.local 의 NEXT_PUBLIC_API_URL=http://localhost:8080
```

## 4. 구동

시드 계정(DevDataInitializer, 비밀번호 전부 `test1234`):

- `admin@test.com` — 관리자
- `user1@test.com` ~ `user9@test.com` — 일반 회원

쿠키 세션이라 `curl -c/-b` 로 jar를 물려 쓴다:

```bash
curl -s -c a.jar -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" -d '{"email":"admin@test.com","password":"test1234"}'
curl -s -b a.jar "http://localhost:8080/api/admin/reports/summary?page=0&size=20&status=PENDING"
```

## 함정

- **Git Bash가 URL 경로를 Windows 경로로 바꾼다.** `curl http://localhost:3000/posts/1` 이
  `C:/Program Files/Git/posts/1` 로 깨진다. `export MSYS_NO_PATHCONV=1` 를 먼저 실행할 것.
- **Playwright는 설치되지 않는다** — npm registry가 `SELF_SIGNED_CERT_IN_CHAIN`으로 막힌다(사내 프록시).
  브라우저 자동화가 필요하면 다른 수단을 찾거나, API 계약 + 페이지 응답으로 대체 검증한다.
- **DB를 건드렸으면 되돌린다.** 게시글·댓글은 소프트 삭제라 `deleted_at = NULL` 로 복구된다.
- 백엔드 로그는 `bootRun` 출력을 파일로 리다이렉트해서 봐야 스택트레이스가 잡힌다.
