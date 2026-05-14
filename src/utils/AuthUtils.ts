// src/utils/AuthUtils.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_PROFILE_ID_KEY = 'userProfileId';

export const saveAuthTokens = async (
  accessToken: string,
  refreshToken: string,
) => {
  try {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    if (__DEV__) console.log('✅ 토큰 저장 완료');
  } catch (error) {
    if (__DEV__) console.warn('❌ 토큰 저장 실패:', error);
  }
};

export const getAuthTokens = async () => {
  try {
    const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    return { accessToken, refreshToken };
  } catch (error) {
    if (__DEV__) console.warn('❌ 토큰 조회 실패:', error);
    return { accessToken: null, refreshToken: null };
  }
};

export const saveProfileId = async (profileId: string) => {
  try {
    await AsyncStorage.setItem(USER_PROFILE_ID_KEY, profileId);
    if (__DEV__) console.log('✅ 프로필 ID 저장 완료');
  } catch (error) {
    if (__DEV__) console.warn('❌ 프로필 ID 저장 실패:', error);
  }
};

export const getProfileId = async (): Promise<string | null> => {
  try {
    const profileId = await AsyncStorage.getItem(USER_PROFILE_ID_KEY);
    if (__DEV__) console.log('📋 프로필 ID 조회:', profileId ? 'YES' : 'NO');
    return profileId;
  } catch (error) {
    if (__DEV__) console.warn('❌ 프로필 ID 조회 실패:', error);
    return null;
  }
};

export const clearAllAuth = async () => {
  try {
    await AsyncStorage.multiRemove([
      ACCESS_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      USER_PROFILE_ID_KEY,
    ]);
    if (__DEV__) console.log('✅ 모든 인증 정보 삭제 완료');
  } catch (error) {
    if (__DEV__) console.warn('❌ 인증 정보 삭제 실패:', error);
  }
};
