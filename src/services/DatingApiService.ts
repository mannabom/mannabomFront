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
  ToMeSignalResponseDTO,
  FromMeSignalResponseDTO,
  ToMeSignalProfileDto,
  FromMeSignalProfileDto,
  RespondLikeRequestDTO,
  RespondMessageRequestDTO,
} from '../types/DatingAPI';
import type { UnlockTargetPhotoRequestDto } from '../types/ProfilePhotoAPI';
import { requireExternalId, toExternalId } from '../utils/IdUtils';

const normalizeProfileMatch = (raw: any): ProfileMatchConditionResponse => ({
  ...raw,
  profileId: requireExternalId(raw?.profileId, 'profileId'),
  userId: toExternalId(raw?.userId) ?? undefined,
});

const normalizeOptionalProfileMatch = (
  raw: any,
): ProfileMatchConditionResponse | null => {
  const profileId = toExternalId(raw?.profileId);
  if (!profileId) return null;
  return {
    ...raw,
    profileId,
    userId: toExternalId(raw?.userId) ?? undefined,
  };
};

const normalizeLoveViewMatch = (
  raw: any,
): LoveViewMatchConditionResponse => ({
  ...raw,
  profileId: toExternalId(raw?.profileId) ?? undefined,
  userId: toExternalId(raw?.userId) ?? undefined,
});

const normalizeQuestionAnswers = (raw: any) => {
  if (!Array.isArray(raw)) return raw;
  return raw.map(item => {
    if (!item || typeof item !== 'object') return item;
    if (!item.question || typeof item.question !== 'object') return item;
    return {
      ...item,
      question: {
        ...item.question,
        questionId:
          toExternalId(item.question.questionId ?? item.question.id) ??
          undefined,
      },
    };
  });
};

const normalizeMatchDetail = <T extends ProfileMatchDetailResponse | LoveViewMatchDetailResponse>(
  raw: any,
): T => ({
  ...raw,
  questionAnswers: normalizeQuestionAnswers(raw?.questionAnswers),
  ...(Array.isArray(raw?.photos)
    ? {
        photos: raw.photos
          .filter((photo: any) => photo && typeof photo === 'object')
          .map((photo: any) => ({
            ...photo,
            photoId:
              toExternalId(photo?.photoId ?? photo?.id) ?? undefined,
          })),
      }
    : {}),
}) as T;

const normalizeReceivedSignal = (raw: any): ToMeSignalProfileDto | null => {
  const id = toExternalId(raw?.id);
  if (!id) return null;
  return {
    ...raw,
    id,
    profileId: toExternalId(raw?.profileId) ?? undefined,
  };
};

const normalizeSentSignal = (raw: any): FromMeSignalProfileDto | null => {
  const id = toExternalId(raw?.id);
  if (!id) return null;
  return {
    ...raw,
    id,
    profileId: toExternalId(raw?.profileId) ?? undefined,
  };
};

class DatingApiService {
  private unwrap<T>(raw: any): T {
    return (raw?.data ?? raw) as T;
  }

  // ✅ 프로필 매칭 요청 (당일 무료권)
  async getMatchingProfile(
    condition: ProfileMatchConditionRequest,
    idempotencyKey: string,
  ): Promise<ProfileMatchConditionResponse> {
    const response = await apiClient.post(
      API_ENDPOINTS_LIST.PROFILE_MATCH_SIMPLE,
      condition,
      {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      },
    );
    const data = normalizeProfileMatch(this.unwrap<any>(response.data));
    if (__DEV__) console.log('프로필 매칭(무료권) 성공:', Boolean(data?.profileId));
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
    const data = normalizeProfileMatch(this.unwrap<any>(response.data));
    if (__DEV__) console.log('프로필 매칭(혜택권) 성공:', Boolean(data?.profileId));
    return data;
  }

  // 프로필 평가
  async rateProfile(ratingData: MatchProfileRatingRequest): Promise<boolean> {
    const response = await apiClient.post(
      API_ENDPOINTS_LIST.PROFILE_RATE,
      ratingData,
    );

    if (__DEV__) {
      console.log('프로필 평가 요청:', { targetProfileId: ratingData.targetProfileId, score: ratingData.score });
      console.log('프로필 평가 응답:', response.status);
    }

    return response.status >= 200 && response.status < 300;
  }

  // 오늘 받은 프로필 매칭 목록
  async getTodayMatchingProfiles(): Promise<ProfileMatchConditionResponse[]> {
    const response = await apiClient.get(
      API_ENDPOINTS_LIST.PROFILE_MATCH_SIMPLE_TODAY,
    );
    const data = this.unwrap<TodayProfileMatchListResponse | any>(response.data);
    return Array.isArray(data?.recommendedTodayProfileList)
      ? data.recommendedTodayProfileList
          .map(normalizeOptionalProfileMatch)
          .filter(
            (
              item: ProfileMatchConditionResponse | null,
            ): item is ProfileMatchConditionResponse => item !== null,
          )
      : [];
  }

  // 연애관 매칭 요청
  async getLoveViewMatching(
    condition: LoveViewMatchConditionRequest,
    idempotencyKey: string,
  ): Promise<LoveViewMatchConditionResponse> {
    const response = await apiClient.post(
      API_ENDPOINTS_LIST.LOVEVIEW_MATCH_SIMPLE,
      condition,
      {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      },
    );
    const data = normalizeLoveViewMatch(this.unwrap<any>(response.data));
    if (__DEV__) console.log('연애관 매칭 성공:', Boolean(data?.userId || data?.profileId));
    return data;
  }

  // 오늘 받은 연애관 매칭 목록
  async getTodayLoveViewMatching(): Promise<LoveViewMatchConditionResponse[]> {
    const response = await apiClient.get(
      API_ENDPOINTS_LIST.LOVEVIEW_MATCH_SIMPLE_TODAY,
    );
    const data = this.unwrap<TodayLoveViewMatchListResponse | any>(response.data);
    return Array.isArray(data?.recommendedTodayLoveViewList)
      ? data.recommendedTodayLoveViewList.map(normalizeLoveViewMatch)
      : [];
  }

    // 연애관 매칭(혜택권)
  async getLoveViewMatchingExtra(condition: LoveViewMatchConditionRequest): Promise<LoveViewMatchConditionResponse> {
    const response = await apiClient.post(
      API_ENDPOINTS_LIST.LOVEVIEW_MATCH_SIMPLE_EXTRA,
      condition,
    );
    return normalizeLoveViewMatch(this.unwrap<any>(response.data));
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
  async getProfileDetail(targetProfileId: string): Promise<ProfileMatchDetailResponse> {
    const response = await apiClient.post(API_ENDPOINTS_LIST.PROFILE_DETAIL, {
      targetProfileId,
    });
    return normalizeMatchDetail<ProfileMatchDetailResponse>(
      this.unwrap<any>(response.data),
    );
  }

  // 상대 연애관 상세
  async getLoveViewDetail(targetProfileId: string): Promise<LoveViewMatchDetailResponse> {
    const response = await apiClient.post(API_ENDPOINTS_LIST.LOVEVIEW_DETAIL, {
      targetProfileId,
    });
    return normalizeMatchDetail<LoveViewMatchDetailResponse>(
      this.unwrap<any>(response.data),
    );
  }

  // 추가 사진 열람
  async unlockExtraPhoto(targetProfileId: string, photoId: string): Promise<ExtraPhotoUnlockResponse> {
    const request: UnlockTargetPhotoRequestDto = {
      targetProfileId,
      photoId,
    };
    const response = await apiClient.post(
      API_ENDPOINTS_LIST.PROFILE_DETAIL_EXTRA_PHOTO,
      request,
    );
    return this.unwrap<ExtraPhotoUnlockResponse>(response.data);
  }

  // 호감 보내기
  async sendLike(targetProfileId: string, source: MatchSource): Promise<CheckTingWalletResponse> {
    const payload = { targetProfileId, source };
    const response = await apiClient.post(API_ENDPOINTS_LIST.LIKE_SEND, payload);
    return this.unwrap<CheckTingWalletResponse>(response.data);
  }

  // 메시지 보내기
  async sendMessage(
    targetProfileId: string,
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

  async checkReceivedScore(targetProfileId: string): Promise<{ received: boolean }> {
    const response = await apiClient.post(API_ENDPOINTS_LIST.SCORE_IS_RECEIVED, {
      targetProfileId,
    });
    return this.unwrap<{ received: boolean }>(response.data);
  }

  async getReceivedScore(targetProfileId: string): Promise<{ score: number }> {
    const response = await apiClient.post(API_ENDPOINTS_LIST.SCORE_RECEIVED, {
      targetProfileId,
    });
    return this.unwrap<{ score: number }>(response.data);
  }

  async getReceivedInterests(): Promise<ToMeSignalProfileDto[]> {
    try {
      const response = await apiClient.get(API_ENDPOINTS_LIST.INTEREST_RECEIVED);
      const data = this.unwrap<ToMeSignalResponseDTO>(response.data);
      return Array.isArray(data?.profiles)
        ? data.profiles.map(normalizeReceivedSignal).filter(
            (item): item is ToMeSignalProfileDto => item !== null,
          )
        : [];
    } catch (e: any) {
      // 서버 철자 이슈(recieved) 호환 폴백
      if (e?.response?.status === 404) {
        const fallback = await apiClient.get('/api/interest/recieved');
        const data = this.unwrap<ToMeSignalResponseDTO>(fallback.data);
        return Array.isArray(data?.profiles)
          ? data.profiles.map(normalizeReceivedSignal).filter(
              (item): item is ToMeSignalProfileDto => item !== null,
            )
          : [];
      }
      throw e;
    }
  }

  async getSentInterests(): Promise<FromMeSignalProfileDto[]> {
    const response = await apiClient.get(API_ENDPOINTS_LIST.INTEREST_SENT);
    const data = this.unwrap<FromMeSignalResponseDTO>(response.data);
    return Array.isArray(data?.profiles)
      ? data.profiles.map(normalizeSentSignal).filter(
          (item): item is FromMeSignalProfileDto => item !== null,
        )
      : [];
  }

  // 서버 API 개발완료 후 UI 연결 예정
  async respondLike(payload: RespondLikeRequestDTO): Promise<boolean> {
    const response = await apiClient.post(API_ENDPOINTS_LIST.LIKE_RESPOND, payload);
    return response.status >= 200 && response.status < 300;
  }

  // 서버 API 개발완료 후 UI 연결 예정
  async respondMessage(payload: RespondMessageRequestDTO): Promise<boolean> {
    const response = await apiClient.post(API_ENDPOINTS_LIST.MESSAGE_RESPOND, payload);
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
