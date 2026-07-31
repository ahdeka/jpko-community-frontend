'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import Script from 'next/script'

// ── Cloudflare Turnstile 전역 API 타입 선언 ───────────────────────────────
// api.js가 로드되면 window.turnstile 에 아래 함수들이 붙는다. 우리가 쓰는 것만 선언한다.
interface TurnstileRenderOptions {
  sitekey: string
  // 사용자가 챌린지를 통과하면 호출된다. token은 백엔드로 보내 siteverify로 검증한다(단 1회용).
  callback?: (token: string) => void
  // 발급된 token이 만료(기본 약 300초)되면 호출. 만료된 token은 서버 검증에 실패하므로 폐기해야 한다.
  'expired-callback'?: () => void
  // 챌린지 렌더/실행 중 오류(네트워크 등) 시 호출.
  'error-callback'?: () => void
  theme?: 'light' | 'dark' | 'auto'
  language?: string
}

interface TurnstileApi {
  // 컨테이너에 위젯을 렌더하고 위젯 ID(문자열)를 돌려준다.
  render: (container: string | HTMLElement, options: TurnstileRenderOptions) => string
  // 위젯을 초기 상태로 되돌려 새 챌린지를 다시 실행시킨다(소비된 token 재발급용).
  reset: (widgetId?: string) => void
  // 위젯을 DOM에서 제거한다(언마운트/재렌더 정리용).
  remove: (widgetId?: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

// 명시적 렌더 모드. 이 파라미터가 있어야 스크립트가 자동으로 아무 요소나 렌더하지 않고,
// 우리가 원하는 시점/컨테이너에 window.turnstile.render()로 직접 렌더할 수 있다.
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

// 빌드 타임에 인라인되는 공개 site key. 없으면 위젯을 렌더할 수 없다(= 가입 불가, fail-closed).
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

// 부모가 ref로 호출할 수 있는 명령형 메서드.
export interface TurnstileHandle {
  // 서버 제출이 실패했을 때(= token이 소비/무효화됐을 때) 새 token을 받기 위해 위젯을 리셋한다.
  reset: () => void
}

interface TurnstileProps {
  // 챌린지 통과 시 새 token을 부모로 전달.
  onVerify: (token: string) => void
  // token 만료 시. 부모는 보관 중이던 token을 비워야 한다(만료 token으로 제출하면 서버가 거절).
  onExpire?: () => void
  // 위젯 오류 시. 부모는 token을 비우고 필요하면 안내를 노출한다.
  onError?: () => void
  className?: string
}

// 현재 문서 테마를 읽는다. 이 앱은 <html data-theme="light|dark">(수동 토글) 전략이라
// Turnstile의 'auto'(OS 설정 추종)와 어긋날 수 있어, 실제 앱 테마를 직접 읽어 맞춘다.
function currentTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
}

/**
 * Cloudflare Turnstile 위젯.
 *
 * 렌더 흐름:
 *  1) next/script로 api.js를 로드한다(이미 로드돼 있으면 재로드하지 않음 → 마운트 시 window.turnstile 존재 여부로 즉시 렌더).
 *  2) 스크립트 준비 완료 + 컨테이너 존재 시 window.turnstile.render()로 위젯을 심는다.
 *  3) 사용자가 통과하면 callback으로 token을 받아 onVerify로 올린다.
 *
 * 엣지케이스 처리:
 *  - 중복 렌더 방지: widgetId를 ref로 추적해, 이미 렌더됐으면 다시 render()하지 않는다(StrictMode 이중 마운트 대비).
 *  - 언마운트 정리: 위젯을 remove()해 DOM/리스너 누수를 막는다.
 *  - 테마 변경 추종: <html data-theme> 변화를 MutationObserver로 감지해 위젯을 remove 후 재렌더한다
 *    (Turnstile은 렌더 후 테마 변경 API가 없어 재렌더가 유일한 방법).
 *  - 콜백 최신값 유지: onVerify/onExpire/onError를 ref에 담아, 부모가 콜백을 매 렌더 새로 넘겨도
 *    렌더 이펙트가 재실행(위젯 재생성)되지 않도록 한다.
 */
const Turnstile = forwardRef<TurnstileHandle, TurnstileProps>(function Turnstile(
  { onVerify, onExpire, onError, className },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [scriptReady, setScriptReady] = useState(false)

  // 콜백은 ref로 보관해 항상 최신 참조를 부르되, 렌더 이펙트의 의존성에선 제외한다.
  const onVerifyRef = useRef(onVerify)
  const onExpireRef = useRef(onExpire)
  const onErrorRef = useRef(onError)
  useEffect(() => {
    onVerifyRef.current = onVerify
    onExpireRef.current = onExpire
    onErrorRef.current = onError
  })

  // 마운트 시점에 스크립트가 이미 로드돼 있으면(예: /signup 재진입) onLoad를 기다리지 않고 바로 준비 완료로 본다.
  useEffect(() => {
    if (window.turnstile) setScriptReady(true)
  }, [])

  // 위젯을 실제로 그린다. 이미 그려져 있으면(중복) 아무것도 하지 않는다.
  const renderWidget = useCallback(() => {
    if (!SITE_KEY || !window.turnstile || !containerRef.current) return
    if (widgetIdRef.current !== null) return
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      theme: currentTheme(),
      language: 'ko',
      callback: token => onVerifyRef.current(token),
      'expired-callback': () => onExpireRef.current?.(),
      'error-callback': () => onErrorRef.current?.(),
    })
  }, [])

  // 그려진 위젯을 제거하고 ref를 비운다(정리/재렌더 공통).
  const removeWidget = useCallback(() => {
    if (widgetIdRef.current !== null && window.turnstile) {
      window.turnstile.remove(widgetIdRef.current)
    }
    widgetIdRef.current = null
  }, [])

  // 스크립트가 준비되면 위젯을 렌더하고, 테마 변경을 감시한다.
  useEffect(() => {
    if (!scriptReady) return

    renderWidget()

    // 앱 테마(data-theme) 변경 시 위젯을 새 테마로 재렌더한다.
    const observer = new MutationObserver(() => {
      removeWidget()
      renderWidget()
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    return () => {
      observer.disconnect()
      removeWidget()
    }
  }, [scriptReady, renderWidget, removeWidget])

  // 부모(SignupForm)가 제출 실패 후 새 token을 받기 위해 호출한다.
  useImperativeHandle(ref, () => ({
    reset: () => {
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current)
      }
    },
  }))

  // site key가 없으면(환경변수 누락) 위젯을 띄울 수 없다. 조용히 실패하면 원인 파악이 어려우므로 안내한다.
  if (!SITE_KEY) {
    return (
      <p className="text-xs text-red-500">
        보안 문자 설정이 누락되어 회원가입을 진행할 수 없습니다. 관리자에게 문의해주세요.
      </p>
    )
  }

  return (
    <>
      <Script
        src={SCRIPT_SRC}
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div ref={containerRef} className={className} />
    </>
  )
})

export default Turnstile
