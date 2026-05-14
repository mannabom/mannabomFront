// src/services/apiClient.ts
import axios, { AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config/api';
import { getAuthTokens } from '../utils/AuthUtils';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

apiClient.defaults.headers.common['Content-Type'] = 'application/json';

const REDACTED = '[REDACTED]';
const SENSITIVE_KEYS = new Set([
  'accessToken',
  'refreshToken',
  'authorization',
  'deviceToken',
  'fcmToken',
  'token',
  'email',
  'birthDate',
  'profileImage',
  'profileImageUrl',
  'photoURL',
  'photoUrl',
  'photos',
]);

const maskToken = (token?: string | null) => {
  if (!token) return 'NO';
  return `YES(len=${token.length})`;
};

const isFormDataLike = (value: unknown) =>
  !!value && typeof value === 'object' && String(value).includes('FormData');

const sanitizeForLog = (value: unknown): unknown => {
  if (value == null) return value;
  if (isFormDataLike(value)) return '[FormData]';
  if (Array.isArray(value)) return value.map(sanitizeForLog);

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        SENSITIVE_KEYS.has(key) ? REDACTED : sanitizeForLog(item),
      ]),
    );
  }

  return value;
};

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const isAbsolute =
      typeof config.url === 'string' && /^https?:\/\//.test(config.url);

    const fullUrl = isAbsolute
      ? config.url
      : `${config.baseURL ?? ''}${config.url ?? ''}`;

    if (__DEV__) {
      console.log('🌐 API 요청:', (config.method || 'GET').toUpperCase(), fullUrl);
      console.log('📝 요청 데이터:', sanitizeForLog(config.data) ?? '(none)');
    }

    const { accessToken } = await getAuthTokens();
    if (__DEV__) {
      console.log('🔑 토큰 유무:', maskToken(accessToken));
    }

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

    if (__DEV__) {
      console.log(
        '🧷 Authorization 헤더:',
        config.headers.has('Authorization') ? 'Bearer [REDACTED]' : '(none)',
      );
    }

    return config;
  },
  error => {
    if (__DEV__) console.warn('❌ 요청 인터셉터 에러:', error);
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

    if (__DEV__) {
      console.log('✅ API 응답:', response.status, fullUrl);
      console.log('📄 응답 데이터:', sanitizeForLog(response.data));
    }
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

    if (__DEV__) console.warn('❌ API 에러:', status, fullUrl);

    const wwwAuth = error.response?.headers?.['www-authenticate'];
    if (wwwAuth) {
      if (__DEV__) console.warn('🧾 WWW-Authenticate:', wwwAuth);
    }

    if (status === 401) {
      if (__DEV__) {
        console.warn('📄 에러 데이터(401):', sanitizeForLog(data));
        console.warn('🔑 인증 만료/미인증 - 로그인 필요');
      }
    } else {
      if (__DEV__) console.warn('📄 에러 데이터:', sanitizeForLog(data));
    }

    return Promise.reject(error);
  },
);

export default apiClient;
