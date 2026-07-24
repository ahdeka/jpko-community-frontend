'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { usersApi } from '@/lib/api/users'
import { ApiError } from '@/lib/api/client'
import WithdrawModal from '@/components/mypage/WithdrawModal'

// 자기소개 최대 길이 — 백엔드 UpdateBioRequest @Size(max=200)와 일치시킨다.
const BIO_MAX = 200

// 입력 공통 스타일 (게시글 폼과 동일 톤)
const inputClass =
  'w-full rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-blue-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-blue-500'

// 백엔드 UpdateNicknameRequest @Pattern 미러링: 한글(완성형)·영문·숫자만 허용(공백·특수문자 불가).
const NICKNAME_RE = /^[가-힣a-zA-Z0-9]+$/

// 백엔드 에러 code를 "비밀번호 변경" 화면 맥락에 맞는 메시지로 변환한다.
// 백엔드는 에러 응답 code에 ErrorCode enum 이름(name())을 그대로 실어 보내므로,
// 로그인과 메시지를 공유하는 WRONG_PASSWORD라도 code로 구분해 맥락별 안내가 가능하다.
// (백엔드에 별도 ERROR_CODE를 추가할 필요 없음)
function passwordErrorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return '비밀번호 변경에 실패했습니다.'
  switch (err.code) {
    case 'WRONG_PASSWORD':
      return '현재 비밀번호가 일치하지 않습니다.'
    case 'SAME_AS_CURRENT_PASSWORD':
      return '새 비밀번호가 현재 비밀번호와 동일합니다.'
    case 'PASSWORD_MISMATCH':
      return '새 비밀번호가 일치하지 않습니다.'
    default:
      return err.message // 그 외에는 서버 메시지를 그대로 노출
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
      setBioMsg({ type: 'error', text: `자기소개는 ${BIO_MAX}자 이하여야 합니다.` })
      return
    }

    setBioLoading(true)
    try {
      await usersApi.updateBio(trimmed)
      // 저장된 정규화 결과(빈 값이면 삭제)를 화면에도 반영하고,
      // 다른 화면·다음 렌더가 최신 bio를 쓰도록 Context의 user도 갱신한다.
      setBio(trimmed)
      await fetchUser()
      setBioMsg({ type: 'success', text: '자기소개가 저장되었습니다.' })
    } catch (err) {
      setBioMsg({
        type: 'error',
        text: err instanceof ApiError ? err.message : '자기소개 저장에 실패했습니다.',
      })
    } finally {
      setBioLoading(false)
    }
  }

  // ===== 닉네임 변경 =====
  const [nickname, setNickname] = useState(user?.nickname ?? '')
  const [nickMsg, setNickMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [nickLoading, setNickLoading] = useState(false)

  async function handleNickname(e: React.FormEvent) {
    e.preventDefault()
    setNickMsg(null)

    const trimmed = nickname.trim()
    // 백엔드와 동일 기준(trim → 2~20자 → 한글·영문·숫자 패턴)으로 1차 검증
    if (trimmed.length < 2 || trimmed.length > 20) {
      setNickMsg({ type: 'error', text: '닉네임은 2~20자 사이여야 합니다.' })
      return
    }
    if (!NICKNAME_RE.test(trimmed)) {
      setNickMsg({ type: 'error', text: '닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.' })
      return
    }
    if (trimmed === user?.nickname) {
      setNickMsg({ type: 'error', text: '현재 닉네임과 동일합니다.' })
      return
    }

    setNickLoading(true)
    try {
      await usersApi.updateNickname(trimmed)
      // 헤더 등 다른 곳의 닉네임도 즉시 갱신되도록 사용자 정보 재조회
      await fetchUser()
      setNickMsg({ type: 'success', text: '닉네임이 변경되었습니다.' })
    } catch (err) {
      setNickMsg({
        type: 'error',
        text: err instanceof ApiError ? err.message : '닉네임 변경에 실패했습니다.',
      })
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
      setPwMsg({ type: 'error', text: '현재 비밀번호를 입력해주세요.' })
      return
    }
    if (newPassword.length < 8 || newPassword.length > 50) {
      setPwMsg({ type: 'error', text: '새 비밀번호는 8~50자 사이여야 합니다.' })
      return
    }
    if (newPassword !== newPasswordConfirm) {
      setPwMsg({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' })
      return
    }
    // "새 비번 == 현재 비번" 여부는 클라에서 raw 입력으로 판단하지 않는다.
    // (현재 비번을 틀리게 입력했는데 그 값이 새 비번과 같을 때 "현재와 동일" 같은
    //  엉뚱한 메시지가 뜨는 문제 때문) → 실제 저장된 비번과의 비교는 백엔드가
    //  현재 비번 검증을 먼저 통과한 뒤에 SAME_AS_CURRENT_PASSWORD로 판단한다.

    setPwLoading(true)
    try {
      await usersApi.updatePassword({ currentPassword, newPassword, newPasswordConfirm })
      setPwMsg({ type: 'success', text: '비밀번호가 변경되었습니다.' })
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

      {/* 닉네임 변경 */}
      <section>
        <h3 className="mb-3 text-sm font-bold text-neutral-900 dark:text-neutral-100">닉네임 변경</h3>
        <form onSubmit={handleNickname} className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="flex-1">
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              maxLength={20}
              placeholder="닉네임"
              className={inputClass}
            />
            {nickMsg && <div className="mt-1"><Notice type={nickMsg.type}>{nickMsg.text}</Notice></div>}
          </div>
          <button
            type="submit"
            disabled={nickLoading}
            className="shrink-0 rounded bg-neutral-800 px-4 py-2 text-sm text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-700 dark:hover:bg-neutral-600"
          >
            {nickLoading ? '변경 중…' : '변경'}
          </button>
        </form>
      </section>

      <div className="border-t border-neutral-100 dark:border-neutral-800" />

      {/* 비밀번호 변경 */}
      <section>
        <h3 className="mb-3 text-sm font-bold text-neutral-900 dark:text-neutral-100">비밀번호 변경</h3>
        <form onSubmit={handlePassword} className="flex max-w-md flex-col gap-3">
          <input
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            placeholder="현재 비밀번호"
            autoComplete="current-password"
            className={inputClass}
          />
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="새 비밀번호 (8~50자)"
            autoComplete="new-password"
            className={inputClass}
          />
          <input
            type="password"
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
          탈퇴 시 계정이 비활성화되며 되돌릴 수 없습니다.
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
