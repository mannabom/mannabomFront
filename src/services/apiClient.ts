// src/services/apiClient.ts
import axios, { AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config/api';
import { getAuthTokens } from '../utils/AuthUtils';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

apiClient.defaults.headers.common['Content-Type'] = 'application/json';

const maskToken = (token?: string | null) => {
  if (!token) return 'NO';
  const head = token.slice(0, 12);
  const tail = token.slice(-8);
  return `YES(${head}...${tail}, len=${token.length})`;
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

    // ✅ headers 타입 안전 처리
    if (!config.headers) {
      config.headers = new AxiosHeaders();
    } else if (!(config.headers instanceof AxiosHeaders)) {
      config.headers = AxiosHeaders.from(config.headers);
    }

    if (accessToken) {
      config.headers.set('Authorization', `Bearer ${accessToken}`);
    } else {
      config.headers.delete('Authorization');
    }

    if (!config.headers.has('Content-Type')) {
      config.headers.set('Content-Type', 'application/json');
    }

    // ✅ "실제로 Authorization이 들어갔는지" 최종 확인 로그 (타입 안전)
    const authHeaderRaw = config.headers.get('Authorization');

    if (typeof authHeaderRaw === 'string' && authHeaderRaw.length > 0) {
      // 문자열일 때만 replace 가능
      const tokenOnly = authHeaderRaw.replace(/^Bearer\s+/i, '');
      console.log(
        '🧷 Authorization 헤더:',
        `Bearer ${tokenOnly.slice(0, 12)}...${tokenOnly.slice(-8)}`,
      );

      // ⚠️ 개발 중에만 전체 토큰이 필요하면 아래 주석 해제 (절대 배포 금지)
      // if (__DEV__) console.log('🧷 Authorization FULL:', authHeaderRaw);
    } else {
      console.log('🧷 Authorization 헤더: (none or non-string)', authHeaderRaw);
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

    const wwwAuth = error.response?.headers?.['www-authenticate'];
    if (wwwAuth) {
      console.warn('🧾 WWW-Authenticate:', wwwAuth);
    }

    if (status === 401) {
      console.warn('📄 에러 데이터(401):', data);
      console.warn('🔑 인증 만료/미인증 - 로그인 필요');
    } else {
      console.error('📄 에러 데이터:', data);
    }

    return Promise.reject(error);
  },
);

export default apiClient;
