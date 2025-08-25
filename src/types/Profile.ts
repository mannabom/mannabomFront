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

export enum RelationshipChoice {
  // 갈등 해결: 바로 풀고 싶다 vs 시간을 갖고 싶다
  IMMEDIATE_RESOLVE = 'IMMEDIATE_RESOLVE',
  TAKE_TIME = 'TAKE_TIME',
  // 사진 공유: SNS에 공유 OK vs 둘만의 추억으로
  SNS_SHARE_OK = 'SNS_SHARE_OK',
  PRIVATE_MEMORY = 'PRIVATE_MEMORY',
  // 연애에서 중요한 것: 편안함 vs 설렘
  COMFORT = 'COMFORT',
  EXCITEMENT = 'EXCITEMENT',
  // 연인과의 데이트: 실내 vs 실외
  INDOOR = 'INDOOR',
  OUTDOOR = 'OUTDOOR',
  // 질투: 적당한 질투가 재미있다 vs 질투 없이 쿨한 게 편하다
  MODERATE_JEALOUSY = 'MODERATE_JEALOUSY',
  COOL_ATTITUDE = 'COOL_ATTITUDE',
  // 이상적인 하루: 같이 있는 편안한 일상 vs 새로운 경험을 찾아가는 하루
  COMFORTABLE_DAILY = 'COMFORTABLE_DAILY',
  NEW_EXPERIENCE = 'NEW_EXPERIENCE',
  // 끌리는 점: 상대의 배려 vs 상대의 자기 주관
  CONSIDERATION = 'CONSIDERATION',
  STRONG_OPINION = 'STRONG_OPINION',
  // 친구와의 관계: 자연스럽게 잘 어울렸으면 vs 따로 노는 게 편하다
  MIX_WELL = 'MIX_WELL',
  SEPARATE_CIRCLE = 'SEPARATE_CIRCLE',
}
