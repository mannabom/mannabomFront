// src/utils/DatingUtils.ts
import {
  SmokingHabit,
  DrinkingHabit,
  FilterSettings,
} from '../types/DatingAPI';

// Enum을 한국어 라벨로 변환하는 헬퍼 함수들
export const smokingHabitLabels: Record<SmokingHabit, string> = {
  [SmokingHabit.NON_SMOKER]: '비흡연',
  [SmokingHabit.VAPE_ONLY]: '전자담배',
  [SmokingHabit.REGULAR_SMOKER]: '일반담배',
};

export const drinkingHabitLabels: Record<DrinkingHabit, string> = {
  [DrinkingHabit.NON_DRINKER]: '거의 안 마신다',
  [DrinkingHabit.OCCASIONAL_DRINKER]: '가끔',
  [DrinkingHabit.FREQUENT_DRINKER]: '종종한다',
};

// 전체 선택을 위한 배열
export const allSmokingHabits = Object.values(SmokingHabit);
export const allDrinkingHabits = Object.values(DrinkingHabit);

// 필터 설정 기본값
export const defaultFilterSettings: FilterSettings = {
  ageRange: { min: 20, max: 29 },
  smoking: allSmokingHabits, // 전체 선택
  drinking: allDrinkingHabits, // 전체 선택
};

// 필터 설정을 한국어 요약으로 변환
export const getFilterSummary = (filters: FilterSettings): string => {
  const ageRange = `${filters.ageRange.min}-${filters.ageRange.max}세`;
  const smokingCount = filters.smoking.length;
  const drinkingCount = filters.drinking.length;

  return `${ageRange}, 흡연 ${smokingCount}개, 음주 ${drinkingCount}개 선택`;
};

// 평점을 텍스트로 변환
export const getRatingText = (rating: number): string => {
  switch (rating) {
    case 1:
      return '별로예요';
    case 2:
      return '보통이에요';
    case 3:
      return '괜찮아요';
    case 4:
      return '좋아요';
    case 5:
      return '최고예요';
    default:
      return '';
  }
};
