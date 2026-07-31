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
      emailRequired: '이메일을 입력해주세요.',
      passwordRequired: '비밀번호를 입력해주세요.',
      invalidCredentials: '이메일 또는 비밀번호가 올바르지 않습니다.',
    },
    signup: {
      emailRequired: '이메일을 입력해주세요.',
      emailInvalid: '이메일 형식이 올바르지 않습니다.',
      passwordRequired: '비밀번호를 입력해주세요.',
      passwordTooShort: '비밀번호는 8자 이상이어야 합니다.',
      passwordConfirmRequired: '비밀번호 확인을 입력해주세요.',
      passwordMismatch: '비밀번호와 비밀번호 확인이 일치하지 않습니다.',
      passwordMatched: '비밀번호가 일치합니다.',
      nicknameRequired: '닉네임을 입력해주세요.',
      nicknameLength: '닉네임은 2자 이상 20자 이하여야 합니다.',
      nicknamePattern: '닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.',
      termsRequired: '이용약관에 동의해주세요.',
      privacyRequired: '개인정보처리방침에 동의해주세요.',
      duplicateEmail: '이미 사용 중인 이메일입니다.',
      duplicateNickname: '이미 사용 중인 닉네임입니다.',
      genericError: '회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    },
    forgotPassword: {
      emailRequired: '이메일을 입력해주세요.',
      emailInvalid: '이메일 형식이 올바르지 않습니다.',
      sentTitle: '메일을 보냈어요',
      sentInstructionPrefix: '받은 메일함을 열어 ',
      sentInstructionEmphasis: '비밀번호 재설정 링크',
      sentInstructionSuffix: '를 눌러주세요.',
      spamHint: '메일이 보이지 않으면 스팸함도 확인해주세요.',
      unverifiedHelp:
        '이메일 인증이 완료되지 않은 계정에는 재설정 메일이 발송되지 않습니다. 아래에서 인증 메일을 먼저 받아 인증을 완료한 뒤 다시 시도해주세요.',
      verifyResent: '인증 메일을 보냈습니다(가입·미인증 계정인 경우). 인증 완료 후 다시 시도해주세요.',
    },
    resetPassword: {
      genericError: '비밀번호 재설정에 실패했습니다. 잠시 후 다시 시도해주세요.',
      expiredToken: '재설정 링크가 만료되었습니다. 비밀번호 찾기를 다시 진행해주세요.',
      invalidToken: '유효하지 않은 재설정 링크입니다. 비밀번호 찾기를 다시 진행해주세요.',
      passwordMismatch: '새 비밀번호가 일치하지 않습니다.',
      passwordLength: '새 비밀번호는 8~50자 사이여야 합니다.',
      missingTokenTitle: '유효하지 않은 링크',
      missingTokenDescription: '재설정 링크가 올바르지 않습니다. 비밀번호 찾기를 다시 진행해주세요.',
      doneTitle: '비밀번호 변경 완료',
      doneDescription: '새 비밀번호로 변경되었습니다. 보안을 위해 다른 기기의 로그인은 모두 해제되었습니다.',
    },
    verifyEmail: {
      missingToken: '유효하지 않은 인증 링크입니다. 메일의 링크를 다시 확인해주세요.',
      expiredToken: '인증 링크가 만료되었습니다. 아래에서 인증 메일을 다시 받아주세요.',
      invalidToken: '유효하지 않거나 이미 사용된 인증 링크입니다. 아래에서 인증 메일을 다시 받아주세요.',
      verifying: '이메일 인증을 확인하고 있습니다…',
      successTitle: '이메일 인증 완료',
      successDescription: '이메일 인증이 정상적으로 완료되었습니다.',
      failTitle: '인증에 실패했습니다',
      resendSent: '입력하신 이메일이 가입되어 있고 미인증 상태라면, 인증 메일을 보내드렸습니다. 메일함을 확인해주세요.',
    },
    suspendedAccount: {
      title: '이용이 제한된 계정입니다',
      description: '커뮤니티 이용약관 위반이 확인되어 계정 이용이 정지되었습니다.',
      inquiryTitle: '정지 사유 확인·해제 문의',
      inquiryDescriptionPrefix: '정지 사유가 궁금하거나 해제를 원하시면 아래 이메일로 문의해주세요. 확인이 빠르도록 ',
      inquiryDescriptionEmphasis: '가입하신 이메일 주소와 닉네임',
      inquiryDescriptionSuffix: '을 함께 적어주세요.',
      mailSubject: (siteName: string) => `[${siteName}] 계정 정지 문의`,
      mailBody: '아래 정보를 확인해 계정 정지 관련 문의를 남깁니다.',
    },
  },

  mypage: {
    loginGateSuffix: '후 마이페이지를 이용할 수 있습니다.',
    emailVerification: {
      bannerTitle: '이메일 인증이 필요합니다',
      invalidDomain: '메일을 받을 수 없는 이메일 주소입니다. 이메일을 다시 확인해주세요.',
      sendFailed: '인증 메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.',
      sentAfterEmail: '으로 인증 메일을 보냈습니다. 메일함(스팸함 포함)의 링크를 눌러 인증을 완료해주세요.',
      notVerifiedInfo: '모든 기능은 이용할 수 있지만, 비밀번호 찾기 등 계정 보호를 위해 이메일 인증을 권장합니다.',
    },
    profileSettings: {
      bioTooLong: (max: number) => `자기소개는 ${max}자 이하여야 합니다.`,
      bioSaved: '자기소개가 저장되었습니다.',
      bioSaveFailed: '자기소개 저장에 실패했습니다.',
      nicknameLength: '닉네임은 2~20자 사이여야 합니다.',
      nicknamePattern: '닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.',
      nicknameSameAsCurrent: '현재 닉네임과 동일합니다.',
      nicknameChanged: '닉네임이 변경되었습니다.',
      nicknameChangeFailed: '닉네임 변경에 실패했습니다.',
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

  points: {
    roulette: {
      unlockFailed: '고정 해제에 실패했습니다.',
      lockFailed: '상대 고정에 실패했습니다.',
      betRequired: '배팅액을 입력해주세요.',
      betRange: (min: string, max: string) => `배팅액은 ${min}P ~ ${max}P 사이여야 합니다.`,
      betUnitMismatch: (unit: string) => `배팅액은 ${unit}P 단위로만 가능합니다.`,
      spinFailed: '룰렛 진행에 실패했습니다.',
      win: (nickname: string, amount: string) => `${nickname}님 개발라버리고 ${amount}P 뜯어왔습니다!`,
      lose: (nickname: string, amount: string) => `${nickname}님한테 존나 털렸습니다... ${amount}P 헌납.`,
      randomOpponentHint: '다음 스핀은 랜덤 상대와 겨룹니다.',
    },
    pointInfo: {
      checkinDescription: '매일 로그인할 때 하루 한 번, 포인트를 조금 얻거나 반대로 조금 잃어요.',
      rouletteDescription:
        '원하는 만큼 직접 배팅해서 다른 회원과 겨루는 게임이에요. 이기면 상대의 포인트를 가져오고 지면 내 포인트를 잃으며, 판마다 배팅액의 일부가 수수료로 빠져나가요.',
    },
    roulettePage: {
      loginGateSuffix: '후 룰렛을 이용할 수 있습니다.',
      description: '원하는 만큼 배팅해서 다른 회원과 겨뤄보세요.',
    },
    checkin: {
      gainedPrefix: '개꿀, 공짜로 ',
      gainedSuffix: ' 득템했습니다!',
      lostPrefix: '오늘 재수 존나 없네요. ',
      lostSuffix: '가 그냥 날아갔습니다.',
      neutral: '출첵은 했는데 오늘은 그냥 본전입니다. 다음엔 존나 터지겠죠.',
    },
    // 룰렛 승/패 알림(POINT_STOLEN/POINT_WON). lib/notification.ts(순수 텍스트)와
    // NotificationBell.tsx(강조 포함 JSX)가 동일한 prefix/suffix를 조합해 쓴다.
    notification: {
      stolenAfterName: '님한테 포인트 룰렛에서 존나 털렸습니다. ',
      stolenSuffix: ' 헌납. 이대로 끝내실 겁니까?',
      wonAfterName: '님을 포인트 룰렛에서 개발라버리고 ',
      wonSuffix: '를 뜯어왔습니다!',
    },
  },

  post: {
    form: {
      categoryRequired: '카테고리를 선택해주세요.',
      titleRequired: '제목을 입력해주세요.',
      titleTooLong: '제목은 100자 이하여야 합니다.',
      contentRequired: '내용을 입력해주세요.',
      contentTooLong: (max: string) => `본문은 ${max}자 이하여야 합니다.`,
      imageUploading: '이미지 업로드가 끝난 뒤 저장해주세요.',
      loginGateSuffix: '후 글을 작성할 수 있습니다.',
    },
    deleteConfirm: '게시글을 삭제하시겠습니까?',
    editor: {
      unsupportedFormat: '지원하지 않는 형식입니다. (jpg, jpeg, png, gif, webp)',
      fileTooLarge: (ext: string, maxMb: number, sizeMb: string) =>
        `${ext.toUpperCase()} 파일은 ${maxMb}MB 이하여야 합니다. (현재 약 ${sizeMb}MB)`,
      tooManyImages: (max: number) => `이미지는 최대 ${max}장까지 첨부할 수 있습니다.`,
      uploadFailed: '이미지 업로드에 실패했습니다.',
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
      loginGateSuffix: '후 댓글을 작성할 수 있습니다.',
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
      gradeChangeConfirm: (nickname: string, label: string) => `${nickname}님의 등급을 '${label}'(으)로 변경할까요?`,
      gradeChangeFailed: '등급 변경에 실패했습니다.',
      suspendConfirm: (nickname: string) =>
        `${nickname}님의 계정을 정지할까요?\n정지되면 해당 회원은 즉시 로그아웃되며 로그인할 수 없습니다.`,
      unsuspendConfirm: (nickname: string) => `${nickname}님의 계정 정지를 해제할까요?`,
      statusChangeFailed: '상태 변경에 실패했습니다.',
      searchEmpty: (keyword: string) => `'${keyword}' 검색 결과가 없습니다.`,
      empty: '회원이 없습니다.',
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
      imageUploading: '이미지 업로드가 끝난 뒤 저장해주세요.',
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
      suspendUserConfirm: (target: string, count: number) =>
        `'${target}' 회원을 정지할까요?\n\n` +
        `· 해당 회원은 즉시 로그아웃되며 로그인할 수 없습니다.\n` +
        `· 이 회원에 접수된 신고 ${count}건이 '조치 완료'로 처리됩니다.`,
      suspendUserFailed: '회원 정지에 실패했습니다.',
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
