// src/config/api.ts
/**
 * 현재 앱은 Debug·로컬 테스트·TestFlight/Release 모두 스테이징 서버를
 * 사용합니다. 운영 서버가 실제로 준비되기 전까지는 환경을 자동으로
 * production으로 전환하지 않아 죽은 주소나 운영 데이터에 연결되는 것을
 * 방지합니다.
 *
 * 운영 배포를 시작할 때는 production 주소를 추가하고 빌드 환경값으로
 * 명시적으로 선택하도록 전환해야 합니다.
 */
export const API_ENVIRONMENT = 'staging' as const;

const API_ENDPOINTS = {
  staging: 'https://staging-api.mannabom.com',
} as const;

// API 기본 URL
export const API_BASE_URL = API_ENDPOINTS[API_ENVIRONMENT];

// API 엔드포인트들
export const API_ENDPOINTS_LIST = {
  // 인증 관련
  KAKAO_LOGIN: '/api/auth/login/kakao',
  TOKEN_REFRESH: '/api/auth/refresh',
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
  USER_ALL_PHOTOS: '/api/user/all_photos',
  USER_PHOTO: '/api/user/photo',
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
  LIKE_SEND: '/api/likeRequest/send',
  MESSAGE_SEND: '/api/messageRequest/send',
  SCORE_IS_RECEIVED: '/api/score/isReceived',
  SCORE_RECEIVED: '/api/score/received',
  INTEREST_RECEIVED: '/api/interest/received',
  INTEREST_SENT: '/api/interest/sent',
  LIKE_RESPOND: '/api/match/like/respond',
  MESSAGE_RESPOND: '/api/match/message/respond',

  // 채팅 관련
  CHAT_SYNC_LIST: '/api/chat/sync/list',
  CHAT_SYNC_MESSAGES: '/api/chat/sync/chat/{roomId}',
  CHAT_HISTORY_MESSAGES: '/api/chat/history/chat/{roomId}',
  CHAT_MARK_READ: '/api/chat/rooms/{roomId}/read',
  CHAT_ROOM_LEAVE: '/api/chat/rooms/{roomId}/leave',
  CHAT_LOVEVIEW_PROFILE_REQUEST: '/api/chat/loveview/profile/request',
  CHAT_LOVEVIEW_PROFILE_RESPONSE: '/api/chat/loveview/profile/response',
  CHAT_LOVEVIEW_PROFILE_STATUS: '/api/chat/loveview/profile/checkStatus',
  CHAT_MEETING_VERIFY: '/api/chat/meeting/verify',

  // 신고 관련
  REPORT_CHAT: '/api/report/chat',
  REPORT_PROFILE: '/api/report/profile',

  // 미팅 관련
  MEETING_MY_STATUS: '/api/meeting/my-status',
  MEETING_ROOMS_SEARCH: '/api/meeting/rooms/search',
  MEETING_MEMBER_PROFILES: '/api/meeting/member-profiles/{roomId}',
  MEETING_ROOM_CREATE: '/api/meeting/rooms/create',
  MEETING_ROOM_JOIN: '/api/meeting/rooms/join',
  MEETING_ROOM_JOIN_BY_CODE: '/api/meeting/rooms/join-by-code',
  MEETING_ROOM_LEAVE: '/api/meeting/rooms/leave',
  MEETING_MATCHING_START: '/api/meeting/matching/start',
  MEETING_MATCHING_CANCEL: '/api/meeting/matching/cancel',
  MEETING_MATCHING_CONTINUE: '/api/meeting/matching/continue',
  MEETING_MATCHING_RESULT: '/api/meeting/matching/result/{roomId}',
  MEETING_MATCHING_ACCEPT: '/api/meeting/matching/accept',
  MEETING_MATCHING_REJECT: '/api/meeting/matching/reject',
  MEETING_EVENTS_STREAM: '/api/meeting/events/stream',

} as const;

/** 확정된 약관·가입 완료 API 경로입니다. */
export const PREPARED_SIGNUP_API_ENDPOINTS = {
  TERMS_CONTENT: '/api/signup/terms/{termType}',
  TERMS_AGREEMENT: '/api/signup/terms-agreement',
  SIGNUP_COMPLETE: '/api/signup/complete',
} as const;

/**
 * 백엔드 구현 전 사전 등록한 관리자 전용 신고 API 경로입니다.
 *
 * 일반 사용자 앱에서는 호출하지 않습니다. 특히 신고 처리 API는 응답 계약이
 * 아직 없으므로 서비스 메서드도 만들지 않습니다.
 */
export const PREPARED_ADMIN_REPORT_API_ENDPOINTS = {
  LIST: '/admin/report/list',
  ACTION: '/admin/report/action',
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
    url = url.replace(`{${key}}`, encodeURIComponent(value));
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
