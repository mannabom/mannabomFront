import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { getAuthTokens } from '../utils/AuthUtils';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

apiClient.interceptors.request.use(
  async config => {
    const method = config.method?.toUpperCase();
    const url = `${config.baseURL ?? ''}${config.url ?? ''}`;

    const { accessToken } = await getAuthTokens();

    console.log('🌐 API 요청:', method, url);
    console.log('📝 요청 데이터:', config.data ?? '(none)');
    console.log(
      '🔑 토큰 유무:',
      accessToken ? `YES(${accessToken.slice(0, 12)}...)` : 'NO',
    );

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

apiClient.interceptors.response.use(
  response => {
    const url = `${response.config.baseURL ?? ''}${response.config.url ?? ''}`;
    console.log('✅ API 응답:', response.status, url);
    console.log('📄 응답 데이터:', response.data);
    return response;
  },
  error => {
    const url = `${error.config?.baseURL ?? ''}${error.config?.url ?? ''}`;
    console.error('❌ API 에러:', error.response?.status, url);
    console.error('📄 에러 데이터:', error.response?.data);
    return Promise.reject(error);
  },
);

export default apiClient;
