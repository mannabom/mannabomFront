// src/config/api.ts
// 환경별 API 주소 설정
const API_ENDPOINTS = {
  development: 'http://3.35.234.95:8080',
  production: 'https://api.mannabom.com',
};

// 현재 환경 확인
const getCurrentEnvironment = (): keyof typeof API_ENDPOINTS => {
  if (__DEV__) {
    return 'development'; // React Native 개발 모드에서는 개발 서버
  } else {
    return 'production'; // 릴리즈 빌드에서는 배포 서버
  }
};

// API 기본 URL
export const API_BASE_URL = API_ENDPOINTS[getCurrentEnvironment()];

// API 엔드포인트들
export const API_ENDPOINTS_LIST = {
  // 인증 관련
  KAKAO_LOGIN: '/api/auth/login/kakao',
  TOKEN_REFRESH: '/auth/refresh',
  LOGOUT: '/api/auth/logout',
  LEAVE: '/api/auth/leave',
  // 회원가입 관련 (API 문서에 맞게 수정)
  EMAIL_VERIFICATION: '/api/signup/send-email-verification',
  EMAIL_VERIFY: '/api/signup/verify-email',
  NICKNAME_CHECK: '/api/signup/check-nickname',
  SET_NICKNAME: '/api/signup/set-nickname',
  SAVE_PROFILE_RELATIONSHIP: '/api/signup/profile-relationship',
  PROFILE_PHOTOS: '/api/signup/profile-photos',
  TERMS_CONTENT: '/api/signup/terms/{termType}',
  TERMS_AGREEMENT: '/api/signup/terms-agreement',
  SIGNUP_COMPLETE: '/api/signup/complete',

  // 질문 관련
  QUESTIONS: '/questions',
  QUESTIONS_BY_TYPE: '/questions/type/{questionType}',
  
  //디바이스 토큰 관련
  DEVICE_TOKENS: '/api/device-tokens',


  // 사용자 관련
  USER_PROFILE: '/api/user/info',
  USER_UPDATE: '/api/user/update',
  USER_MAIN_PHOTO: '/api/user/main_photo',
  USER_MEMBERSHIP: '/api/user/membership',

  // 데이팅 관련
  PROFILE_MATCH_SIMPLE: '/api/match/profile/simple', // ✅ 당일 무료권
  PROFILE_MATCH_SIMPLE_EXTRA: '/api/match/profile/simple/extra', // ✅ 혜택권(구독/재화)
  PROFILE_MATCH_SIMPLE_TODAY: '/api/match/profile/simple/today',
  PROFILE_RATE: '/api/match/profile/rate',
  LOVEVIEW_MATCH_SIMPLE: '/api/match/loveview/simple',
  LOVEVIEW_MATCH_SIMPLE_EXTRA: '/api/match/loveview/simple/extra',
  LOVEVIEW_MATCH_SIMPLE_TODAY: '/api/match/loveview/simple/today',
  EXTRA_PROFILE_BY_TING: '/api/extra_profile/ting',
  CHECK_TING_WALLET: '/api/check_tingwallet',
  PROFILE_DETAIL: '/api/profile/detail',
  LOVEVIEW_DETAIL: '/api/loveview/detail',
  PROFILE_DETAIL_EXTRA_PHOTO: '/api/profile/detail/extra_photo',
  LIKE_SEND: '/api/like/send',
  MESSAGE_SEND: '/api/messageRequest/send',
  SCORE_IS_RECEIVED: '/api/score/isReceived',
  SCORE_RECEIVED: '/api/score/received',

} as const;

// API 호출 헬퍼
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// Path parameter를 포함한 URL 생성 헬퍼
export const getApiUrlWithParams = (
  endpoint: string,
  params: Record<string, string>,
): string => {
  let url = endpoint;
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`{${key}}`, value);
  });
  return `${API_BASE_URL}${url}`;
};

// 데이팅 API URL 생성 헬퍼
export const getDatingApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// 현재 설정 확인용 (개발시에만 사용)
if (__DEV__) {
  console.log('🌐 현재 API 서버:', API_BASE_URL);
}
