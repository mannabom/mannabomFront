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
  // ✅ 프로필 매칭 요청 (당일 무료권)
  async getMatchingProfile(
    condition: ProfileMatchConditionRequest,
  ): Promise<ProfileMatchConditionResponse> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS_LIST.PROFILE_MATCH_SIMPLE}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(condition),
      },
    );

    if (!response.ok) {
      throw new Error(`프로필 매칭 요청 실패: ${response.status}`);
    }

    const data: ProfileMatchConditionResponse = await response.json();
    if (__DEV__) console.log('프로필 매칭(무료권) 성공:', data);
    return data;
  }

  // ✅ 프로필 매칭 요청 (혜택권)
  async getMatchingProfileExtra(
    condition: ProfileMatchConditionRequest,
  ): Promise<ProfileMatchConditionResponse> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS_LIST.PROFILE_MATCH_SIMPLE_EXTRA}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(condition),
      },
    );

    if (!response.ok) {
      throw new Error(`프로필 매칭(혜택권) 요청 실패: ${response.status}`);
    }

    const data: ProfileMatchConditionResponse = await response.json();
    if (__DEV__) console.log('프로필 매칭(혜택권) 성공:', data);
    return data;
  }

  // 프로필 평가
  async rateProfile(ratingData: MatchProfileRatingRequest): Promise<boolean> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS_LIST.PROFILE_RATE}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ratingData),
      },
    );

    if (__DEV__) {
      console.log('프로필 평가 요청:', ratingData);
      console.log('프로필 평가 응답:', response.status);
    }

    return response.status === 200;
  }

  // 연애관 매칭 요청
  async getLoveViewMatching(
    condition: LoveViewMatchConditionRequest,
  ): Promise<LoveViewMatchConditionResponse> {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS_LIST.LOVEVIEW_MATCH_SIMPLE}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(condition),
      },
    );

    if (!response.ok) {
      throw new Error(`연애관 매칭 요청 실패: ${response.status}`);
    }

    const data: LoveViewMatchConditionResponse = await response.json();
    if (__DEV__) console.log('연애관 매칭 성공:', data);
    return data;
  }

  async checkApiHealth(): Promise<boolean> {
    try {
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

export const datingApiService = new DatingApiService();
