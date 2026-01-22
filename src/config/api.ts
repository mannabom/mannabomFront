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
  EMAIL_VERIFICATION: '/api/signup/send-email-verification', // 이메일 인증번호 발송
  EMAIL_VERIFY: '/api/signup/verify-email', // 이메일 인증번호 확인
  NICKNAME_CHECK: '/api/signup/check-nickname', // 닉네임 중복 확인
  SET_NICKNAME: '/api/signup/set-nickname', // 닉네임 설정
  SAVE_PROFILE_RELATIONSHIP: '/api/signup/profile-relationship', // 기본 프로필 및 연인과의 정보 저장
  PROFILE_PHOTOS: '/api/signup/profile-photos', // 프로필 사진 업로드 (이미지 데이터)
  TERMS_CONTENT: '/api/signup/terms/{termType}', // 약관 내용 조회 (약관 내용 및 실제 버전 식별 해쉬 제공)
  TERMS_AGREEMENT: '/api/signup/terms-agreement', // 약관 동의
  SIGNUP_COMPLETE: '/api/signup/complete', // 회원가입 완료 후 나온 즉시 통과 모금

  // 질문 관련
  QUESTIONS: '/questions', // 모든 질문 목록 반환
  QUESTIONS_BY_TYPE: '/questions/type/{questionType}', // 특정 유형 질문만 조회

  // 사용자 관련
  USER_PROFILE: '/api/user/info',
  USER_UPDATE: '/api/user/update',
  USER_MAIN_PHOTO: '/api/user/main_photo',
  USER_MEMBERSHIP: '/api/user/membership',

  // 데이팅 관련 (새로 추가)
  PROFILE_MATCH_SIMPLE: '/api/match/profile/simple', // 프로필 매칭 요청
  PROFILE_RATE: '/api/match/profile/rate', // 프로필 평가
  LOVEVIEW_MATCH_SIMPLE: '/api/match/loveview/simple', // 연애관 매칭 요청
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

// 데이팅 API URL 생성 헬퍼 (새로 추가)
export const getDatingApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};

// 현재 설정 확인용 (개발시에만 사용)
if (__DEV__) {
  console.log('🌐 현재 API 서버:', API_BASE_URL);
}
