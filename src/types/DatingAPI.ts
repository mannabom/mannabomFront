// src/types/DatingAPI.ts

export enum SmokingHabit {
  NON_SMOKER = 'NON_SMOKER',
  VAPE_ONLY = 'VAPE_ONLY',
  REGULAR_SMOKER = 'REGULAR_SMOKER',
}

export enum DrinkingHabit {
  NON_DRINKER = 'NON_DRINKER',
  OCCASIONAL_DRINKER = 'OCCASIONAL_DRINKER',
  FREQUENT_DRINKER = 'FREQUENT_DRINKER',
}

export interface ProfileMatchConditionRequest {
  minAge: number;
  maxAge: number;
  smoking: SmokingHabit[];
  drinking: DrinkingHabit[];
}

export interface ProfileMatchConditionResponse {
  // 백엔드 문서 기준: 상세 프로필 이동에 쓰는 영구 profileId
  profileId: string;

  // 응답에 포함될 수 있지만 profileId 대용으로 사용하지 않는다.
  userId?: string;

  profileImageUrl: string;
  age: number;
  mbti: string;
  drinking: DrinkingHabit;
  smoking: SmokingHabit;

  // ✅ 닉네임 내려오면 쓰려고 optional
  nickName?: string;
  nickname?: string;
  name?: string;
}

export interface MatchProfileRatingRequest {
  targetProfileId: string;
  score: number; // 1~5
}

export interface LoveViewMatchConditionRequest {
  minAge: number;
  maxAge: number;
  region?: string;
  smoking: SmokingHabit[];
  drinking: DrinkingHabit[];
}

export interface LoveViewMatchConditionResponse {
  profileId?: string;
  userId?: string;
  nickname?: string;
  name?: string;
  age: number;
  mbti: string;
  drinking: DrinkingHabit;
  smoking: SmokingHabit;
  intro: string;
  questionAnswers?: {
    question?: string;
    answer?: string;
  }[];
}

export interface TodayProfileMatchListResponse {
  recommendedTodayProfileList: ProfileMatchConditionResponse[];
}

export interface TodayLoveViewMatchListResponse {
  recommendedTodayLoveViewList: LoveViewMatchConditionResponse[];
}

export interface CheckTingWalletResponse {
  freeLikeNum: number;
  freeMessageNum: number;
  eventTingNum: number;
  tingNum: number;
  freeProfileNum: number;
  freeLoveViewNum: number;
  additionalProfileNum: number;
}

export type InterestType = 'LIKE' | 'MESSAGE' | 'HIGH_SCORE';
export type InterestMatchType = 'PROFILE' | 'LOVE_VIEW';

export interface ToMeSignalProfileDto {
  id: string;
  profileId?: string;
  type: InterestType;
  matchType?: InterestMatchType | null;
  fromUserNickname?: string;
  fromUserImageUrl?: string | null;
  message?: string | null;
  receivedAt: string;
}

export interface FromMeSignalProfileDto {
  id: string;
  profileId?: string;
  type: InterestType;
  matchType?: InterestMatchType | null;
  toUserNickname?: string;
  toUserImageUrl?: string | null;
  message?: string | null;
  status?: 'PENDING' | 'REJECT' | 'REJECTED' | 'ACCEPT' | 'ACCEPTED' | null;
  rejectReason?: string | null;
  receivedAt: string;
}

export interface ToMeSignalResponseDTO {
  profiles: ToMeSignalProfileDto[];
}

export interface FromMeSignalResponseDTO {
  profiles: FromMeSignalProfileDto[];
}

export interface RespondLikeRequestDTO {
  likeRequestId: string;
  accepted: boolean;
  rejectReason?: string;
}

export interface RespondMessageRequestDTO {
  messageRequestId: string;
  accepted: boolean;
  rejectReason?: string;
}

export type MatchSource = 'PROFILE_MATCH' | 'LOVE_VIEW_MATCH';
export type LikeStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export type MessageStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface MatchActionState<T extends string> {
  sent: boolean;
  likeStatus?: T extends 'like' ? LikeStatus : never;
  messageStatus?: T extends 'message' ? MessageStatus : never;
}

export interface MatchQuestionAnswer {
  question?: {
    questionId?: string;
    question?: string;
    questionType?: string;
  } | string;
  answer?: string;
}

export interface MatchPhoto {
  /**
   * 표시 전용 대표 사진에는 ID가 없을 수 있다.
   * 사진 열람처럼 ID가 필요한 동작만 이 값이 있을 때 허용한다.
   */
  photoId?: string;
  imageUrl?: string;
  ImageUrl?: string;
  blind?: boolean;
}

export interface ProfileMatchDetailResponse {
  nickname?: string;
  nickName?: string;
  age?: number;
  region?: string;
  questionAnswers?: MatchQuestionAnswer[];
  photos?: MatchPhoto[];
  smoking?: SmokingHabit;
  drinking?: DrinkingHabit;
  liked?: {
    sent: boolean;
    likeStatus: LikeStatus;
  };
  messaged?: {
    sent: boolean;
    messageStatus: MessageStatus;
  };
}

export interface LoveViewMatchDetailResponse {
  nickname?: string;
  nickName?: string;
  age?: number;
  region?: string;
  questionAnswers?: MatchQuestionAnswer[];
  smoking?: SmokingHabit;
  drinking?: DrinkingHabit;
  liked?: {
    sent: boolean;
    likeStatus: LikeStatus;
  };
  messaged?: {
    sent: boolean;
    messageStatus: MessageStatus;
  };
}

export type { UnlockTargetPhotoResponseDto as ExtraPhotoUnlockResponse } from './ProfilePhotoAPI';

// 프론트 확장
export interface ProfileData extends ProfileMatchConditionResponse {
  rating?: number;
  isRated?: boolean;
}

export interface FilterSettings {
  ageRange: { min: number; max: number };
  smoking: SmokingHabit[];
  drinking: DrinkingHabit[];
}
