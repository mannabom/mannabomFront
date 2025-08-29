// src/services/apiClient.ts
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { getAuthTokens } from '../utils/AuthUtils';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15초 타임아웃
});

// 요청 인터셉터 - 자동으로 JWT 토큰 추가
apiClient.interceptors.request.use(
  async config => {
    console.log('🌐 API 요청:', config.method?.toUpperCase(), config.url);
    console.log('📝 요청 데이터:', config.data);

    // 인증이 필요한 요청에 토큰 추가
    const { accessToken } = await getAuthTokens();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  error => {
    console.error('❌ 요청 인터셉터 에러:', error);
    return Promise.reject(error);
  },
);

// 응답 인터셉터
apiClient.interceptors.response.use(
  response => {
    console.log('✅ API 응답:', response.status, response.config.url);
    console.log('📄 응답 데이터:', response.data);
    return response;
  },
  error => {
    console.error('❌ API 에러:', error.response?.status, error.config?.url);
    console.error('📄 에러 데이터:', error.response?.data);

    // 401 Unauthorized 처리
    if (error.response?.status === 401) {
      console.log('🔑 인증 만료 - 로그인 필요');
      // 필요시 로그아웃 처리나 토큰 갱신 로직 추가
    }

    // 500번대 서버 에러 처리
    if (error.response?.status >= 500) {
      console.error('🔥 서버 오류 발생');
    }

    // 개발 모드에서 연결 실패시에만 Mock 응답 반환 (실제 테스트시에는 제거 가능)
    if (
      __DEV__ &&
      (error.code === 'ECONNREFUSED' ||
        error.code === 'NETWORK_ERROR' ||
        error.message.includes('Network Error'))
    ) {
      console.log('🔧 개발 모드: 서버 연결 실패 - 실제 에러 처리');

      // 실제 테스트를 위해 에러를 그대로 전달
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

export default apiClient;
