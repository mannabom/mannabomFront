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
  nickname?: string;
  name?: string;
}

export interface MatchProfileRatingRequest {
  // 서버가 userId를 쓰든 profileId를 쓰든, 일단 기존 필드명 유지
  targetUserId: number;
  score: number; // 1~5
}

export interface LoveViewMatchConditionRequest {
  minAge: number;
  maxAge: number;
  region?: string;
  smoking: SmokingHabit;
  drinking: DrinkingHabit;
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
