// src/types/Profile.ts

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

// 연애관 선택지 (enum)
export enum RelationshipChoice {
  // 갈등 해결 방식
  IMMEDIATE_RESOLVE = 'IMMEDIATE_RESOLVE',
  TAKE_TIME = 'TAKE_TIME',

  // 사진 공유
  SNS_SHARE_OK = 'SNS_SHARE_OK',
  PRIVATE_MEMORY = 'PRIVATE_MEMORY',

  // 연애 우선순위
  COMFORT = 'COMFORT',
  EXCITEMENT = 'EXCITEMENT',

  // 데이트 장소
  INDOOR = 'INDOOR',
  OUTDOOR = 'OUTDOOR',

  // 질투 태도
  MODERATE_JEALOUSY = 'MODERATE_JEALOUSY',
  COOL_ATTITUDE = 'COOL_ATTITUDE',

  // 이상적인 하루
  COMFORTABLE_DAILY = 'COMFORTABLE_DAILY',
  NEW_EXPERIENCE = 'NEW_EXPERIENCE',

  // 끌리는 모습
  CONSIDERATION = 'CONSIDERATION',
  STRONG_OPINION = 'STRONG_OPINION',

  // 친구들과의 관계
  MIX_WELL = 'MIX_WELL',
  SEPARATE_CIRCLE = 'SEPARATE_CIRCLE',
}

// 연애관 답변 전체 구조
export interface RelationshipChoices {
  conflictResolution: RelationshipChoice; // 연인과 싸웠을 때
  photoSharing: RelationshipChoice; // 사진 공유
  relationshipPriority: RelationshipChoice; // 연애에서 중요한 것
  datePlace: RelationshipChoice; // 데이트 장소
  jealousyAttitude: RelationshipChoice; // 질투 태도
  idealDay: RelationshipChoice; // 이상적인 하루
  attraction: RelationshipChoice; // 끌리는 모습
  friendInteraction: RelationshipChoice; // 친구들과의 관계
}
