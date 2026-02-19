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
  // ✅ 백엔드 문서 기준: profileId
  profileId: number;

  // ✅ 기존 코드 호환용: 혹시 아직 userId로 내려오면 이것도 받게 처리
  userId?: number;

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
  targetProfileId: number;
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
  profileId?: number;
  userId: number;
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
  id: number;
  profileId?: number;
  type: InterestType;
  matchType?: InterestMatchType | null;
  fromUserNickname?: string;
  fromUserImageUrl?: string | null;
  message?: string | null;
  receivedAt: string;
}

export interface FromMeSignalProfileDto {
  id: number;
  profileId?: number;
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
  likeRequestId: number;
  accepted: boolean;
  rejectReason?: string;
}

export interface RespondMessageRequestDTO {
  messageRequestId: number;
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
    questionId?: number;
    question?: string;
    questionType?: string;
  } | string;
  answer?: string;
}

export interface MatchPhoto {
  photoId: number;
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

export interface ExtraPhotoUnlockResponse {
  tingRemains: number;
  eventTingRemains: number;
}

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
