// src/services/apiClient.ts
import axios, { AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config/api';
import { getAuthTokens } from '../utils/AuthUtils';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Content-Type 기본 세팅 (axios가 자동도 하지만 명시)
apiClient.defaults.headers.common['Content-Type'] = 'application/json';

const maskToken = (token?: string | null) => {
  if (!token) return 'NO';
  return `YES(${token.slice(0, 12)}...)`;
};

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const isAbsolute =
      typeof config.url === 'string' && /^https?:\/\//.test(config.url);
    const fullUrl = isAbsolute
      ? config.url
      : `${config.baseURL ?? ''}${config.url ?? ''}`;

    console.log('🌐 API 요청:', (config.method || 'GET').toUpperCase(), fullUrl);
    console.log('📝 요청 데이터:', config.data ?? '(none)');

    const { accessToken } = await getAuthTokens();
    console.log('🔑 토큰 유무:', maskToken(accessToken));

    // ✅ headers 타입 안전 처리 (AxiosHeaders로 통일)
    if (!config.headers) {
      config.headers = new AxiosHeaders();
    } else if (!(config.headers instanceof AxiosHeaders)) {
      config.headers = AxiosHeaders.from(config.headers);
    }

    if (accessToken) {
      config.headers.set('Authorization', `Bearer ${accessToken}`);
    } else {
      // 토큰 없으면 Authorization 제거 (혹시 남아있을까봐)
      config.headers.delete('Authorization');
    }

    // Content-Type도 확실히
    if (!config.headers.has('Content-Type')) {
      config.headers.set('Content-Type', 'application/json');
    }

    return config;
  },
  error => {
    console.error('❌ 요청 인터셉터 에러:', error);
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  response => {
    const isAbsolute =
      typeof response.config.url === 'string' &&
      /^https?:\/\//.test(response.config.url);
    const fullUrl = isAbsolute
      ? response.config.url
      : `${response.config.baseURL ?? ''}${response.config.url ?? ''}`;

    console.log('✅ API 응답:', response.status, fullUrl);
    console.log('📄 응답 데이터:', response.data);
    return response;
  },
  error => {
    const status = error.response?.status;
    const data = error.response?.data;

    const isAbsolute =
      typeof error.config?.url === 'string' &&
      /^https?:\/\//.test(error.config.url);
    const fullUrl = isAbsolute
      ? error.config?.url
      : `${error.config?.baseURL ?? ''}${error.config?.url ?? ''}`;

    console.error('❌ API 에러:', status, fullUrl);
    console.error('📄 에러 데이터:', data);

    if (status === 401) {
      console.log('🔑 인증 만료/미인증 - 로그인 필요');
    }

    return Promise.reject(error);
  },
);

export default apiClient;
