'use client'

import { useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { usersApi } from '@/lib/api/users'
import { ApiError } from '@/lib/api/client'
import { MESSAGES } from '@/lib/messages'
import { formatDate, formatRemainingTime } from '@/lib/format'
import {
  NICKNAME_RE,
  NICKNAME_MIN,
  NICKNAME_MAX,
  NICKNAME_COOLDOWN_DAYS,
  isBlacklistedNickname,
  getNicknameCooldown,
} from '@/lib/nickname'
import WithdrawModal from '@/components/mypage/WithdrawModal'
import PasswordInput from '@/components/common/PasswordInput'

// 자기소개 최대 길이 — 백엔드 UpdateBioRequest @Size(max=200)와 일치시킨다.
const BIO_MAX = 200

// 입력 공통 스타일 (게시글 폼과 동일 톤)
const inputClass =
  'w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-blue-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-blue-500'

// 백엔드 에러 code를 "비밀번호 변경" 화면 맥락에 맞는 메시지로 변환한다.
// 백엔드는 에러 응답 code에 ErrorCode enum 이름(name())을 그대로 실어 보내므로,
// 로그인과 메시지를 공유하는 WRONG_PASSWORD라도 code로 구분해 맥락별 안내가 가능하다.
// (백엔드에 별도 ERROR_CODE를 추가할 필요 없음)
function passwordErrorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return MESSAGES.mypage.profileSettings.passwordChangeFailedGeneric
  switch (err.code) {
    case 'WRONG_PASSWORD':
      return MESSAGES.mypage.profileSettings.wrongCurrentPassword
    case 'SAME_AS_CURRENT_PASSWORD':
      return MESSAGES.mypage.profileSettings.sameAsCurrentPassword
    case 'PASSWORD_MISMATCH':
      return MESSAGES.mypage.profileSettings.passwordMismatch
    default:
      return err.message // 그 외에는 서버 메시지를 그대로 노출
  }
}

// 백엔드 에러 code를 "닉네임 변경" 맥락의 메시지로 변환한다(비밀번호 쪽과 같은 방식).
// 백엔드 UserService.validateNewNickname의 검사 순서와 1:1로 대응한다.
function nicknameErrorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return MESSAGES.mypage.profileSettings.nicknameChangeFailed
  switch (err.code) {
    case 'SAME_AS_CURRENT_NICKNAME':
      return MESSAGES.mypage.profileSettings.nicknameSameAsCurrent
    case 'BLACKLIST_NICKNAME':
      return MESSAGES.mypage.profileSettings.nicknameBlacklisted
    case 'NICKNAME_CHANGE_COOLDOWN':
      return MESSAGES.mypage.profileSettings.nicknameCooldownRejected(NICKNAME_COOLDOWN_DAYS)
    case 'DUPLICATE_NICKNAME':
      return MESSAGES.mypage.profileSettings.nicknameDuplicate
    default:
      return err.message || MESSAGES.mypage.profileSettings.nicknameChangeFailed
  }
}

// 작은 알림 박스 (성공/실패)
function Notice({ type, children }: { type: 'success' | 'error'; children: React.ReactNode }) {
  const color =
    type === 'success'
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-500'
  return <p className={`text-xs ${color}`}>{children}</p>
}

export default function ProfileSettings() {
  const { user, fetchUser } = useAuth()

  // ===== 자기소개(bio) 변경 =====
  // 현재 값은 /api/auth/me가 내려주는 user.bio에서 바로 가져온다(Context). 이 컴포넌트는
  // 마이페이지의 user 확인(로그인 가드) 이후에만 렌더되므로 마운트 시점에 user가 이미 있다.
  const [bio, setBio] = useState(user?.bio ?? '')
  const [bioMsg, setBioMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [bioLoading, setBioLoading] = useState(false)

  async function handleBio(e: React.FormEvent) {
    e.preventDefault()
    setBioMsg(null)

    // 백엔드와 동일 기준(trim 후 길이)으로 1차 검증. 빈 값은 허용(= 자기소개 삭제).
    const trimmed = bio.trim()
    if (trimmed.length > BIO_MAX) {
      setBioMsg({ type: 'error', text: MESSAGES.mypage.profileSettings.bioTooLong(BIO_MAX) })
      return
    }

    setBioLoading(true)
    try {
      await usersApi.updateBio(trimmed)
      // 저장된 정규화 결과(빈 값이면 삭제)를 화면에도 반영하고,
      // 다른 화면·다음 렌더가 최신 bio를 쓰도록 Context의 user도 갱신한다.
      setBio(trimmed)
      await fetchUser()
      setBioMsg({ type: 'success', text: MESSAGES.mypage.profileSettings.bioSaved })
    } catch (err) {
      setBioMsg({
        type: 'error',
        text: err instanceof ApiError ? err.message : MESSAGES.mypage.profileSettings.bioSaveFailed,
      })
    } finally {
      setBioLoading(false)
    }
  }

  // ===== 닉네임 변경 =====
  const [nickname, setNickname] = useState(user?.nickname ?? '')
  const [nickMsg, setNickMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [nickLoading, setNickLoading] = useState(false)

  // 닉네임 변경 쿨타임(마지막 변경 + 30일). 잠금 여부는 서버가 내려준 시각으로만 판단한다.
  //
  // 이 값은 렌더 시점에 한 번 계산되므로, 화면을 띄워둔 채 쿨타임이 끝나면 잠금이 저절로 풀리진
  // 않는다(새로고침하거나 fetchUser()가 돌면 갱신됨). 30일 단위 제약이라 타이머까지 두지 않았다.
  const cooldown = useMemo(
    () => getNicknameCooldown(user?.nicknameChangeableAt),
    [user?.nicknameChangeableAt]
  )

  async function handleNickname(e: React.FormEvent) {
    e.preventDefault()
    setNickMsg(null)

    // 폼은 잠겨 있지만 엔터 제출 등으로 들어올 수 있어 한 번 더 막는다(서버도 막지만 왕복을 아낌).
    if (cooldown.locked && cooldown.until) {
      setNickMsg({
        type: 'error',
        text: MESSAGES.mypage.profileSettings.nicknameCooldownLocked(
          formatDate(cooldown.until),
          formatRemainingTime(cooldown.until)
        ),
      })
      return
    }

    const trimmed = nickname.trim()
    // 백엔드와 동일 기준(trim → 2~20자 → 한글·영문·숫자 패턴 → 금칙어)으로 1차 검증.
    // 순서도 백엔드 validateNewNickname과 맞춰, 같은 입력에 같은 메시지가 나오게 한다.
    if (trimmed.length < NICKNAME_MIN || trimmed.length > NICKNAME_MAX) {
      setNickMsg({ type: 'error', text: MESSAGES.mypage.profileSettings.nicknameLength })
      return
    }
    if (!NICKNAME_RE.test(trimmed)) {
      setNickMsg({ type: 'error', text: MESSAGES.mypage.profileSettings.nicknamePattern })
      return
    }
    if (trimmed === user?.nickname) {
      setNickMsg({ type: 'error', text: MESSAGES.mypage.profileSettings.nicknameSameAsCurrent })
      return
    }
    if (isBlacklistedNickname(trimmed)) {
      setNickMsg({ type: 'error', text: MESSAGES.mypage.profileSettings.nicknameBlacklisted })
      return
    }

    // 성공하면 30일간 되돌릴 수 없으므로 마지막으로 한 번 확인받는다.
    const confirmed = window.confirm(
      MESSAGES.mypage.profileSettings.nicknameChangeConfirm(trimmed, NICKNAME_COOLDOWN_DAYS)
    )
    if (!confirmed) return

    setNickLoading(true)
    try {
      await usersApi.updateNickname(trimmed)
      // 헤더 등 다른 곳의 닉네임도 즉시 갱신되도록 사용자 정보 재조회.
      // 이때 새 nicknameChangeableAt도 함께 와서 폼이 곧바로 쿨타임 잠금 상태로 바뀐다.
      await fetchUser()
      setNickMsg({ type: 'success', text: MESSAGES.mypage.profileSettings.nicknameChanged })
    } catch (err) {
      // 쿨타임 거부는 화면이 알고 있던 상태가 서버와 어긋났다는 뜻이다(기기 시계 오차,
      // 다른 탭에서 먼저 변경 등). 서버 기준 값을 다시 받아 폼 잠금을 맞춰준다.
      // 여기서 실패하더라도 아래 에러 메시지는 그대로 보여줘야 하므로 무시한다.
      if (err instanceof ApiError && err.code === 'NICKNAME_CHANGE_COOLDOWN') {
        await fetchUser().catch(() => {})
      }
      setNickMsg({ type: 'error', text: nicknameErrorMessage(err) })
    } finally {
      setNickLoading(false)
    }
  }

  // ===== 회원 탈퇴 =====
  const [withdrawOpen, setWithdrawOpen] = useState(false)

  // ===== 비밀번호 변경 =====
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [pwLoading, setPwLoading] = useState(false)

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwMsg(null)

    // 백엔드 검증 전에 클라이언트에서 즉시 걸러 불필요한 요청 방지
    if (!currentPassword) {
      setPwMsg({ type: 'error', text: MESSAGES.mypage.profileSettings.currentPasswordRequired })
      return
    }
    if (newPassword.length < 8 || newPassword.length > 50) {
      setPwMsg({ type: 'error', text: MESSAGES.mypage.profileSettings.newPasswordLength })
      return
    }
    if (newPassword !== newPasswordConfirm) {
      setPwMsg({ type: 'error', text: MESSAGES.mypage.profileSettings.passwordMismatch })
      return
    }
    // "새 비번 == 현재 비번" 여부는 클라에서 raw 입력으로 판단하지 않는다.
    // (현재 비번을 틀리게 입력했는데 그 값이 새 비번과 같을 때 "현재와 동일" 같은
    //  엉뚱한 메시지가 뜨는 문제 때문) → 실제 저장된 비번과의 비교는 백엔드가
    //  현재 비번 검증을 먼저 통과한 뒤에 SAME_AS_CURRENT_PASSWORD로 판단한다.

    setPwLoading(true)
    try {
      await usersApi.updatePassword({ currentPassword, newPassword, newPasswordConfirm })
      setPwMsg({ type: 'success', text: MESSAGES.mypage.profileSettings.passwordChanged })
      // 성공 시 입력값 비우기 (민감정보를 화면에 남기지 않음)
      setCurrentPassword('')
      setNewPassword('')
      setNewPasswordConfirm('')
    } catch (err) {
      setPwMsg({ type: 'error', text: passwordErrorMessage(err) })
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* 자기소개 변경 */}
      <section>
        <h3 className="mb-3 text-sm font-bold text-neutral-900 dark:text-neutral-100">자기소개</h3>
        <form onSubmit={handleBio} className="flex max-w-md flex-col gap-2">
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            maxLength={BIO_MAX}
            rows={3}
            placeholder="자기소개를 입력하세요 (선택)"
            className={`${inputClass} resize-y`}
          />
          <div className="flex items-center justify-between">
            {/* 남은/입력 글자 수 표시 (백엔드 상한과 동일한 200자 기준) */}
            <span className="text-xs text-neutral-400 dark:text-neutral-500">
              {bio.length}/{BIO_MAX}
            </span>
            {bioMsg && <Notice type={bioMsg.type}>{bioMsg.text}</Notice>}
          </div>
          <button
            type="submit"
            disabled={bioLoading}
            className="self-start rounded bg-neutral-800 px-4 py-2 text-sm text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-700 dark:hover:bg-neutral-600"
          >
            {bioLoading ? '저장 중…' : '자기소개 저장'}
          </button>
        </form>
      </section>

      <div className="border-t border-neutral-100 dark:border-neutral-800" />

      {/* 닉네임 변경 — 한 번 바꾸면 30일간 잠기므로, 잠금 상태와 그 이유를 항상 폼 옆에 같이 보여준다. */}
      <section>
        <h3 className="mb-3 text-sm font-bold text-neutral-900 dark:text-neutral-100">닉네임 변경</h3>
        <form onSubmit={handleNickname} className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="flex-1">
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              maxLength={NICKNAME_MAX}
              placeholder="닉네임"
              disabled={cooldown.locked}
              // 잠금 중에는 입력 자체를 막고, 왜 못 쓰는지는 폼 아래 안내 문구가 설명한다.
              className={`${inputClass} disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-400 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-500`}
            />
            {nickMsg && <div className="mt-1"><Notice type={nickMsg.type}>{nickMsg.text}</Notice></div>}
          </div>
          <button
            type="submit"
            disabled={nickLoading || cooldown.locked}
            className="shrink-0 rounded bg-neutral-800 px-4 py-2 text-sm text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-700 dark:hover:bg-neutral-600"
          >
            {nickLoading ? '변경 중…' : '변경'}
          </button>
        </form>
        {/* 잠금 중이면 언제 풀리는지, 아니면 바꾸면 어떤 제약이 생기는지 — 둘 중 하나는 항상 보인다. */}
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          {cooldown.locked && cooldown.until
            ? MESSAGES.mypage.profileSettings.nicknameCooldownLocked(
                formatDate(cooldown.until),
                formatRemainingTime(cooldown.until)
              )
            : MESSAGES.mypage.profileSettings.nicknameCooldownWarning(NICKNAME_COOLDOWN_DAYS)}
        </p>
      </section>

      <div className="border-t border-neutral-100 dark:border-neutral-800" />

      {/* 비밀번호 변경 */}
      <section>
        <h3 className="mb-3 text-sm font-bold text-neutral-900 dark:text-neutral-100">비밀번호 변경</h3>
        <form onSubmit={handlePassword} className="flex max-w-md flex-col gap-3">
          <PasswordInput
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            placeholder="현재 비밀번호"
            autoComplete="current-password"
            className={inputClass}
          />
          <PasswordInput
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="새 비밀번호 (8~50자)"
            autoComplete="new-password"
            className={inputClass}
          />
          <PasswordInput
            value={newPasswordConfirm}
            onChange={e => setNewPasswordConfirm(e.target.value)}
            placeholder="새 비밀번호 확인"
            autoComplete="new-password"
            className={inputClass}
          />
          {pwMsg && <Notice type={pwMsg.type}>{pwMsg.text}</Notice>}
          <button
            type="submit"
            disabled={pwLoading}
            className="self-start rounded bg-neutral-800 px-4 py-2 text-sm text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-700 dark:hover:bg-neutral-600"
          >
            {pwLoading ? '변경 중…' : '비밀번호 변경'}
          </button>
        </form>
      </section>

      <div className="border-t border-neutral-100 dark:border-neutral-800" />

      {/* 회원 탈퇴 (위험 구역) — 되돌릴 수 없는 작업이라 시각적으로 구분하고,
          실제 확인/처리는 모달에서만 진행한다. */}
      <section>
        <h3 className="mb-1 text-sm font-bold text-red-600 dark:text-red-500">회원 탈퇴</h3>
        <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
          {MESSAGES.mypage.profileSettings.withdrawNotice}
        </p>
        <button
          type="button"
          onClick={() => setWithdrawOpen(true)}
          className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-500/40 dark:text-red-500 dark:hover:bg-red-500/10"
        >
          회원 탈퇴
        </button>
      </section>

      <WithdrawModal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} />
    </div>
  )
}
