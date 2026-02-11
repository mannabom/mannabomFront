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
  CheckTingWalletResponse,
  ProfileMatchDetailResponse,
  LoveViewMatchDetailResponse,
  ExtraPhotoUnlockResponse,
  MatchSource,
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

  // 무료/유료 프로필 및 재화 조회
  async getTingWalletInfo(): Promise<CheckTingWalletResponse> {
    const response = await apiClient.get(API_ENDPOINTS_LIST.CHECK_TING_WALLET);
    return this.unwrap<CheckTingWalletResponse>(response.data);
  }

  // 상대 일반 프로필 상세
  async getProfileDetail(targetProfileId: number): Promise<ProfileMatchDetailResponse> {
    const response = await apiClient.post(API_ENDPOINTS_LIST.PROFILE_DETAIL, {
      targetProfileId,
    });
    return this.unwrap<ProfileMatchDetailResponse>(response.data);
  }

  // 상대 연애관 상세
  async getLoveViewDetail(targetProfileId: number): Promise<LoveViewMatchDetailResponse> {
    const response = await apiClient.post(API_ENDPOINTS_LIST.LOVEVIEW_DETAIL, {
      targetProfileId,
    });
    return this.unwrap<LoveViewMatchDetailResponse>(response.data);
  }

  // 추가 사진 열람
  async unlockExtraPhoto(targetProfileId: number, photoId: number): Promise<ExtraPhotoUnlockResponse> {
    const response = await apiClient.post(API_ENDPOINTS_LIST.PROFILE_DETAIL_EXTRA_PHOTO, {
      targetProfileId,
      photoId,
    });
    return this.unwrap<ExtraPhotoUnlockResponse>(response.data);
  }

  // 호감 보내기
  async sendLike(targetProfileId: number, source: MatchSource): Promise<CheckTingWalletResponse> {
    const response = await apiClient.post(API_ENDPOINTS_LIST.LIKE_SEND, {
      targetProfileId,
      source,
    });
    return this.unwrap<CheckTingWalletResponse>(response.data);
  }

  // 메시지 보내기
  async sendMessage(
    targetProfileId: number,
    message: string,
    source: MatchSource,
  ): Promise<CheckTingWalletResponse> {
    const response = await apiClient.post(API_ENDPOINTS_LIST.MESSAGE_SEND, {
      targetProfileId,
      message,
      source,
    });
    return this.unwrap<CheckTingWalletResponse>(response.data);
  }

  async checkReceivedScore(targetProfileId: number): Promise<{ received: boolean }> {
    const response = await apiClient.post(API_ENDPOINTS_LIST.SCORE_IS_RECEIVED, {
      targetProfileId,
    });
    return this.unwrap<{ received: boolean }>(response.data);
  }

  async getReceivedScore(targetProfileId: number): Promise<{ score: number }> {
    const response = await apiClient.post(API_ENDPOINTS_LIST.SCORE_RECEIVED, {
      targetProfileId,
    });
    return this.unwrap<{ score: number }>(response.data);
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
