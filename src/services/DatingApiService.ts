// src/services/DatingApiService.ts
import { API_BASE_URL, API_ENDPOINTS_LIST } from '../config/api';
import {
  ProfileMatchConditionRequest,
  ProfileMatchConditionResponse,
  MatchProfileRatingRequest,
  LoveViewMatchConditionRequest,
  LoveViewMatchConditionResponse,
} from '../types/DatingAPI';

class DatingApiService {
  // 프로필 매칭 요청 (실제 API)
  async getMatchingProfile(
    condition: ProfileMatchConditionRequest,
  ): Promise<ProfileMatchConditionResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS_LIST.PROFILE_MATCH_SIMPLE}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // TODO: Authorization 헤더 추가 필요
            // 'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(condition),
        },
      );

      if (!response.ok) {
        throw new Error(`프로필 매칭 요청 실패: ${response.status}`);
      }

      const data: ProfileMatchConditionResponse = await response.json();

      // 로그 출력 (개발 모드에서만)
      if (__DEV__) {
        console.log('프로필 매칭 성공:', data);
      }

      return data;
    } catch (error) {
      console.error('프로필 매칭 API 오류:', error);
      throw error;
    }
  }

  // 프로필 평가 (실제 API)
  async rateProfile(ratingData: MatchProfileRatingRequest): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS_LIST.PROFILE_RATE}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // TODO: Authorization 헤더 추가 필요
          },
          body: JSON.stringify(ratingData),
        },
      );

      // 로그 출력
      if (__DEV__) {
        console.log('프로필 평가 요청:', ratingData);
        console.log('프로필 평가 응답:', response.status);
      }

      // 200이면 성공, 500이면 실패
      return response.status === 200;
    } catch (error) {
      console.error('프로필 평가 API 오류:', error);
      throw error;
    }
  }

  // 연애관 매칭 요청 (실제 API)
  async getLoveViewMatching(
    condition: LoveViewMatchConditionRequest,
  ): Promise<LoveViewMatchConditionResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS_LIST.LOVEVIEW_MATCH_SIMPLE}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // TODO: Authorization 헤더 추가 필요
          },
          body: JSON.stringify(condition),
        },
      );

      if (!response.ok) {
        throw new Error(`연애관 매칭 요청 실패: ${response.status}`);
      }

      const data: LoveViewMatchConditionResponse = await response.json();

      if (__DEV__) {
        console.log('연애관 매칭 성공:', data);
      }

      return data;
    } catch (error) {
      console.error('연애관 매칭 API 오류:', error);
      throw error;
    }
  }

  // API 상태 확인 (헬스체크용) - timeout 제거하고 AbortController 사용
  async checkApiHealth(): Promise<boolean> {
    try {
      // 5초 타임아웃을 위한 AbortController 사용
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('API 상태 확인 실패:', error);
      return false;
    }
  }
}

// 싱글톤 인스턴스로 export
export const datingApiService = new DatingApiService();
