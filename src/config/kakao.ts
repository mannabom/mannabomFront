// src/config/kakao.ts
export const KAKAO_CONFIG = {
  // 카카오 디벨로퍼스에서 받은 앱 키
  KAKAO_APP_KEY: 'd2adb1b780d8c7260ffd12e0d6bf9640', // 실제 앱 키로 교체 필요

  // 리다이렉트 URI (카카오 디벨로퍼스에서 설정한 것과 동일해야 함)
  REDIRECT_URI: 'kakaod2adb1b780d8c7260ffd12e0d6bf9640://oauth',
};

// 개발용 Mock 설정
export const MOCK_KAKAO_CONFIG = {
  ENABLED: __DEV__, // 개발 모드에서만 Mock 사용
  DELAY_MS: 1500, // Mock 응답 지연시간
};
