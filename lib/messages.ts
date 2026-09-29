// 사용자에게 보이는 "동적 안내/알림" 문구의 단일 출처.
// 토스트·에러·모달 본문·빈 상태·확인창(confirm) 등 상황을 설명하는 문구만 모은다.
// 버튼 라벨, 네비게이션, 페이지 제목 같은 정적 UI 텍스트는 각 컴포넌트에 그대로 둔다.
//
// 여기서 값을 바꾸면 앱 전체에 즉시 반영된다. 문구만 고칠 때는 이 파일만 건드리면 된다.

export const MESSAGES = {
  common: {
    requestFailed: '요청에 실패했습니다.',
    fileTooLarge: '파일 용량이 너무 큽니다. 더 작은 파일로 다시 시도해주세요.',
    apiUrlMissing: 'NEXT_PUBLIC_API_URL 환경 변수가 설정되지 않았습니다.',
    unsavedChangesConfirm:
      '작성 중인 내용이 있습니다.\n페이지를 벗어나면 저장되지 않은 변경 사항이 사라집니다. 이동하시겠습니까?',
    loginRequiredToReport: '신고하려면 로그인이 필요합니다.',
    errorBoundary: {
      title: '문제가 발생했습니다',
      description: '일시적인 오류일 수 있습니다. 잠시 후 다시 시도해주세요.',
    },
    globalError: {
      title: '일시적인 오류가 발생했습니다',
      description: '잠시 후 다시 시도해주세요. 문제가 계속되면 잠시 뒤 다시 방문해주세요.',
    },
    notFound: {
      title: '페이지를 찾을 수 없습니다',
      description: '요청하신 페이지가 없거나 이동·삭제되었을 수 있습니다.',
    },
  },

  auth: {
    login: {
      // 로그인 식별자는 아이디 또는 이메일 둘 다 허용한다.
      identifierRequired: '아이디 또는 이메일을 입력해주세요.',
      passwordRequired: '비밀번호를 입력해주세요.',
      invalidCredentials: '아이디(또는 이메일) 또는 비밀번호가 올바르지 않습니다.',
      // Turnstile 위젯이 아직 토큰을 안 준 상태로 제출한 경우(로딩 중이거나 챌린지 미완료).
      turnstileRequired: '보안 문자 인증을 완료해주세요.',
      // 백엔드 CAPTCHA_FAILED — 토큰 소진(1회용)·만료·위조. 위젯은 이미 리셋된 뒤라 재시도하면 된다.
      captchaFailed: '보안 문자 인증에 실패했습니다. 다시 시도해주세요.',
      // NEXT_PUBLIC_TURNSTILE_SITE_KEY 누락 — 위젯을 못 띄우므로 로그인 자체가 불가(fail-closed).
      turnstileMisconfigured: '보안 문자 설정이 누락되어 로그인을 진행할 수 없습니다. 관리자에게 문의해주세요.',
      // ApiError가 아닌 예외(네트워크 단절, Turnstile 스크립트 로드 실패 등).
      networkError: '로그인 중 오류가 발생했습니다. 네트워크 상태를 확인한 뒤 다시 시도해주세요.',
    },
    // 신규 가입 1단계: 이메일 입력 → 인증 메일 발송.
    signupInit: {
      emailRequired: '이메일을 입력해주세요.',
      emailInvalid: '이메일 형식이 올바르지 않습니다.',
      turnstileRequired: '보안 문자 인증을 완료해주세요.',
      duplicateEmail: '이미 가입된 이메일입니다. 로그인을 이용해주세요.',
      invalidDomain: '메일을 받을 수 없는 이메일 주소입니다. 이메일을 다시 확인해주세요.',
      genericError: '인증 메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.',
      sentTitle: '인증 메일을 보냈어요',
      sentInstructionPrefix: '받은 메일함을 열어 ',
      sentInstructionEmphasis: '회원가입 계속하기',
      sentInstructionSuffix: ' 링크를 눌러 가입을 이어가주세요.',
      spamHint: '메일이 보이지 않으면 스팸함도 확인해주세요.',
      linkValidity: '링크는 24시간 동안 유효합니다.',
    },
    // 신규 가입 2단계: 메일 링크 진입 후 아이디·닉네임·비밀번호·약관 입력 → 가입 확정.
    signup: {
      // 토큰(메일 링크) 자체가 유효하지 않을 때.
      invalidLinkTitle: '유효하지 않은 링크',
      expiredLink: '회원가입 링크가 만료되었습니다. 회원가입을 처음부터 다시 진행해주세요.',
      invalidLink: '유효하지 않거나 이미 사용된 회원가입 링크입니다. 회원가입을 처음부터 다시 진행해주세요.',
      verifyingLink: '회원가입 정보를 확인하고 있습니다…',
      loginIdRequired: '아이디를 입력해주세요.',
      loginIdPattern: '아이디는 영문 소문자·숫자·언더바(_) 4~20자만 사용할 수 있습니다.',
      passwordRequired: '비밀번호를 입력해주세요.',
      passwordTooShort: '비밀번호는 8자 이상이어야 합니다.',
      passwordConfirmRequired: '비밀번호 확인을 입력해주세요.',
      passwordMismatch: '비밀번호와 비밀번호 확인이 일치하지 않습니다.',
      passwordMatched: '비밀번호가 일치합니다.',
      nicknameRequired: '닉네임을 입력해주세요.',
      nicknameLength: '닉네임은 2자 이상 20자 이하여야 합니다.',
      nicknamePattern: '닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.',
      // 백엔드 BLACKLIST_NICKNAME(400) — 운영진 사칭·비속어 등 금칙어.
      // 어떤 단어가 걸렸는지는 알려주지 않는다(금칙어 목록을 역으로 캐내는 걸 막기 위해).
      nicknameBlacklisted: '사용할 수 없는 닉네임입니다. 다른 닉네임을 입력해주세요.',
      termsRequired: '이용약관에 동의해주세요.',
      privacyRequired: '개인정보처리방침에 동의해주세요.',
      ageRequired: '만 14세 이상만 가입할 수 있습니다.',
      duplicateEmail: '이미 가입된 이메일입니다. 로그인을 이용해주세요.',
      duplicateLoginId: '이미 사용 중인 아이디입니다.',
      duplicateNickname: '이미 사용 중인 닉네임입니다.',
      genericError: '회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    },
    // 이메일 변경(EMAIL_CHANGE) 링크 확인 결과 화면(/verify-email-change).
    emailChange: {
      missingToken: '유효하지 않은 인증 링크입니다. 메일의 링크를 다시 확인해주세요.',
      verifying: '이메일 인증을 확인하고 있습니다…',
      successTitle: '이메일 인증 완료',
      successDescription: '이메일 인증이 정상적으로 완료되었습니다.',
      failTitle: '인증에 실패했습니다',
      expiredToken: '인증 링크가 만료되었습니다. 이메일 변경을 다시 요청해주세요.',
      invalidToken: '유효하지 않거나 이미 사용된 인증 링크입니다. 이메일 변경을 다시 요청해주세요.',
      duplicateEmail: '이미 다른 계정에서 사용 중인 이메일입니다. 다른 이메일로 다시 시도해주세요.',
      goHome: '홈으로 가기',
    },
    // 아이디/비밀번호 찾기: 이메일 입력 → 아이디 + 비밀번호 재설정 링크 메일 발송.
    findAccount: {
      emailRequired: '이메일을 입력해주세요.',
      emailInvalid: '이메일 형식이 올바르지 않습니다.',
      turnstileRequired: '보안 문자 인증을 완료해주세요.',
      captchaFailed: '보안 문자 인증에 실패했습니다. 다시 시도해주세요.',
      turnstileMisconfigured: '보안 문자 설정이 누락되어 아이디/비밀번호 찾기를 진행할 수 없습니다. 관리자에게 문의해주세요.',
      genericError: '메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.',
      networkError: '요청 중 오류가 발생했습니다. 네트워크 상태를 확인한 뒤 다시 시도해주세요.',
      sentTitle: '인증 메일을 보냈어요',
      linkValidity: '비밀번호 재설정 링크는 30분 동안 유효합니다.',
      spamHint: '메일이 보이지 않으면 스팸함도 확인해주세요.',
    },
    resetPassword: {
      genericError: '비밀번호 재설정에 실패했습니다. 잠시 후 다시 시도해주세요.',
      expiredToken: '재설정 링크가 만료되었습니다. 아이디/비밀번호 찾기를 다시 진행해주세요.',
      invalidToken: '유효하지 않은 재설정 링크입니다. 아이디/비밀번호 찾기를 다시 진행해주세요.',
      passwordMismatch: '새 비밀번호가 일치하지 않습니다.',
      passwordLength: '새 비밀번호는 8~50자 사이여야 합니다.',
      missingTokenTitle: '유효하지 않은 링크',
      missingTokenDescription: '재설정 링크가 올바르지 않습니다. 아이디/비밀번호 찾기를 다시 진행해주세요.',
      doneTitle: '비밀번호 변경 완료',
      doneDescription: '새 비밀번호로 변경되었습니다. 보안을 위해 다른 기기의 로그인은 모두 해제되었습니다.',
    },
    suspendedAccount: {
      title: '이용이 제한된 계정입니다',
      loading: '정지 정보를 불러오는 중…',
      loadFailed: '정지 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
      // 위반 여부를 단정하지 않는다 — 관리자 재량으로도 정지될 수 있어 "약관 위반이 확인됨"이라
      // 단정하면 사실과 다를 수 있다. 주체(관리자)만 명확히 밝힌다.
      description: '관리자에 의해 계정 이용이 정지되었습니다.',
      untilPrefix: '정지 해제 예정: ',
      indefinite: '별도 안내 전까지 무기한 정지',
      inquiryTitle: '정지 사유 확인·해제 문의',
      inquiryDescriptionPrefix: '정지 사유가 궁금하거나 해제를 원하시면 아래 이메일로 문의해주세요. 확인이 빠르도록 ',
      inquiryDescriptionEmphasis: '가입하신 이메일 주소와 닉네임',
      inquiryDescriptionSuffix: '을 함께 적어주세요.',
      mailSubject: (siteName: string) => `[${siteName}] 계정 정지 문의`,
      mailBody: '아래 정보를 확인해 계정 정지 관련 문의를 남깁니다.',
      logout: '로그아웃',
    },
  },

  mypage: {
    loginGateSuffix: '후 마이페이지를 이용할 수 있습니다.',
    profileSettings: {
      bioTooLong: (max: number) => `자기소개는 ${max}자 이하여야 합니다.`,
      bioSaved: '자기소개가 저장되었습니다.',
      bioSaveFailed: '자기소개 저장에 실패했습니다.',
      nicknameLength: '닉네임은 2~20자 사이여야 합니다.',
      nicknamePattern: '닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.',
      nicknameSameAsCurrent: '현재 닉네임과 동일합니다.',
      nicknameChanged: '닉네임이 변경되었습니다.',
      nicknameChangeFailed: '닉네임 변경에 실패했습니다.',
      nicknameDuplicate: '이미 사용 중인 닉네임입니다.',
      // 백엔드 BLACKLIST_NICKNAME(400). 걸린 단어는 밝히지 않는다(목록 역추적 방지).
      nicknameBlacklisted: '사용할 수 없는 닉네임입니다. 다른 닉네임을 입력해주세요.',
      // 변경 버튼을 누르기 전 보여주는 안내 — 한 번 바꾸면 되돌릴 수 없다는 걸 미리 알린다.
      nicknameCooldownWarning: (days: number) =>
        `닉네임을 변경하면 ${days}일 동안 다시 변경할 수 없습니다.`,
      // 변경 직전 확인창. 실수로 바꿔서 한 달간 묶이는 상황을 막는다.
      nicknameChangeConfirm: (next: string, days: number) =>
        `닉네임을 '${next}'(으)로 변경할까요?\n변경 후 ${days}일 동안은 다시 변경할 수 없습니다.`,
      // 쿨타임으로 폼이 잠겼을 때의 안내. until은 다시 변경 가능해지는 날짜, remaining은 남은 기간.
      nicknameCooldownLocked: (until: string, remaining: string) =>
        `닉네임은 ${until}부터 다시 변경할 수 있습니다. (약 ${remaining} 남음)`,
      // 백엔드 NICKNAME_CHANGE_COOLDOWN(400) — 프론트 잠금을 뚫고 요청이 나간 경우
      // (기기 시계 오차, 다른 탭에서 먼저 변경 등). 서버 판정이 최종이다.
      nicknameCooldownRejected: (days: number) =>
        `닉네임은 변경 후 ${days}일이 지나야 다시 변경할 수 있습니다.`,
      currentPasswordRequired: '현재 비밀번호를 입력해주세요.',
      newPasswordLength: '새 비밀번호는 8~50자 사이여야 합니다.',
      passwordMismatch: '새 비밀번호가 일치하지 않습니다.',
      passwordChanged: '비밀번호가 변경되었습니다.',
      passwordChangeFailedGeneric: '비밀번호 변경에 실패했습니다.',
      wrongCurrentPassword: '현재 비밀번호가 일치하지 않습니다.',
      sameAsCurrentPassword: '새 비밀번호가 현재 비밀번호와 동일합니다.',
      withdrawNotice: '탈퇴 시 계정이 비활성화되며 되돌릴 수 없습니다.',
    },
    withdraw: {
      passwordRequired: '비밀번호를 입력해주세요.',
      agreementRequired: '안내 사항 확인에 동의해주세요.',
      wrongPassword: '비밀번호가 일치하지 않습니다.',
      genericFailed: '회원 탈퇴에 실패했습니다. 잠시 후 다시 시도해주세요.',
      doneTitle: '탈퇴가 완료되었습니다',
      doneDescriptionLine1: '그동안 이용해 주셔서 감사합니다.',
      doneDescriptionLine2: '잠시 후 홈으로 이동합니다.',
      noticeIntro: '탈퇴 시 아래 내용에 유의해주세요.',
      bullets: [
        '계정이 즉시 비활성화되며 다시 로그인할 수 없습니다.',
        '닉네임·이메일 등 개인정보는 익명 처리되며 복구할 수 없습니다.',
        // 백엔드 User.withdraw()가 loginId를 'del-{id}'로 치환하고 password를 NULL로 지운다.
        // 아이디가 반납되므로, 탈퇴 후 같은 아이디로 새로 가입하는 것 자체는 가능하다
        // (다만 새 계정이므로 기존 활동 내역과는 연결되지 않는다).
        '로그인 아이디와 비밀번호는 즉시 폐기됩니다. 같은 아이디로 다시 가입하더라도 이전 계정과는 연결되지 않습니다.',
        "작성하신 글과 댓글은 삭제되지 않고 '탈퇴회원'으로 표시됩니다.",
        '모든 기기에서 로그아웃됩니다.',
        '접속 IP는 관련 법령에 따라 6개월간 보관 후 파기됩니다.',
      ],
      agreeLabel: '안내 사항을 모두 확인했으며, 탈퇴에 동의합니다.',
    },
    myPosts: {
      loadFailed: '글을 불러오지 못했습니다.',
      empty: '아직 작성한 글이 없습니다.',
    },
    myComments: {
      loadFailed: '댓글을 불러오지 못했습니다.',
      empty: '아직 작성한 댓글이 없습니다.',
    },
    myPoints: {
      loadFailed: '포인트 내역을 불러오지 못했습니다.',
      empty: '포인트 거래 내역이 없습니다.',
    },
    myReports: {
      loadFailed: '신고 내역을 불러오지 못했습니다.',
      empty: '접수한 신고가 없습니다.',
      resolvedNote: '운영진이 확인 후 조치를 완료했습니다.',
      rejectedNote: '운영진 검토 결과, 조치가 필요하지 않다고 판단되었습니다.',
    },
  },

  // 포인트 랭킹 — 메인 페이지 상위 랭킹 섹션과 마이페이지 랭킹 탭 양쪽에서 쓰는 문구.
  ranking: {
    loadFailed: '랭킹을 불러오지 못했습니다.',
    empty: '아직 랭킹이 없습니다.',
    // 내가 아직 랭킹 대상이 아닐 때(myRank=null). 상위 랭킹은 그대로 보여준다.
    notRanked: '아직 랭킹에 들지 않았습니다. 활동해서 포인트를 모아보세요!',
    totalCount: (total: number) => `전체 ${total.toLocaleString()}명`,
    myRankSummary: (rank: number, total: number) =>
      `전체 ${total.toLocaleString()}명 중 ${rank.toLocaleString()}위`,
  },

  // 알림 벨 드롭다운(NotificationBell)과 알림 전체보기 페이지(app/notifications)의 UI 문구.
  // 개별 알림 "본문" 문구는 lib/notification.ts / notificationVisuals.tsx가 조립하며,
  // 여기에는 화면 골격(제목·버튼·빈 상태 등)만 둔다.
  notifications: {
    title: '알림',
    viewAll: '알림 전체보기',
    markAllRead: '모두 읽기',
    deleteAll: '전체 삭제',
    deleteAllConfirm: '모든 알림을 삭제하시겠습니까? 삭제한 알림은 되돌릴 수 없습니다.',
    deleteOne: '알림 삭제',
    unreadLabel: '읽지 않은 알림',
    empty: '알림이 없습니다.',
    loadFailed: '알림을 불러오지 못했습니다.',
    loginGate: '로그인 후 알림을 확인할 수 있습니다.',
  },

  // 유저 레벨 — 레벨 뱃지 툴팁, 마이페이지 레벨 카드, 레벨업 알림 문구.
  // ⚠️ 구간 명칭(새내기/주민/…)은 정책적으로 없앴다. 레벨은 숫자와 색으로만 표시하며,
  //    색 정의는 문구가 아니라 표시 정책이라 lib/level.ts가 갖는다.
  level: {
    // 뱃지 툴팁. 뱃지 자체는 숫자만 그리므로 여기서 "Lv." 접두만 붙여준다.
    badgeTitle: (level: number) => `Lv.${level}`,
    card: {
      title: '레벨',
      // 카드 제목 옆 "Lv.12" 표기. 뱃지(숫자만)와 달리 여기는 폭이 넉넉해 접두를 붙인다.
      levelLabel: (level: number) => `Lv.${level}`,
      // 진행바 아래 "320 / 500 EXP". 분모(expPerLevel)는 백엔드가 응답에 실어주는 값이라
      // 하드코딩이 아니다 — 백엔드 설정이 바뀌어도 자동으로 따라간다.
      progress: (into: string, per: string) => `${into} / ${per} EXP`,
      toNext: (remaining: string) => `다음 레벨까지 ${remaining} EXP`,
      totalExp: (total: string) => `누적 ${total} EXP`,
      // ⚠️ 활동별 획득량과 일일 상한은 백엔드 설정(app.exp.*)에만 있고 프론트로 내려오지 않는다.
      //    포인트 안내(points.pointInfo)와 같은 이유로 숫자 없이 서술한다.
      howTo: '글과 댓글을 쓰면 경험치가 쌓이고, 일정량을 채울 때마다 레벨이 오릅니다. 하루에 얻을 수 있는 경험치에는 상한이 있어요.',
    },
    // 레벨업 알림 문구. 발신자가 없는 시스템 알림이라 "누가"로 시작하지 않는다.
    notification: {
      prefix: '축하합니다! ',
      // ⚠️ 앞에 "Lv.N"이 붙는 자리다. 여기에 조사(을/를)를 넣으면 숫자를 읽는 소리에 따라
      //    갈리므로(Lv.1→'일'을 / Lv.5→'오'를) 반드시 한쪽이 틀린다. 조사 없이 끊는다.
      afterLevel: '달성!',
    },
  },

  points: {
    roulette: {
      unlockFailed: '들어올 땐 마음대로겠지만 나갈땐 아니란다',
      lockFailed: 'ㅋ 너 돈 털림 고정 못함 ㅅㄱ',
      betRequired: '돈걸어',
      betRange: (min: string, max: string) => `${min}P ~ ${max}P 사이로 베팅하셈`,
      betUnitMismatch: (unit: string) => `${unit}P 단위로만 베팅하셈`,
      spinFailed: 'ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ룰렛! 실패!',
      win: (nickname: string, amount: string) => `${nickname}한테서 ${amount}P 털음 ㅊㅋㅊㅋ`,
      lose: (nickname: string, amount: string) => `ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ${nickname}한테 ${amount}P 털렸누...  ㅠ`,
      randomOpponentHint: '다음 스핀은 랜덤 상대하고 ㄱㄱ',
      consentRequired: '동의부터 하고 오셈',
    },
    rouletteConsent: {
      title: '룰렛 하기 전에 읽어',
      body: '룰렛은 진짜 다른 회원 포인트 걸고 뺏고 뺏기는 게임임. 지면 그만큼 내 포인트 훅 날아가고, 상대로도 랜덤하게 뽑힐 수 있음. 동의하면 다신 안 물어봄.',
      agree: '동의함',
      cancel: '다음에 할게',
      agreeFailed: '동의 처리 실패함 다시 시도해',
    },
    pachinko: {
      ballCountRequired: '구슬 몇 개 쏠지 정해',
      ballCountRange: (min: string, max: string) => `구슬은 ${min}개 ~ ${max}개 사이로만 쏠 수 있음`,
      playFailed: 'ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ구슬! 실패!',
      win: (amount: string) => `대박! ${amount}P 벌음 ㅊㅋㅊㅋ`,
      lose: (amount: string) => `ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ${amount}P 날림... ㅠ`,
    },
    slot: {
      betRequired: '돈걸어',
      betRange: (min: string, max: string) => `${min}P ~ ${max}P 사이로 베팅하셈`,
      betUnitMismatch: (unit: string) => `${unit}P 단위로만 베팅하셈`,
      playFailed: 'ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ릴! 실패!',
      // amount는 순이익(돌려받은 금액 - 배팅액). 배율 1x 트리플은 이익이 0이라 win이 아니라 breakEven.
      win: (amount: string) => `트리플 매치! ${amount}P 벌음 ㅊㅋㅊㅋ`,
      breakEven: (amount: string) => `본전! ${amount}P 그대로 돌려받음`,
      lose: (amount: string) => `ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ${amount}P 날림... ㅠ`,
    },
    pointInfo: {
      // 지급액(글/댓글/좋아요별 포인트)과 일일 상한 값은 백엔드 설정(app.points.*)에만 있고
      // 프론트로 내려오지 않는다. 숫자를 여기에 적으면 백엔드 설정을 바꾸는 순간 조용히 거짓말이 되므로
      // 의도적으로 숫자 없이 서술한다. 백엔드가 상한/누적치를 응답에 실어주면 그때 수치를 노출한다.
      activityRewardDescription:
        '게시글이나 댓글을 쓰고, 내 글이 좋아요를 받으면 포인트를 얻어요. 다만 하루에 활동으로 받을 수 있는 포인트에는 상한이 있어서, 그날 상한을 채우면 더 써도 포인트가 들어오지 않아요. 상한은 매일 자정에 다시 채워져요.',
      // 지급액을 숫자로 적지 않는 이유는 activityRewardDescription과 같다 — 여기 값은 백엔드
      // 설정(app.checkin.*)에서 오고, 출석 모달은 그 값을 서버에서 받아 그대로 보여준다.
      checkinDescription:
        '오른쪽 위 프로필을 누르고 "출석하기"를 고르면 하루 한 번 포인트와 경험치를 받아요. 한 달 동안 모은 출석 일수가 일정 기준에 닿으면 그날은 보너스 포인트가 더 붙고, 출석 일수는 매달 1일에 다시 0부터 세요.',
      rouletteDescription:
        '원하는 만큼 직접 배팅해서 다른 회원과 겨루는 게임이에요. 이기면 상대의 포인트를 가져오고 지면 내 포인트를 잃으며, 판마다 배팅액의 일부가 수수료로 빠져나가요.',
      pachinkoDescription:
        '구슬을 개당 가격으로 사서 원하는 만큼 쏘는 게임이에요. 구슬마다 못 사이를 튕기다 바닥의 슬롯에 착지하고, 착지한 슬롯의 배율만큼 포인트를 받아요. 판마다 총 구슬 비용의 일부가 수수료로 빠져나가요.',
      slotDescription:
        '릴 3개를 돌려 셋이 모두 같은 그림이 나오면 배당을 받는 슬롯머신이에요. 판마다 배팅액의 일부가 수수료로 빠져나가요.',
    },
    // 게임센터 각 게임 우측의 "확률 공개" 패널 문구. 확률·배율 수치는 전부 서버 config에서 받아
    // 끼워 넣는다 — 여기에 숫자를 적으면 백엔드 yaml만 바꿔도 조용히 거짓말이 된다.
    odds: {
      title: '확률 공개',
      outcomeHeader: '결과',
      multiplierHeader: '배율',
      amountHeader: '금액',
      probabilityHeader: '확률',
      rouletteWin: '승리',
      rouletteLose: '패배',
      rouletteWinAmount: '+배팅액',
      rouletteLoseAmount: '−배팅액',
      rouletteNote: '상대가 누구든 확률은 동일해요.',
      // left/right는 formatProbability로 포맷된 문자열("50%"). 좌우가 같으면 한 번만 말한다.
      pachinkoNote: (left: string, right: string) =>
        left === right
          ? `못에 부딪힐 때마다 구슬이 왼쪽·오른쪽으로 튕길 확률은 각각 ${right}예요.`
          : `못에 부딪힐 때마다 구슬이 왼쪽으로 ${left}, 오른쪽으로 ${right} 확률로 튕겨요.`,
    },
    gameCenter: {
      // 게임센터 허브(룰렛·파칭코·슬롯 공통) 로그인 게이트/헤더 문구.
      title: '게임센터',
      subtitle: '포인트를 걸고 미니게임으로 즐겨보세요.',
      loginGateSuffix: '후 게임센터를 이용할 수 있습니다.',
    },
    roulettePage: {
      loginGateSuffix: '후 룰렛을 이용할 수 있습니다.',
    },
    pachinkoPage: {
      loginGateSuffix: '후 파칭코를 이용할 수 있습니다.',
    },
    slotPage: {
      loginGateSuffix: '후 슬롯머신을 이용할 수 있습니다.',
    },
    // 헤더 사용자 메뉴 > "출석하기"로 열리는 출석 모달(달력·버튼·결과·보상 안내) 문구.
    // 포인트/경험치 수치는 전부 서버(CheckInCalendar.dailyAmount·dailyExp, milestones[].bonus)에서
    // 받은 값을 끼워 넣는다 — 여기에 숫자를 적으면 백엔드 yaml만 바꿔도 조용히 거짓말이 된다.
    checkin: {
      // 달력 헤더. 조회 중인 달을 그대로 쓴다(과거 달을 열면 그 달이 찍힌다).
      monthLabel: (year: number, month: number) => `${year}년 ${month}월`,
      // 일~토. 달력 격자의 요일 머리글.
      weekdays: ['일', '월', '화', '수', '목', '금', '토'] as const,
      prevMonth: '이전 달',
      nextMonth: '다음 달',
      backToThisMonth: '이번 달로',
      // 조회 중인 달의 누적 출석 일수.
      monthlyCount: (month: number, count: number) => `${month}월 출석 ${count}일`,
      checkInButton: '오늘 출석하기',
      checkingIn: '출석하는 중…',
      alreadyCheckedIn: '오늘 출석 완료',
      loadFailed: '출석 정보를 불러오지 못했습니다.',
      checkInFailed: '출석에 실패했습니다. 잠시 후 다시 시도해주세요.',
      // 보상 안내 한 줄. 카드에 상시 노출되는 유일한 설명이라 최대한 짧게 유지한다
      // (수치는 서버 값 dailyAmount / dailyExp).
      dailyReward: (amount: string, exp: string) => `매일 ${amount}포인트와 EXP ${exp}을 받습니다.`,
      // 마일스톤 보너스는 매일 볼 내용이 아니라 "?" 팝오버 안으로 넣는다.
      bonusPopoverLabel: '출석 보너스 안내 보기',
      milestoneHeading: '누적 출석 보너스',
      milestoneRow: (count: number, bonus: string) => `${count}일 달성 시 +${bonus}P`,
      milestoneAchieved: '달성',
      milestoneNote: '보너스는 달성한 그날 한 번만 붙고, 출석 일수는 매달 1일에 0부터 다시 세요.',
      // 모달 제목. 출석 전/후 모두 같은 모달이라 제목은 상태와 무관하게 고정한다.
      modalTitle: '출석',
      // 평소 출석은 결과를 글로 알리지 않는다 — 지급액은 아래 보상 안내에 이미 적혀 있고,
      // 헤더 잔액이 곧바로 올라가는 것으로 확인된다. 오늘 칸에 도장이 찍히는 연출로 갈음한다.
      //
      // 다만 마일스톤 달성일(한 달에 세 번)은 기본 지급의 3~10배가 얹히는데 아무 안내가 없으면
      // 받은 줄도 모르고 지나간다. 그 날만 이 문구를 잠깐 띄운다.
      resultBonus: (count: number, bonus: string) => `${count}일 달성! 보너스 ${bonus}P`,
      // 도장이 찍힌 칸에서 잠깐 떠오르는 획득량. 아래 보상 안내가 '예고'라면 이쪽은 '영수증'이라,
      // 규칙을 다시 서술하지 않고 방금 받은 값만 짧게 보여준다.
      // amount는 기본 지급 + 마일스톤 보너스의 합계다(내역은 보너스 배너가 따로 알린다).
      rewardPoint: (amount: string) => `+${amount}P`,
      rewardExp: (exp: string) => `+${exp} EXP`,
    },
    // 룰렛 승/패 알림(POINT_STOLEN/POINT_WON)과 활동 리워드 알림(POST_REWARD/COMMENT_REWARD).
    // lib/notification.ts(순수 텍스트)와 NotificationBell.tsx(강조 포함 JSX)가
    // 동일한 prefix/suffix를 조합해 쓴다.
    notification: {
      stolenAfterName: '가 니꺼 포인트 털엇데요ㅠ ',
      stolenSuffix: ' 헌납. 이대로 끝?',
      wonAfterName: '님을 포인트 룰렛에서 개발라버리고 ',
      wonSuffix: '털음 ㅊㅋㅊㅋ!',
      // POST_REWARD/COMMENT_REWARD 공용 suffix. 앞부분(어떤 글/댓글인지)은
      // postTitle/commentContent 유무에 따라 문구가 갈려 lib/notification.ts·NotificationBell.tsx가 직접 조립한다.
      rewardSuffix: 'P를 받았습니다!',
    },
  },

  post: {
    form: {
      categoryRequired: '카테고리를 선택해주세요.',
      titleRequired: '제목을 입력해주세요.',
      titleTooLong: '제목은 100자 이하여야 합니다.',
      contentRequired: '내용을 입력해주세요.',
      contentTooLong: (max: string) => `본문은 ${max}자 이하여야 합니다.`,
      // 이미지·동영상 공용. 업로드가 끝나야 본문에 <img>/<video>가 삽입되므로 그 전 저장을 막는다.
      imageUploading: '파일 업로드가 끝난 뒤 저장해주세요.',
      loginGateSuffix: '후 글을 작성할 수 있습니다.',
    },
    deleteConfirm: '게시글을 삭제하시겠습니까?',
    editor: {
      unsupportedFormat: '지원하지 않는 형식입니다. (이미지: jpg, jpeg, png, gif, webp / 동영상: mp4, mov)',
      fileTooLarge: (ext: string, maxMb: number, sizeMb: string) =>
        `${ext.toUpperCase()} 파일은 ${maxMb}MB 이하여야 합니다. (현재 약 ${sizeMb}MB)`,
      tooManyImages: (max: number) => `이미지는 최대 ${max}장까지 첨부할 수 있습니다.`,
      tooManyVideos: (max: number) => `동영상은 최대 ${max}개까지 첨부할 수 있습니다.`,
      uploadFailed: '이미지 업로드에 실패했습니다.',
      // 동영상은 업로드 후 서버에서 재인코딩(ffmpeg)까지 마친 뒤 응답이 오므로 실패 문구를 분리한다.
      videoUploadFailed: '동영상 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.',
      // 업로드 진행 표시. 전송(브라우저→서버) 구간은 %로 보여줄 수 있다(XHR upload progress).
      uploadingProgress: (percent: number) => `업로드 중… ${percent}%`,
      // 전송이 끝난 뒤 서버가 파일을 재압축하는 구간. 소요 시간을 예측할 수 없어 %가 아니라
      // 대기 안내만 보여준다(전송 100%에서 멈춘 것처럼 오해하지 않도록 문구를 전환한다).
      // 백엔드 변환기 기준으로 표시 대상이 갈린다: 동영상(mp4/mov→ffmpeg), 이미지(jpg/jpeg/gif→webp).
      // png/webp는 변환 없이 그대로 저장되므로 이 표시를 띄우지 않는다.
      compressingVideo: '동영상을 압축하고 있어요. 잠시만 기다려주세요…',
      compressingImage: '이미지를 압축하고 있어요. 잠시만 기다려주세요…',
      linkPrompt: '링크 URL을 입력하세요 (비우면 링크 해제)',
      invalidLink: '사용할 수 없는 링크입니다. http/https 주소를 입력해주세요.',
    },
    list: {
      empty: '게시글이 없습니다.',
    },
    search: {
      keywordTooShort: '검색어는 2자 이상 입력해주세요.',
      nicknameSearchHint: '작성자 검색은 닉네임이 정확히 일치해야 하며, 익명으로 쓴 글은 검색되지 않습니다.',
    },
  },

  comment: {
    form: {
      contentRequired: '내용을 입력해주세요.',
      // 이미지 첨부를 허용하면서부터는 "본문 없이 이미지만" 댓글도 유효하므로,
      // 둘 다 비었을 때만 이 문구로 막는다(백엔드 saveComment 규칙과 일치).
      emptyContent: '내용을 입력해주세요.',
      loginGateSuffix: '후 댓글을 작성할 수 있습니다.',
      // 이미지 첨부(단일) 관련. 확장자·용량 기준은 게시글 에디터와 동일(백엔드 S3ImageUploader 기준).
      imageUnsupportedFormat: '지원하지 않는 형식입니다. (jpg, jpeg, png, gif, webp)',
      imageTooLarge: (ext: string, maxMb: number, sizeMb: string) =>
        `${ext.toUpperCase()} 파일은 ${maxMb}MB 이하여야 합니다. (현재 약 ${sizeMb}MB)`,
      imageUploadFailed: '이미지 업로드에 실패했습니다.',
      // 업로드가 끝나기 전(imageUrl 미확정)에 등록을 누른 경우.
      imageUploading: '이미지 업로드가 끝난 뒤 등록해주세요.',
    },
    deleteConfirm: '댓글을 삭제하시겠습니까?',
    deletedPlaceholder: '삭제된 댓글입니다.',
  },

  report: {
    modal: {
      reasonRequired: '신고 사유를 선택해주세요.',
      etcDetailRequired: '기타 사유를 선택하셨다면 상세 내용을 입력해주세요.',
      alreadyReported: (label: string) => `이미 신고하신 ${label}입니다. 접수된 신고는 운영진이 확인하고 있습니다.`,
      genericFailed: '신고 접수에 실패했습니다. 잠시 후 다시 시도해주세요.',
      doneTitle: '신고가 접수되었습니다',
      doneDescription: '운영진이 확인 후 조치할 예정입니다. 처리 결과는 마이페이지의 내 신고 탭에서 확인하실 수 있습니다.',
      falseReportWarning: '허위 신고가 반복되면 이용에 제한을 받을 수 있습니다.',
      etcPlaceholder: '어떤 점이 문제인지 구체적으로 알려주세요.',
    },
    copy: {
      userSubtitle: '이 회원을 신고하는 사유를 선택해주세요. 접수 후에는 취소할 수 없습니다.',
      defaultSubtitle: '신고 사유를 선택해주세요. 접수 후에는 취소할 수 없습니다.',
      userDetailPlaceholder: '이 회원의 어떤 점이 문제였는지 구체적으로 알려주세요.',
      defaultDetailPlaceholder: '운영진이 판단하는 데 도움이 될 내용을 적어주세요.',
      selfErrorUser: '본인은 신고할 수 없습니다.',
      selfErrorWithLabel: (label: string) => `본인이 작성한 ${label}은 신고할 수 없습니다.`,
      goneErrorUser: '이미 탈퇴한 회원입니다.',
      goneErrorWithLabel: (label: string) => `이미 삭제된 ${label}입니다.`,
    },
  },

  admin: {
    loginGateSuffix: '이 필요합니다.',
    noAccessTitle: '접근 권한이 없습니다.',
    noAccessDescription: '관리자 전용 페이지입니다.',
    dashboard: {
      greeting: (nickname: string) => `${nickname}님, 관리자 페이지입니다.`,
      pendingReportNote: '※ 미처리 신고는 신고가 접수된 게시글·댓글의 수이며, 신고 건수와는 다릅니다.',
      noRecentNotices: '등록된 공지가 없습니다.',
    },
    users: {
      loadFailed: '회원 목록을 불러오지 못했습니다.',
      suspendConfirm: (nickname: string) =>
        `${nickname}님의 계정을 정지할까요?\n정지되면 해당 회원은 즉시 로그아웃되며 로그인할 수 없습니다.`,
      unsuspendConfirm: (nickname: string) => `${nickname}님의 계정 정지를 해제할까요?`,
      statusChangeFailed: '상태 변경에 실패했습니다.',
      // ROOT의 즉시 관리자 권한 박탈(대상을 즉시 USER로 되돌린다).
      revokeAdminConfirm: (nickname: string) =>
        `${nickname}님의 관리자 권한을 즉시 박탈할까요?\n이미 로그인된 세션에도 다음 요청부터 바로 반영됩니다.`,
      revokeAdminFailed: '권한 박탈에 실패했습니다.',
      // ROOT의 관리자 임명. 권한이 커지는 방향이라 무엇이 열리는지 명시해 확인받는다.
      promoteAdminConfirm: (nickname: string) =>
        `${nickname}님을 관리자(ADMIN)로 임명할까요?\n\n` +
        `· 관리자 페이지(회원·신고·공지 관리)에 접근할 수 있게 됩니다.\n` +
        `· 다른 회원을 정지시킬 수 있게 됩니다(기한은 최대 7일).\n` +
        `· 이미 로그인된 세션에도 다음 요청부터 바로 반영됩니다.`,
      promoteAdminFailed: '관리자 임명에 실패했습니다.',
      searchEmpty: (keyword: string) => `'${keyword}' 검색 결과가 없습니다.`,
      empty: '회원이 없습니다.',
      // ADMIN 계정으로 정지할 때 기한 선택 모달(SuspendUserModal) 전용 문구. ROOT만 무기한 정지 가능.
      suspendModal: {
        title: '계정 정지',
        durationRequiredNotice: 'ADMIN 권한으로는 기한이 있는 정지만 가능합니다. 기한을 선택해주세요.',
        durationOptionalNotice: '기한을 정하지 않으면 무기한 정지됩니다.',
        presetLabel: '정지 기한',
        indefinite: '무기한',
        confirm: '정지',
        confirming: '처리 중…',
      },
      // 백엔드 ErrorCode 이름 → 한글 메시지 (정지 모달에서 사용).
      errorCodeMessages: {
        SUSPEND_DURATION_REQUIRED: 'ADMIN 권한으로는 기한이 있는 정지만 가능합니다.',
        SUSPEND_DURATION_TOO_LONG: '정지 기한이 허용된 최대 기간(7일)을 초과했습니다.',
        CANNOT_SUSPEND_ROOT: '최고 관리자 계정은 정지할 수 없습니다.',
      } as Record<string, string>,
    },
    notices: {
      loadFailed: '목록을 불러오지 못했습니다.',
      deleteConfirm: (title: string) => `"${title}" 공지를 삭제할까요?\n삭제 후에는 복구할 수 없습니다.`,
      deleteFailed: '삭제에 실패했습니다.',
      empty: '등록된 공지가 없습니다.',
    },
    noticeForm: {
      titleRequired: '제목을 입력해주세요.',
      titleTooLong: '제목은 100자 이하여야 합니다.',
      contentRequired: '내용을 입력해주세요.',
      contentTooLong: (max: string) => `본문은 ${max}자 이하여야 합니다.`,
      // 이미지·동영상 공용.
      imageUploading: '파일 업로드가 끝난 뒤 저장해주세요.',
      forbidden: '관리자 권한이 없습니다.',
    },
    reports: {
      loadFailed: '신고 목록을 불러오지 못했습니다.',
      detailLoadFailed: '신고 상세를 불러오지 못했습니다.',
      deleteConfirm: (label: string, author: string, count: number) =>
        `이 ${label}을(를) 삭제할까요?\n\n` +
        `· 작성자(${author})에게 삭제 알림이 전송됩니다.\n` +
        `· 이 대상에 접수된 신고 ${count}건이 '조치 완료'로 처리됩니다.`,
      deleteFailed: '삭제에 실패했습니다.',
      rejectConfirm:
        '이 신고를 반려할까요?\n\n' +
        '· 대상은 삭제되지 않고 그대로 유지됩니다.\n' +
        '· 반려한 신고는 다시 되돌릴 수 없습니다.',
      rejectFailed: '반려 처리에 실패했습니다.',
      emptyPending: '처리할 신고가 없습니다.',
      emptyOther: '해당하는 신고가 없습니다.',
    },
  },

  notice: {
    list: {
      empty: '등록된 공지사항이 없습니다.',
    },
  },

  share: {
    copied: '복사됨',
    copyFallbackPrompt: '아래 링크를 복사하세요',
  },
} as const
