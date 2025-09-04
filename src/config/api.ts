// src/config/api.ts
// 환경별 API 주소 설정
const API_ENDPOINTS = {
  development: 'http://13.125.168.179:8080', // 백엔드 개발 서버
  production: 'https://api.mannabom.com', // 실제 배포된 서버 주소 (여기를 실제 주소로 변경)
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
  KAKAO_LOGIN: '/login/kakao',
  TOKEN_REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',

  // 회원가입 관련
  EMAIL_VERIFICATION: '/auth/email/send',
  EMAIL_VERIFY: '/auth/email/verify',
  NICKNAME_CHECK: '/auth/nickname/check',
  SET_NICKNAME: '/set-nickname',
  SIGNUP_COMPLETE: '/complete',
  REGISTER: '/auth/register', // 이 엔드포인트는 실제 회원가입 완료 시 사용될 것

  // 프로필 관련
  SAVE_PROFILE_RELATIONSHIP: '/profile/relationship',
  PROFILE_PHOTOS: '/profile-photos', // 사진 업로드 엔드포인트

  // 약관 관련
  TERMS_CONTENT: '/api/signup/terms', // 약관 내용 조회
  TERMS_AGREEMENT: '/terms-agreement', // 약관 동의

  // 사용자 관련
  USER_PROFILE: '/user/profile',
  USER_UPDATE: '/user/update',
} as const;

// API 호출 헬퍼
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// 현재 설정 확인용 (개발시에만 사용)
if (__DEV__) {
  console.log('🌐 현재 API 서버:', API_BASE_URL);
}
