import axios, { AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config/api';
import { getSignupSession } from '../utils/AuthUtils';

/**
 * 가입 진행 API 전용 클라이언트입니다.
 *
 * 가입 완료 전에는 정식 accessToken이 없으므로 Authorization 헤더를 사용하지
 * 않고, 카카오 로그인에서 받은 20분짜리 signupToken만 전송합니다.
 */
const signupApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

signupApiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const signupSession = await getSignupSession();
    if (!signupSession) {
      throw new Error(
        '가입 인증 정보가 없거나 만료되었습니다. 카카오 로그인을 다시 진행해주세요.',
      );
    }

    if (!config.headers) {
      config.headers = new AxiosHeaders();
    } else if (!(config.headers instanceof AxiosHeaders)) {
      config.headers = AxiosHeaders.from(config.headers);
    }

    // 이전 로그인 세션이 기기에 남아 있더라도 가입 API에는 보내지 않습니다.
    config.headers.delete('Authorization');
    config.headers.set('X-Signup-Token', signupSession.signupToken);

    if (!config.headers.has('Content-Type')) {
      config.headers.set('Content-Type', 'application/json');
    }

    if (__DEV__) {
      const fullUrl = `${config.baseURL ?? ''}${config.url ?? ''}`;
      console.log(
        '🌱 가입 API 요청:',
        (config.method || 'GET').toUpperCase(),
        fullUrl,
      );
    }

    return config;
  },
  error => Promise.reject(error),
);

signupApiClient.interceptors.response.use(
  response => response,
  error => {
    if (error?.response?.status === 401) {
      error.message =
        '가입 인증 시간이 만료되었습니다. 카카오 로그인을 다시 진행해주세요.';
    }
    if (__DEV__) {
      console.warn(
        '❌ 가입 API 오류:',
        error?.response?.status,
        error?.config?.url,
      );
    }
    return Promise.reject(error);
  },
);

export default signupApiClient;
