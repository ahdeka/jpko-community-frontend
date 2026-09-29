'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { useAuth } from '@/lib/auth-context'
import { useRedirectIfAuthenticated } from '@/lib/use-auth-guard'
import { MESSAGES } from '@/lib/messages'
import RedirectingOverlay from './RedirectingOverlay'
import Turnstile, { type TurnstileHandle } from './Turnstile'

interface FieldErrors {
  // 아이디 입력 칸의 에러.
  loginId?: string
  password?: string
  // 위젯이 아직 토큰을 내주지 않았거나(로딩 중) 챌린지가 끝나지 않은 상태로 제출한 경우.
  turnstile?: string
}

const inputClass =
  'w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400 dark:focus:border-blue-500'

export default function LoginForm() {
  const router = useRouter()
  const { fetchUser } = useAuth()
  // 이미 로그인한 사용자는 홈으로 돌려보낸다(뒤로가기·주소창 직접 진입 차단)
  const { blocked } = useRedirectIfAuthenticated()
  // 로그인 아이디. 이메일 로그인은 백엔드에서 제거돼 더 이상 받지 않는다.
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  // Cloudflare Turnstile 통과 시 발급되는 1회용 토큰. 백엔드 LoginRequest의 @NotBlank를 미러링한다.
  // 만료(약 300초)·오류 시에는 빈 문자열로 되돌려, 무효한 토큰으로 제출하는 일이 없게 한다.
  const [turnstileToken, setTurnstileToken] = useState('')
  // 제출 실패 후 위젯에 새 챌린지를 다시 돌리기 위한 명령형 핸들.
  const turnstileRef = useRef<TurnstileHandle>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  function validate(): FieldErrors {
    const errs: FieldErrors = {}
    if (!loginId.trim()) errs.loginId = MESSAGES.auth.login.identifierRequired
    if (!password) errs.password = MESSAGES.auth.login.passwordRequired
    // 토큰이 없으면 서버는 어차피 400(INVALID_INPUT)을 준다. 왕복하기 전에 여기서 막고 이유를 알린다.
    if (!turnstileToken) errs.turnstile = MESSAGES.auth.login.turnstileRequired
    return errs
  }

  // 위젯이 챌린지를 통과해 새 토큰을 줬을 때. 토큰을 보관하고, 남아 있던 안내 문구를 지운다.
  // (제출이 토큰보다 빨랐던 경우 — 위젯은 보통 1초 안팎이라 흔하다 — 문구가 계속 남는 걸 막는다.)
  function handleVerify(token: string) {
    setTurnstileToken(token)
    setFieldErrors(prev => (prev.turnstile ? { ...prev, turnstile: undefined } : prev))
  }

  // 보관 중이던 토큰을 버리고 위젯에 새 챌린지를 돌린다.
  // 순서가 중요하다: state를 먼저 비워야, 새 토큰이 도착하기 전에 다시 제출되더라도
  // validate()가 소진된 토큰을 통과시키지 않는다.
  function resetTurnstile() {
    setTurnstileToken('')
    turnstileRef.current?.reset()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setApiError('')

    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      return
    }
    setFieldErrors({})

    setLoading(true)
    try {
      // 백엔드 LoginRequest가 loginId를 trim().toLowerCase()로 정규화하므로,
      // 저장된 값과 확실히 매칭되도록 전송값도 동일하게 맞춘다(대소문자·공백 차이로 인한 실패 방지).
      // 정지(SUSPENDED)된 계정도 여기서 막히지 않는다 — 로그인은 되고, fetchUser() 이후 AuthProvider가
      // 전역 SuspendedScreen으로 전환한다(그 화면에서 할 수 있는 건 상황 확인·문의·로그아웃뿐이며,
      // 해제는 관리자만 한다).
      // 응답 본문(nickname/role)은 쓰지 않는다 — 인증 상태는 바로 아래 fetchUser()가
      // /api/auth/me로 다시 받아오는 값을 단일 출처로 삼는다.
      await authApi.login({
        loginId: loginId.trim().toLowerCase(),
        password,
        turnstileToken,
      })
      await fetchUser()
      // replace로 이동해 히스토리에 로그인 페이지를 남기지 않는다.
      router.replace('/')
    } catch (e) {
      // ⚠️ 실패 원인과 무관하게 항상 위젯을 리셋한다.
      //    Turnstile 토큰은 1회용(siteverify 1회 호출로 소진)이고, 백엔드는 비밀번호 검증보다
      //    *먼저* 캡차를 검증한다. 즉 비밀번호를 틀린 요청에서도 토큰은 이미 소진된 상태다.
      //    리셋하지 않으면 두 번째 시도부터 WRONG_PASSWORD가 아니라 CAPTCHA_FAILED로 계속 실패한다.
      //    (회원가입과 달리 로그인은 재시도가 일상이라, 이걸 빠뜨리면 사실상 로그인이 1회용이 된다.)
      resetTurnstile()

      if (e instanceof ApiError) {
        if (e.code === 'WRONG_PASSWORD' || e.code === 'USER_NOT_FOUND') {
          setApiError(MESSAGES.auth.login.invalidCredentials)
        } else if (e.code === 'CAPTCHA_FAILED') {
          // 토큰 소진·만료·위조, 또는 Cloudflare 응답 실패(백엔드가 fail-closed로 처리).
          // 위젯은 방금 리셋했으므로 새 토큰이 도착하면 그대로 다시 제출하면 된다.
          setApiError(MESSAGES.auth.login.captchaFailed)
        } else {
          // INVALID_INPUT(Bean Validation 실패) 포함. 백엔드가 걸린 필드의 메시지를 그대로 실어주므로
          // 여기서 일반 문구로 덮어쓰지 않는 편이 더 구체적이다.
          setApiError(e.message)
        }
      } else {
        // ApiError가 아닌 예외(네트워크 단절, 파싱 실패 등).
        // else가 없던 기존 코드에서는 아무 안내도 뜨지 않고 버튼만 원복돼,
        // 유저에게는 "눌렀는데 아무 일도 안 일어남"으로 보였다.
        setApiError(MESSAGES.auth.login.networkError)
      }
    } finally {
      setLoading(false)
    }
  }

  // 로그인 직후(또는 다른 탭에서 로그인) 리다이렉트 진행 중에는 폼 대신
  // 전체 화면 로딩 오버레이만 잠깐 보여준다. 좁은 카드 안에 문구를 넣지 않고
  // 뷰포트 전체를 덮어, 자연스러운 페이지 전환처럼 보이게 한다.
  if (blocked) {
    return <RedirectingOverlay />
  }

  return (
    <>
      <h1 className="mb-6 text-center text-xl font-bold">로그인</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <input
          type="text"
          placeholder="아이디"
          value={loginId}
          onChange={e => setLoginId(e.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="username"
          className={inputClass}
        />
        {fieldErrors.loginId && (
          <p className="text-xs text-red-500 mt-1">{fieldErrors.loginId}</p>
        )}
      </div>

      <div>
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className={inputClass}
        />
        {fieldErrors.password && (
          <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>
        )}
      </div>

      {/* 봇 방지(Cloudflare Turnstile). 통과 시 토큰을 저장하고, 만료/오류 시 비운다.
          site key가 없으면 위젯 대신 안내 문구가 렌더된다(fail-closed — 로그인 불가). */}
      <div>
        <Turnstile
          ref={turnstileRef}
          onVerify={handleVerify}
          onExpire={() => setTurnstileToken('')}
          onError={() => setTurnstileToken('')}
          fallbackMessage={MESSAGES.auth.login.turnstileMisconfigured}
        />
        {fieldErrors.turnstile && (
          <p className="text-xs text-red-500 mt-1">{fieldErrors.turnstile}</p>
        )}
      </div>

      {apiError && (
        <p className="text-xs text-red-500">{apiError}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '로그인 중...' : '로그인'}
      </button>

      <div className="flex items-center justify-center gap-3 text-sm">
        <Link
          href="/signup"
          className="text-center text-blue-600 hover:underline dark:text-blue-400"
        >
          계정 만들기
        </Link>
        <span className="text-neutral-300 dark:text-neutral-700">|</span>
        <Link
          href="/forgot-password"
          className="text-center text-neutral-500 hover:underline dark:text-neutral-400"
        >
          아이디/비밀번호 찾기
        </Link>
      </div>
      </form>
    </>
  )
}
