// src/utils/ProfileStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearProfilePreviewState } from './ProfilePreviewStore';

// 프로필 데이터 타입 정의
export interface PhysicalProfileData {
  height: number;
  bodyType: string;
  region: {
    sido: string;
    sigungu: string;
  };
  mbti: string;
  smokingHabit: string;
  drinkingHabit: string;
}

export interface SelfIntroductionData {
  selfIntroduction: string;
  attractivePartnerTrait: string;
  desiredPartnerTrait: string;
}

export interface OptionalAnswersData {
  meaningOfLove?: string;
  soulFood?: string;
  dailyAndHoliday?: string;
  idealDate?: string;
}

export interface RelationshipChoicesData {
  conflictResolution: string;
  photoSharing: string;
  relationshipPriority: string;
  datePlace: string;
  jealousyAttitude: string;
  idealDay: string;
  attraction: string;
  friendInteraction: string;
}

export interface CompleteProfileData extends PhysicalProfileData {
  // 백엔드 요청 필드명은 profileId지만 값은 Redis 가입 진행 ID입니다.
  profileId: string;
  selfIntroduction: string;
  attractivePartnerTrait: string;
  desiredPartnerTrait: string;
  optionalAnswers: OptionalAnswersData;
  relationshipChoices: RelationshipChoicesData;
}

// Storage Keys
const STORAGE_KEYS = {
  PHYSICAL_PROFILE: 'physical_profile',
  SELF_INTRODUCTION: 'self_introduction',
  OPTIONAL_ANSWERS: 'optional_answers',
  RELATIONSHIP_CHOICES: 'relationship_choices',
  RAW_RELATIONSHIP_ANSWERS: 'optional_this_or_that_answers_v1',
  TERMS_STATE_PREFIX: 'signup_terms_state_v2',
};

// 신체 프로필 저장
export const savePhysicalProfile = async (
  data: PhysicalProfileData,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.PHYSICAL_PROFILE,
      JSON.stringify(data),
    );
    if (__DEV__) console.log('💾 신체 프로필 저장 완료');
  } catch (error) {
    if (__DEV__) console.warn('신체 프로필 저장 실패:', error);
    throw error;
  }
};

// 신체 프로필 불러오기
export const getPhysicalProfile =
  async (): Promise<PhysicalProfileData | null> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PHYSICAL_PROFILE);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      if (__DEV__) console.warn('신체 프로필 불러오기 실패:', error);
      return null;
    }
  };

// 자기소개 저장
export const saveSelfIntroduction = async (
  data: SelfIntroductionData,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.SELF_INTRODUCTION,
      JSON.stringify(data),
    );
    if (__DEV__) console.log('💾 자기소개 저장 완료');
  } catch (error) {
    if (__DEV__) console.warn('자기소개 저장 실패:', error);
    throw error;
  }
};

// 자기소개 불러오기
export const getSelfIntroduction =
  async (): Promise<SelfIntroductionData | null> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SELF_INTRODUCTION);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      if (__DEV__) console.warn('자기소개 불러오기 실패:', error);
      return null;
    }
  };

// 선택 질문 답변 저장
export const saveOptionalAnswers = async (
  data: OptionalAnswersData,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.OPTIONAL_ANSWERS,
      JSON.stringify(data),
    );
    if (__DEV__) console.log('💾 선택 답변 저장 완료');
  } catch (error) {
    if (__DEV__) console.warn('선택 답변 저장 실패:', error);
    throw error;
  }
};

// 선택 질문 답변 불러오기
export const getOptionalAnswers =
  async (): Promise<OptionalAnswersData | null> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.OPTIONAL_ANSWERS);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      if (__DEV__) console.warn('선택 답변 불러오기 실패:', error);
      return null;
    }
  };

// 연애관 저장
export const saveRelationshipChoices = async (
  data: RelationshipChoicesData,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.RELATIONSHIP_CHOICES,
      JSON.stringify(data),
    );
    if (__DEV__) console.log('💾 연애관 저장 완료');
  } catch (error) {
    if (__DEV__) console.warn('연애관 저장 실패:', error);
    throw error;
  }
};

// 연애관 불러오기
export const getRelationshipChoices =
  async (): Promise<RelationshipChoicesData | null> => {
    try {
      const data = await AsyncStorage.getItem(
        STORAGE_KEYS.RELATIONSHIP_CHOICES,
      );
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      if (__DEV__) console.warn('연애관 불러오기 실패:', error);
      return null;
    }
  };

// 전체 프로필 데이터 합치기
export const getCombinedProfileData = async (
  signupProfileId: string,
): Promise<CompleteProfileData | null> => {
  try {
    const physicalProfile = await getPhysicalProfile();
    const selfIntroduction = await getSelfIntroduction();
    const optionalAnswers = await getOptionalAnswers();
    const relationshipChoices = await getRelationshipChoices();

    if (!physicalProfile || !selfIntroduction || !relationshipChoices) {
      if (__DEV__) console.warn('필수 프로필 데이터가 누락됨');
      return null;
    }

    const combinedData: CompleteProfileData = {
      profileId: signupProfileId,
      ...physicalProfile,
      ...selfIntroduction,
      optionalAnswers: optionalAnswers || {},
      relationshipChoices,
    };

    if (__DEV__) console.log('🔗 전체 프로필 데이터 합치기 완료');
    return combinedData;
  } catch (error) {
    if (__DEV__) console.warn('프로필 데이터 합치기 실패:', error);
    return null;
  }
};

// 저장된 모든 프로필 데이터 삭제
export const clearAllProfileData = async (
  signupProfileId?: string,
): Promise<void> => {
  try {
    const keys = [
      STORAGE_KEYS.PHYSICAL_PROFILE,
      STORAGE_KEYS.SELF_INTRODUCTION,
      STORAGE_KEYS.OPTIONAL_ANSWERS,
      STORAGE_KEYS.RELATIONSHIP_CHOICES,
      STORAGE_KEYS.RAW_RELATIONSHIP_ANSWERS,
      STORAGE_KEYS.TERMS_STATE_PREFIX,
    ];

    if (signupProfileId?.trim()) {
      keys.push(
        `${STORAGE_KEYS.TERMS_STATE_PREFIX}_${signupProfileId.trim()}`,
      );
    }

    await AsyncStorage.multiRemove(keys);
    clearProfilePreviewState();
    if (__DEV__) console.log('🗑️ 가입 임시 데이터 삭제 완료');
  } catch (error) {
    if (__DEV__) console.warn('가입 임시 데이터 삭제 실패:', error);
    throw error;
  }
};

// 프로필 완성도 확인
export const getProfileProgress = async (): Promise<{
  physicalProfile: boolean;
  selfIntroduction: boolean;
  optionalAnswers: boolean;
  relationshipChoices: boolean;
  completionPercentage: number;
}> => {
  try {
    const physicalProfile = await getPhysicalProfile();
    const selfIntroduction = await getSelfIntroduction();
    const optionalAnswers = await getOptionalAnswers();
    const relationshipChoices = await getRelationshipChoices();

    const progress = {
      physicalProfile: !!physicalProfile,
      selfIntroduction: !!selfIntroduction,
      optionalAnswers: !!optionalAnswers,
      relationshipChoices: !!relationshipChoices,
      completionPercentage: 0,
    };

    const completedSteps = Object.values(progress).filter(Boolean).length - 1; // completionPercentage 제외
    progress.completionPercentage = Math.round((completedSteps / 4) * 100);

    return progress;
  } catch (error) {
    if (__DEV__) console.warn('프로필 진행도 확인 실패:', error);
    return {
      physicalProfile: false,
      selfIntroduction: false,
      optionalAnswers: false,
      relationshipChoices: false,
      completionPercentage: 0,
    };
  }
};
