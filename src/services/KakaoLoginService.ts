// src/services/KakaoLoginService.ts
import { login, getProfile, logout } from '@react-native-seoul/kakao-login';
import type {
  KakaoOAuthToken,
  KakaoProfile,
} from '@react-native-seoul/kakao-login';
import { API_ENDPOINTS_LIST } from '../config/api';
import apiClient from './apiClient';
import {
  KakaoLoginResponseDto,
  UserStatus,
  KakaoLoginRequestDto,
  Gender,
} from '../types/KakaoAPI';

export class KakaoLoginService {
  private static getReadableLoginError(error: any): string {
    return String(
      error?.response?.data?.message ??
        error?.response?.data?.error ??
        error?.message ??
        '',
    );
  }

  /**
   * 카카오 로그인 실행 (SDK 사용)
   */
  static async performKakaoLogin(): Promise<{
    nextStep: 'home' | 'signup' | 'ageRestricted';
    userData?: any;
  } | null> {
    try {
      if (__DEV__) console.log('카카오 로그인 시작');

      // 1. 카카오 OAuth 로그인
      let token: KakaoOAuthToken;
      try {
        token = await login();
      } catch (error) {
        if (__DEV__) console.warn('카카오 SDK 로그인 실패:', error);
        throw error;
      }
      if (__DEV__) console.log('카카오 OAuth 토큰 획득');

      // 2. 카카오 사용자 프로필 정보 가져오기
      let profile: KakaoProfile;
      try {
        profile = await getProfile();
      } catch (error) {
        if (__DEV__) console.warn('카카오 프로필 조회 실패:', error);
        throw error;
      }
      if (__DEV__) console.log('카카오 프로필 정보 조회 완료');

      // 3. 백엔드 서버로 카카오 로그인 요청 (수정된 부분)
      const loginData: KakaoLoginRequestDto = {
        accessToken: token.accessToken, // authorizationCode 대신 accessToken 사용
      };

      if (__DEV__) console.log('백엔드 로그인 요청');

      let response;
      try {
        response = await apiClient.post<KakaoLoginResponseDto>(
          API_ENDPOINTS_LIST.KAKAO_LOGIN,
          loginData,
        );
      } catch (error: any) {
        const serverMessage = this.getReadableLoginError(error);
        if (__DEV__) {
          console.warn('백엔드 카카오 로그인 실패:', {
            status: error?.response?.status,
            message: serverMessage || error?.message,
          });
        }
        throw new Error(serverMessage || '서버 로그인 요청에 실패했습니다.');
      }

      if (__DEV__) console.log('백엔드 로그인 응답 상태:', response.data?.userStatus);

      return this.handleLoginResponse(response.data);
    } catch (error: any) {
      if (__DEV__) console.warn('카카오 로그인 오류:', error?.message || error);

      // 사용자 취소 에러 처리
      if (error) {
        const errorString = error.toString();
        const errorMessage = error.message || '';

        if (
          errorString.includes('user cancelled') ||
          errorString.includes('user canceled') ||
          errorMessage.includes('cancelled') ||
          errorMessage.includes('canceled')
        ) {
          if (__DEV__) console.log('사용자가 카카오 로그인을 취소했습니다.');
          return null; // 취소한 경우 null 반환
        }
      }

      const readableMessage = this.getReadableLoginError(error);
      throw new Error(readableMessage || '카카오 로그인에 실패했습니다. 다시 시도해주세요.');
    }
  }

  /**
   * 카카오 로그아웃
   */
  static async performKakaoLogout(): Promise<void> {
    try {
      const message = await logout();
      if (__DEV__) console.log('카카오 로그아웃 성공');
    } catch (error) {
      if (__DEV__) console.warn('카카오 로그아웃 오류:', error);
      throw error;
    }
  }

  /**
   * 생년월일에서 출생연도 추출
   */
  private static extractBirthYear(
    birthday?: string,
    birthyear?: string,
  ): number {
    if (birthyear) {
      return parseInt(birthyear, 10);
    }

    // 기본값으로 현재 연도 - 25세
    const currentYear = new Date().getFullYear();
    return currentYear - 25;
  }

  /**
   * 카카오 성별 정보를 백엔드 형식으로 변환
   */
  private static mapKakaoGender(gender?: string): Gender {
    switch (gender?.toLowerCase()) {
      case 'male':
        return Gender.MALE;
      case 'female':
        return Gender.FEMALE;
      default:
        return Gender.OTHER;
    }
  }

  /**
   * 로그인 응답을 처리하여 다음 단계 결정
   */
  private static handleLoginResponse(response: KakaoLoginResponseDto): {
    nextStep: 'home' | 'signup' | 'ageRestricted';
    userData?: any;
  } {
    switch (response.userStatus) {
      case UserStatus.ACTIVE:
        return {
          nextStep: 'home',
          userData: {
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
            userId: response.data.userId,
            nickname: response.data.nickname,
          },
        };

      case UserStatus.PENDING_VERIFICATION:
        return {
          nextStep: 'signup',
          userData: {
            kakaoUserInfo: response.data.kakaoUserInfo,
          },
        };

      case UserStatus.AGE_RESTRICTED:
        return {
          nextStep: 'ageRestricted',
        };

      default:
        throw new Error('알 수 없는 사용자 상태입니다.');
    }
  }
}

