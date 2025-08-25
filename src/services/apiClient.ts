// src/services/apiClient.ts
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10초 타임아웃
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  config => {
    console.log('🌐 API 요청:', config.method?.toUpperCase(), config.url);
    console.log('📝 요청 데이터:', config.data);
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

    // 개발 모드에서는 Mock 응답 반환
    if (__DEV__ && error.code === 'ECONNREFUSED') {
      console.log('🔧 개발 모드: Mock 응답 반환');
      return Promise.resolve({
        data: {
          success: true,
          message: 'Mock 응답 (개발 모드)',
          data: {
            emailSent: true,
            verified: true,
            isAvailable: Math.random() > 0.5, // 50% 확률로 사용 가능
          },
        },
      });
    }

    return Promise.reject(error);
  },
);

export default apiClient;
