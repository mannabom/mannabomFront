// src/config/kakao.ts
export const KAKAO_CONFIG = {
  // 카카오 디벨로퍼스에서 받은 앱 키
  KAKAO_APP_KEY: '1dcde956df0ac717b794b42d7aa470d6',

  // 리다이렉트 URI (카카오 디벨로퍼스에서 설정한 것과 동일해야 함)
  REDIRECT_URI: 'kakao1dcde956df0ac717b794b42d7aa470d6://oauth',
};

// 개발용 Mock 설정
export const MOCK_KAKAO_CONFIG = {
  ENABLED: __DEV__, // 개발 모드에서만 Mock 사용
  DELAY_MS: 1500, // Mock 응답 지연시간
};
