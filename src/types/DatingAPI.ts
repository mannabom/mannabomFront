// src/types/DatingAPI.ts

// 백엔드에서 제공한 enum 타입들
export enum SmokingHabit {
  NON_SMOKER = 'NON_SMOKER', // 비흡연
  VAPE_ONLY = 'VAPE_ONLY', // 전자담배
  REGULAR_SMOKER = 'REGULAR_SMOKER', // 흡연
}

export enum DrinkingHabit {
  NON_DRINKER = 'NON_DRINKER', // 안 마심
  OCCASIONAL_DRINKER = 'OCCASIONAL_DRINKER', // 가끔 음주
  FREQUENT_DRINKER = 'FREQUENT_DRINKER', // 자주 음주
}

// API 요청/응답 타입들
export interface ProfileMatchConditionRequest {
  minAge: number;
  maxAge: number;
  smoking: SmokingHabit[];
  drinking: DrinkingHabit[];
}

export interface ProfileMatchConditionResponse {
  userId: number;
  profileImageUrl: string;
  age: number;
  mbti: string;
  drinking: DrinkingHabit;
  smoking: SmokingHabit;
}

export interface MatchProfileRatingRequest {
  targetUserId: number;
  score: number; // 1~5
}

export interface LoveViewMatchConditionRequest {
  minAge: number;
  maxAge: number;
  region: string;
  smoking: SmokingHabit;
  drinking: DrinkingHabit;
}

export interface LoveViewMatchConditionResponse {
  userId: number;
  age: number;
  mbti: string;
  drinking: DrinkingHabit;
  smoking: SmokingHabit;
  intro: string;
}

// 프론트엔드에서 사용할 확장 타입들
export interface ProfileData extends ProfileMatchConditionResponse {
  nickname?: string; // 임시로 추가
  rating?: number; // 이미 평가한 점수
  isRated?: boolean; // 평가 여부
}

// 필터 설정 타입
export interface FilterSettings {
  ageRange: { min: number; max: number };
  smoking: SmokingHabit[];
  drinking: DrinkingHabit[];
}
