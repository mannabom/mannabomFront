// src/services/DatingApiService.ts
import { API_BASE_URL, API_ENDPOINTS_LIST } from '../config/api';
import apiClient from './apiClient';
import {
  ProfileMatchConditionRequest,
  ProfileMatchConditionResponse,
  MatchProfileRatingRequest,
  LoveViewMatchConditionRequest,
  LoveViewMatchConditionResponse,
  TodayLoveViewMatchListResponse,
  TodayProfileMatchListResponse,
} from '../types/DatingAPI';

class DatingApiService {
  private unwrap<T>(raw: any): T {
    return (raw?.data ?? raw) as T;
  }

  // ✅ 프로필 매칭 요청 (당일 무료권)
  async getMatchingProfile(
    condition: ProfileMatchConditionRequest,
  ): Promise<ProfileMatchConditionResponse> {
    const response = await apiClient.post(
      API_ENDPOINTS_LIST.PROFILE_MATCH_SIMPLE,
      condition,
    );
    const data = this.unwrap<ProfileMatchConditionResponse>(response.data);
    if (__DEV__) console.log('프로필 매칭(무료권) 성공:', data);
    return data;
  }

  // ✅ 프로필 매칭 요청 (혜택권)
  async getMatchingProfileExtra(
    condition: ProfileMatchConditionRequest,
  ): Promise<ProfileMatchConditionResponse> {
    const response = await apiClient.post(
      API_ENDPOINTS_LIST.PROFILE_MATCH_SIMPLE_EXTRA,
      condition,
    );
    const data = this.unwrap<ProfileMatchConditionResponse>(response.data);
    if (__DEV__) console.log('프로필 매칭(혜택권) 성공:', data);
    return data;
  }

  // 프로필 평가
  async rateProfile(ratingData: MatchProfileRatingRequest): Promise<boolean> {
    const response = await apiClient.post(
      API_ENDPOINTS_LIST.PROFILE_RATE,
      ratingData,
    );

    if (__DEV__) {
      console.log('프로필 평가 요청:', ratingData);
      console.log('프로필 평가 응답:', response.status);
    }

    return response.status >= 200 && response.status < 300;
  }

  // 오늘 받은 프로필 매칭 목록
  async getTodayMatchingProfiles(): Promise<ProfileMatchConditionResponse[]> {
    const response = await apiClient.get(
      API_ENDPOINTS_LIST.PROFILE_MATCH_SIMPLE_TODAY,
    );
    const data = this.unwrap<TodayProfileMatchListResponse>(response.data);
    return Array.isArray(data?.recommendedTodayProfileList)
      ? data.recommendedTodayProfileList
      : [];
  }

  // 연애관 매칭 요청
  async getLoveViewMatching(
    condition: LoveViewMatchConditionRequest,
  ): Promise<LoveViewMatchConditionResponse> {
    const response = await apiClient.post(
      API_ENDPOINTS_LIST.LOVEVIEW_MATCH_SIMPLE,
      condition,
    );
    const data = this.unwrap<LoveViewMatchConditionResponse>(response.data);
    if (__DEV__) console.log('연애관 매칭 성공:', data);
    return data;
  }

  // 오늘 받은 연애관 매칭 목록
  async getTodayLoveViewMatching(): Promise<LoveViewMatchConditionResponse[]> {
    const response = await apiClient.get(
      API_ENDPOINTS_LIST.LOVEVIEW_MATCH_SIMPLE_TODAY,
    );
    const data = this.unwrap<TodayLoveViewMatchListResponse>(response.data);
    return Array.isArray(data?.recommendedTodayLoveViewList)
      ? data.recommendedTodayLoveViewList
      : [];
  }

    // 연애관 매칭(혜택권)
  async getLoveViewMatchingExtra(condition: LoveViewMatchConditionRequest): Promise<LoveViewMatchConditionResponse> {
    const response = await apiClient.post(
      API_ENDPOINTS_LIST.LOVEVIEW_MATCH_SIMPLE_EXTRA,
      condition,
    );
    return this.unwrap<LoveViewMatchConditionResponse>(response.data);
  }

  // 추가 프로필 구매(팅)
  async purchaseExtraProfileByTing(additionalProfileNumByTing: 1 | 5): Promise<boolean> {
    const response = await apiClient.post(
      API_ENDPOINTS_LIST.EXTRA_PROFILE_BY_TING,
      { additionalProfileNumByTing },
    );
    return response.status >= 200 && response.status < 300;
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
