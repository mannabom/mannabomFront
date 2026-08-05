// src/utils/AuthUtils.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireExternalId } from './IdUtils';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_ID_KEY = 'userId';
// 기존 가입 진행 데이터와의 호환을 위해 저장 키 값은 유지합니다.
// 이 값은 로그인한 회원의 영구 profileId가 아니라 Redis 가입 진행 ID입니다.
const SIGNUP_PROFILE_ID_KEY = 'userProfileId';
const SIGNUP_TOKEN_KEY = 'signupToken';

const requireToken = (value: string, fieldName: string): string => {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized) {
    throw new Error(`${fieldName}이(가) 없습니다.`);
  }
  return normalized;
};

export const saveAuthTokens = async (
  accessToken: string,
  refreshToken: string,
) => {
  const normalizedAccessToken = requireToken(accessToken, '액세스 토큰');
  const normalizedRefreshToken = requireToken(refreshToken, '리프레시 토큰');

  try {
    await AsyncStorage.multiSet([
      [ACCESS_TOKEN_KEY, normalizedAccessToken],
      [REFRESH_TOKEN_KEY, normalizedRefreshToken],
    ]);
    if (__DEV__) console.log('✅ 토큰 저장 완료');
  } catch (error) {
    if (__DEV__) console.warn('❌ 토큰 저장 실패:', error);
    throw error;
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

export const saveAuthenticatedSession = async (
  accessToken: string,
  refreshToken: string,
  userId: string,
): Promise<void> => {
  const normalizedUserId = requireExternalId(userId, '사용자 ID');
  const normalizedAccessToken = requireToken(accessToken, '액세스 토큰');
  const normalizedRefreshToken = requireToken(refreshToken, '리프레시 토큰');

  try {
    await AsyncStorage.multiSet([
      [ACCESS_TOKEN_KEY, normalizedAccessToken],
      [REFRESH_TOKEN_KEY, normalizedRefreshToken],
      [USER_ID_KEY, normalizedUserId],
    ]);
    if (__DEV__) console.log('✅ 로그인 세션 저장 완료');
  } catch (error) {
    if (__DEV__) console.warn('❌ 로그인 세션 저장 실패:', error);
    throw error;
  }
};

export const saveUserId = async (userId: string): Promise<void> => {
  const normalizedUserId = requireExternalId(userId, '사용자 ID');

  try {
    await AsyncStorage.setItem(USER_ID_KEY, normalizedUserId);
    if (__DEV__) console.log('✅ 사용자 ID 저장 완료');
  } catch (error) {
    if (__DEV__) console.warn('❌ 사용자 ID 저장 실패:', error);
    throw error;
  }
};

export const getUserId = async (): Promise<string | null> => {
  try {
    const userId = await AsyncStorage.getItem(USER_ID_KEY);
    return userId?.trim() || null;
  } catch (error) {
    if (__DEV__) console.warn('❌ 사용자 ID 조회 실패:', error);
    return null;
  }
};

export const saveSignupSession = async (
  signupProfileId: string,
  signupToken: string,
): Promise<void> => {
  const normalizedSignupProfileId = requireExternalId(
    signupProfileId,
    '가입 진행 ID',
  );
  const normalizedSignupToken = requireToken(signupToken, '가입 토큰');

  try {
    await AsyncStorage.multiSet([
      [SIGNUP_PROFILE_ID_KEY, normalizedSignupProfileId],
      [SIGNUP_TOKEN_KEY, normalizedSignupToken],
    ]);
    if (__DEV__) console.log('✅ 가입 진행 세션 저장 완료');
  } catch (error) {
    if (__DEV__) console.warn('❌ 가입 진행 세션 저장 실패:', error);
    throw error;
  }
};

export const getSignupProfileId = async (): Promise<string | null> => {
  try {
    const signupProfileId = await AsyncStorage.getItem(
      SIGNUP_PROFILE_ID_KEY,
    );
    return signupProfileId?.trim() || null;
  } catch (error) {
    if (__DEV__) console.warn('❌ 가입 진행 ID 조회 실패:', error);
    return null;
  }
};

export const getSignupSession = async (): Promise<{
  profileId: string;
  signupToken: string;
} | null> => {
  try {
    const entries = await AsyncStorage.multiGet([
      SIGNUP_PROFILE_ID_KEY,
      SIGNUP_TOKEN_KEY,
    ]);
    const values = Object.fromEntries(entries);
    const profileId = values[SIGNUP_PROFILE_ID_KEY]?.trim();
    const signupToken = values[SIGNUP_TOKEN_KEY]?.trim();

    if (!profileId || !signupToken) return null;
    return {
      profileId: requireExternalId(profileId, '가입 진행 ID'),
      signupToken: requireToken(signupToken, '가입 토큰'),
    };
  } catch (error) {
    if (__DEV__) console.warn('❌ 가입 진행 세션 조회 실패:', error);
    return null;
  }
};

export const clearSignupSession = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      SIGNUP_PROFILE_ID_KEY,
      SIGNUP_TOKEN_KEY,
    ]);
  } catch (error) {
    if (__DEV__) console.warn('❌ 가입 진행 세션 삭제 실패:', error);
    throw error;
  }
};

export const clearAllAuth = async () => {
  try {
    await AsyncStorage.multiRemove([
      ACCESS_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      USER_ID_KEY,
      SIGNUP_PROFILE_ID_KEY,
      SIGNUP_TOKEN_KEY,
    ]);
    if (__DEV__) console.log('✅ 모든 인증 정보 삭제 완료');
  } catch (error) {
    if (__DEV__) console.warn('❌ 인증 정보 삭제 실패:', error);
    throw error;
  }
};
