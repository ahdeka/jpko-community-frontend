// 벚꽃 도장. 일본 학교에서 쓰는 "たいへんよくできました" 스탬프의 형태를 본떴다.
//
// 이미지가 아니라 인라인 SVG인 이유:
//  - 달력 칸(약 28px)부터 결과 모달(56px)까지 같은 모양을 크기만 바꿔 쓰는데, 벡터라야 안 뭉갠다.
//  - 색을 currentColor로 두면 다크 모드 대응이 클래스 하나로 끝난다(이미지는 색을 못 바꾼다).
//  - 네트워크 요청이 없어 달력 칸 30개에 찍혀도 비용이 0이다.

// 꽃잎 한 장. 중심(50,50)에서 왼쪽 골로 내려갔다가 바깥으로 부풀어 끝에 닿고,
// 끝에서 얕은 V홈을 만든 뒤 오른쪽으로 대칭으로 돌아온다.
// 반지름 배치가 이 모양의 전부다:
//   골 22 (±36°) · 끝 37 (±11°) · 끝의 V홈 31.5
// 골(15)이 끝 홈(5.5)보다 훨씬 깊어야 "꽃잎 5장"으로 읽힌다. 둘이 비슷해지면
// 물결 10개짜리 톱니바퀴처럼 보인다.
const PETAL = [
  'M50 50',
  'L37.1 32.2',
  'C31 26 34.5 16 42.9 13.7',
  'C45.8 16.6 47.6 18.5 50 18.5',
  'C52.4 18.5 54.2 16.6 57.1 13.7',
  'C65.5 16 69 26 62.9 32.2',
  'Z',
].join(' ')

// 72도씩 5장.
const ANGLES = [0, 72, 144, 216, 288]

// 마스크 id. 인스턴스마다 다른 id를 만들지 않고 상수를 쓴다.
//  - 모든 인스턴스의 마스크 내용이 완전히 동일하므로, id가 겹쳐도 어느 것으로 해석되든 결과가 같다.
//  - useId()를 쓰면 React 19가 «r0» 같은 특수문자를 포함한 값을 주는데, 그걸 url(#...) 참조에
//    끼워 넣는 건 불필요한 위험이다.
//  - 훅을 안 쓰므로 이 컴포넌트는 서버 컴포넌트에서도 그대로 쓸 수 있다.
const MASK_ID = 'sakura-stamp-ring'

// 안쪽을 파낼 비율. 끝에서 약 9, 골에서 약 5 두께의 띠가 남는다.
const INNER_SCALE = 0.76

interface Props {
  // 크기·색은 호출부가 클래스로 정한다(도형이 currentColor라 text-* 색이 그대로 먹는다).
  className?: string
  // 장식 요소이므로 기본은 스크린리더에서 숨긴다. 의미를 실어야 하면 라벨을 넘긴다.
  label?: string
}

function Petals() {
  return (
    <>
      {ANGLES.map(deg => (
        <path key={deg} d={PETAL} transform={`rotate(${deg} 50 50)`} />
      ))}
    </>
  )
}

export default function SakuraStamp({ className, label }: Props) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {/*
        꽃잎을 각각 '선'으로 그리면 5장이 중심에서 만나 선 10개가 별처럼 뭉치고, 하필 그 자리가
        날짜 숫자가 들어갈 곳이다. 그래서 선이 아니라 마스크로 '테두리만' 남긴다.

          흰색 = 보임, 검정 = 숨김.
          ① 전체를 검정으로 덮고
          ② 꽃잎 5장을 흰색으로 채워 꽃 실루엣(겹치는 부분도 그냥 흰색)을 만들고
          ③ 같은 꽃을 축소해 검정으로 도로 파낸다
          → 바깥 윤곽과 안쪽 윤곽 사이의 띠만 남고, 내부에 이음선이 생기지 않는다.

        반대로 '바깥으로 키운 꽃 - 원래 꽃'으로 만들면 띠 두께는 균일해지지만 오목한 곳
        (꽃잎 사이 골, 끝의 V홈)이 메워져 꽃 모양 자체가 뭉개진다. 그래서 축소 방식을 쓴다.

        두 레이어 모두 자기 색으로 얇은 stroke를 두르는데, 이게 없으면 인접한 꽃잎의 채움이
        맞닿는 경계에서 안티에일리어싱 틈이 생겨 중심에서 골로 뻗는 가짜 선이 비쳐 보인다.
      */}
      <mask id={MASK_ID}>
        <rect x="0" y="0" width="100" height="100" fill="black" />
        <g fill="white" stroke="white" strokeWidth="1.5" strokeLinejoin="round">
          <Petals />
        </g>
        {/* 중심(50,50) 기준으로 축소해야 띠가 사방으로 고르게 남는다. */}
        <g
          fill="black"
          stroke="black"
          strokeWidth="1.5"
          strokeLinejoin="round"
          transform={`translate(50 50) scale(${INNER_SCALE}) translate(-50 -50)`}
        >
          <Petals />
        </g>
      </mask>

      <rect x="0" y="0" width="100" height="100" fill="currentColor" mask={`url(#${MASK_ID})`} />
    </svg>
  )
}
