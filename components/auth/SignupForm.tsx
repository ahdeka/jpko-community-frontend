'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { useRedirectIfAuthenticated } from '@/lib/use-auth-guard'
import RedirectingOverlay from './RedirectingOverlay'

type FieldName =
  | 'email'
  | 'password'
  | 'passwordConfirm'
  | 'nickname'
  | 'termsAgreed'
  | 'privacyAgreed'
type FieldErrors = Partial<Record<FieldName, string>>

const inputClass =
  'w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400 dark:focus:border-blue-500'

export default function SignupForm() {
  const router = useRouter()
  // 이미 로그인한 사용자는 홈으로 돌려보낸다(뒤로가기·주소창 직접 진입 차단)
  const { blocked } = useRedirectIfAuthenticated()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [nickname, setNickname] = useState('')
  // 약관/개인정보 동의 (백엔드 @AssertTrue 미러링: 둘 다 true여야 가입 가능)
  const [termsAgreed, setTermsAgreed] = useState(false)
  const [privacyAgreed, setPrivacyAgreed] = useState(false)

  // 필드를 한 번이라도 벗어났는지(blur) 기록. 입력 "도중"에 빨간 에러가 뜨는 걸 막기 위함.
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({})
  // 제출을 한 번이라도 시도하면 모든 필드를 실시간 검증 대상으로 끌어올린다.
  const [submitted, setSubmitted] = useState(false)

  // 서버에서 내려온 에러(중복 이메일/닉네임 등)는 입력값으로부터 유도할 수 없으므로 별도 상태로 보관.
  const [serverErrors, setServerErrors] = useState<FieldErrors>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  // 비밀번호 표시 토글
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)

  // 클라이언트 검증 결과는 현재 입력값에서 매 렌더 파생된다. (백엔드 SignupRequest @Valid + AuthService 규칙 미러링)
  const clientErrors = useMemo<FieldErrors>(() => {
    const errs: FieldErrors = {}

    if (!email) {
      errs.email = '이메일을 입력해주세요.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = '이메일 형식이 올바르지 않습니다.'
    }

    if (!password) {
      errs.password = '비밀번호를 입력해주세요.'
    } else if (password.length < 8) {
      errs.password = '비밀번호는 8자 이상이어야 합니다.'
    }

    // 비밀번호 확인: 비어있는지 먼저 보고, 그 다음 일치 여부.
    // 비밀번호 자체가 비어있으면 일치 비교는 의미가 없으므로 password가 있을 때만 비교.
    if (!passwordConfirm) {
      errs.passwordConfirm = '비밀번호 확인을 입력해주세요.'
    } else if (password && password !== passwordConfirm) {
      errs.passwordConfirm = '비밀번호와 비밀번호 확인이 일치하지 않습니다.'
    }

    if (!nickname) {
      errs.nickname = '닉네임을 입력해주세요.'
    } else if (nickname.length < 2 || nickname.length > 20) {
      errs.nickname = '닉네임은 2자 이상 20자 이하여야 합니다.'
    }

    // 필수 동의 항목. 체크 해제 시 제출을 막는다(백엔드 거절 전에 클라이언트에서 선차단).
    if (!termsAgreed) {
      errs.termsAgreed = '이용약관에 동의해주세요.'
    }
    if (!privacyAgreed) {
      errs.privacyAgreed = '개인정보처리방침에 동의해주세요.'
    }

    return errs
  }, [email, password, passwordConfirm, nickname, termsAgreed, privacyAgreed])

  // "전체 동의" 체크박스 상태. 두 항목이 모두 켜져 있을 때만 켜진 것으로 본다.
  const allAgreed = termsAgreed && privacyAgreed
  function toggleAll() {
    const next = !allAgreed
    setTermsAgreed(next)
    setPrivacyAgreed(next)
  }

  // 화면에 실제로 보여줄 에러: 서버 에러 우선, 없으면 (touched 혹은 제출시도된) 클라이언트 에러.
  function visibleError(field: FieldName): string | undefined {
    if (serverErrors[field]) return serverErrors[field]
    if (touched[field] || submitted) return clientErrors[field]
    return undefined
  }

  function markTouched(field: FieldName) {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  // 값을 바꾸면 그 필드의 서버 에러는 더 이상 유효하지 않으므로 제거.
  function clearServerError(field: FieldName) {
    setServerErrors(prev => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  // 비밀번호 확인 초록 체크 표시용. 둘 다 입력되어 있고 일치하며, 표시할 에러가 없을 때만 true.
  const passwordMatched =
    passwordConfirm.length > 0 && password === passwordConfirm && !visibleError('passwordConfirm')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true) // 이 시점부터 모든 필드의 클라이언트 에러가 화면에 노출된다.
    setApiError('')

    // 클라이언트 검증을 통과 못 하면 서버로 보내지 않는다. (에러는 submitted=true 라 이미 표시됨)
    if (Object.keys(clientErrors).length > 0) {
      return
    }

    setLoading(true)
    try {
      await authApi.signup({ email, password, passwordConfirm, nickname, termsAgreed, privacyAgreed })
      router.push('/login')
    } catch (e) {
      if (e instanceof ApiError) {
        // 서버 에러는 message가 아니라 code로 분기해 해당 필드에 매핑한다.
        // (백엔드는 한 번에 하나의 에러만 내려주므로, code별로 한 곳에 표시)
        if (e.code === 'DUPLICATE_EMAIL') {
          setServerErrors(prev => ({ ...prev, email: '이미 사용 중인 이메일입니다.' }))
        } else if (e.code === 'DUPLICATE_NICKNAME') {
          setServerErrors(prev => ({ ...prev, nickname: '이미 사용 중인 닉네임입니다.' }))
        } else if (e.code === 'PASSWORD_MISMATCH') {
          // 클라이언트 선검증을 통과했더라도(예: 검증 우회) 최종 게이트로 방어
          setServerErrors(prev => ({ ...prev, passwordConfirm: e.message }))
        } else {
          // INVALID_INPUT 등 필드를 특정할 수 없는 에러는 공통 영역에 표시
          setApiError(e.message)
        }
      } else {
        setApiError('회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      }
    } finally {
      setLoading(false)
    }
  }

  const emailError = visibleError('email')
  const passwordError = visibleError('password')
  const passwordConfirmError = visibleError('passwordConfirm')
  const nicknameError = visibleError('nickname')
  const termsError = visibleError('termsAgreed')
  const privacyError = visibleError('privacyAgreed')

  // 로그인 상태로 진입(다른 탭 로그인 등) 시 리다이렉트 진행 중에는 폼 대신
  // 전체 화면 로딩 오버레이만 잠깐 보여준다(좁은 카드 안 문구 대신 뷰포트 전체 전환).
  if (blocked) {
    return <RedirectingOverlay />
  }

  return (
    <>
      <h1 className="mb-6 text-center text-xl font-bold">회원가입</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={e => {
            setEmail(e.target.value)
            clearServerError('email')
          }}
          onBlur={() => markTouched('email')}
          className={inputClass}
        />
        {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
      </div>

      <div>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="비밀번호 (8자 이상)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onBlur={() => markTouched('password')}
            className={`${inputClass} pr-10`}
          />
          <PasswordToggle
            visible={showPassword}
            onToggle={() => setShowPassword(v => !v)}
          />
        </div>
        {passwordError && <p className="text-xs text-red-500 mt-1">{passwordError}</p>}
      </div>

      <div>
        <div className="relative">
          <input
            type={showPasswordConfirm ? 'text' : 'password'}
            placeholder="비밀번호 확인"
            value={passwordConfirm}
            onChange={e => {
              setPasswordConfirm(e.target.value)
              clearServerError('passwordConfirm')
            }}
            onBlur={() => markTouched('passwordConfirm')}
            className={`${inputClass} ${passwordMatched ? 'pr-16' : 'pr-10'}`}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {passwordMatched && (
              // 입력 일치 시 초록 체크 (장식용이므로 스크린리더에서 숨김)
              <svg
                className="h-4 w-4 text-green-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            )}
            <PasswordToggle
              visible={showPasswordConfirm}
              onToggle={() => setShowPasswordConfirm(v => !v)}
              positioned={false}
            />
          </div>
        </div>
        {passwordConfirmError && (
          <p className="text-xs text-red-500 mt-1">{passwordConfirmError}</p>
        )}
        {passwordMatched && !passwordConfirmError && (
          <p className="text-xs text-green-600 dark:text-green-500 mt-1">
            비밀번호가 일치합니다.
          </p>
        )}
      </div>

      <div>
        <input
          type="text"
          placeholder="닉네임 (2~20자)"
          value={nickname}
          onChange={e => {
            setNickname(e.target.value)
            clearServerError('nickname')
          }}
          onBlur={() => markTouched('nickname')}
          className={inputClass}
        />
        {nicknameError && <p className="text-xs text-red-500 mt-1">{nicknameError}</p>}
      </div>

      {/* 약관·개인정보 동의 영역 */}
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3">
        {/* 전체 동의: 두 필수 항목을 한 번에 토글한다 */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allAgreed}
            onChange={toggleAll}
            className="h-4 w-4 accent-blue-600"
          />
          <span className="text-sm font-medium">전체 동의</span>
        </label>

        <div className="my-2.5 border-t border-neutral-200 dark:border-neutral-800" />

        <AgreementRow
          checked={termsAgreed}
          onChange={() => setTermsAgreed(v => !v)}
          error={termsError}
          href="/terms"
          label="이용약관"
        />
        <div className="mt-2">
          <AgreementRow
            checked={privacyAgreed}
            onChange={() => setPrivacyAgreed(v => !v)}
            error={privacyError}
            href="/privacy"
            label="개인정보처리방침"
          />
        </div>
      </div>

      {apiError && <p className="text-xs text-red-500">{apiError}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? '가입 중...' : '회원가입'}
      </button>

      <p className="text-xs text-center text-gray-500 dark:text-neutral-400">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
          로그인
        </Link>
      </p>
      </form>
    </>
  )
}

// 필수 동의 항목 한 줄. 체크박스 + [필수] 배지 + 약관 본문 링크(새 탭).
// 라벨 텍스트를 클릭하면 체크가 토글되지만, 링크 클릭은 페이지 이동만 하도록 분리한다.
function AgreementRow({
  checked,
  onChange,
  error,
  href,
  label,
}: {
  checked: boolean
  onChange: () => void
  error?: string
  href: string
  label: string
}) {
  return (
    <div>
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="h-4 w-4 accent-blue-600"
        />
        <span className="text-sm text-neutral-700 dark:text-neutral-300">
          <span className="text-red-500">[필수]</span>{' '}
          <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            // 링크 클릭이 라벨로 버블링돼 체크박스가 토글되는 것을 막는다
            onClick={e => e.stopPropagation()}
            className="text-blue-600 dark:text-blue-400 underline underline-offset-2"
          >
            {label}
          </Link>
          에 동의합니다.
        </span>
      </label>
      {error && <p className="text-xs text-red-500 mt-1 ml-6">{error}</p>}
    </div>
  )
}

// 비밀번호 표시/숨김 토글 버튼.
// type="button" 필수 — 기본값(submit)이면 클릭 시 폼이 제출돼버린다.
// positioned=true 면 input 우측에 단독 배치, false 면 부모 flex 안에 들어간다(체크 아이콘과 나란히).
function PasswordToggle({
  visible,
  onToggle,
  positioned = true,
}: {
  visible: boolean
  onToggle: () => void
  positioned?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? '비밀번호 숨기기' : '비밀번호 표시'}
      className={`${
        positioned ? 'absolute right-2 top-1/2 -translate-y-1/2 ' : ''
      }text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200`}
    >
      {visible ? (
        // eye-off
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      ) : (
        // eye
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  )
}
