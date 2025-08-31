// src/services/KakaoLoginService.ts
import { login, getProfile, logout } from '@react-native-seoul/kakao-login';
import type {
  KakaoOAuthToken,
  KakaoProfile,
} from '@react-native-seoul/kakao-login';
import { KAKAO_CONFIG } from '../config/kakao';
import { API_ENDPOINTS_LIST } from '../config/api';
import apiClient from './apiClient';
import {
  KakaoLoginResponseDto,
  UserStatus,
  KakaoLoginRequestDto,
  KakaoUserInfo,
  Gender,
} from '../types/KakaoAPI';

export class KakaoLoginService {
  /**
   * 카카오 로그인 실행 (SDK 사용)
   */
  static async performKakaoLogin(): Promise<{
    nextStep: 'home' | 'signup' | 'ageRestricted';
    userData?: any;
  } | null> {
    try {
      console.log('카카오 로그인 시작');

      // 1. 카카오 OAuth 로그인
      const token: KakaoOAuthToken = await login();
      console.log('카카오 OAuth 토큰 획득');

      // 2. 카카오 사용자 프로필 정보 가져오기
      const profile: KakaoProfile = await getProfile();
      console.log('카카오 프로필 정보:', {
        id: profile.id,
        nickname: profile.nickname,
        email: profile.email,
      });

      // 3. 카카오 사용자 정보를 백엔드 형식으로 변환
      const kakaoUserInfo: KakaoUserInfo = {
        kakaoId: String(profile.id),
        name: profile.nickname || '사용자',
        email: profile.email,
        birthYear: this.extractBirthYear(profile.birthday, profile.birthyear),
        gender: this.mapKakaoGender(profile.gender),
      };

      // 4. 백엔드 서버로 카카오 로그인 요청
      const loginData: KakaoLoginRequestDto = {
        authorizationCode: token.accessToken,
        redirectUri: KAKAO_CONFIG.REDIRECT_URI,
        kakaoUserInfo: kakaoUserInfo,
      };

      console.log('백엔드 로그인 요청');

      const response = await apiClient.post<KakaoLoginResponseDto>(
        API_ENDPOINTS_LIST.KAKAO_LOGIN,
        loginData,
      );

      console.log('백엔드 로그인 응답:', response.data);

      return this.handleLoginResponse(response.data);
    } catch (error: any) {
      console.error('카카오 로그인 오류:', error);

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
          console.log('사용자가 카카오 로그인을 취소했습니다.');
          return null; // 취소한 경우 null 반환
        }
      }

      throw new Error('카카오 로그인에 실패했습니다. 다시 시도해주세요.');
    }
  }

  /**
   * 카카오 로그아웃
   */
  static async performKakaoLogout(): Promise<void> {
    try {
      const message = await logout();
      console.log('카카오 로그아웃 성공:', message);
    } catch (error) {
      console.error('카카오 로그아웃 오류:', error);
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

/**
 * 개발용 Mock 서비스
 */
export class MockKakaoLoginService {
  static async performMockKakaoLogin(): Promise<{
    nextStep: 'home' | 'signup' | 'ageRestricted';
    userData?: any;
  }> {
    const mockResponses = [
      {
        success: true,
        userStatus: UserStatus.ACTIVE,
        data: {
          accessToken: 'mock_access_token_12345',
          refreshToken: 'mock_refresh_token_12345',
          userId: 12345,
          nickname: '김만나',
        },
        message: '로그인 성공',
      },
      {
        success: true,
        userStatus: UserStatus.PENDING_VERIFICATION,
        data: {
          kakaoUserInfo: {
            kakaoId: 'mock_kakao_12345',
            name: '김신규',
            email: 'test@example.com',
            birthYear: 1995,
            gender: Gender.MALE,
            profileId: 'mock_profile_id_12345',
          },
        },
        message: '회원가입이 필요합니다.',
      },
      {
        success: false,
        userStatus: UserStatus.AGE_RESTRICTED,
        data: {
          birthYear: 2010,
        },
        message: '20대만 이용 가능한 서비스입니다.',
      },
    ];

    const randomResponse =
      mockResponses[Math.floor(Math.random() * mockResponses.length)];

    return new Promise(resolve => {
      setTimeout(() => {
        const response = randomResponse as KakaoLoginResponseDto;

        switch (response.userStatus) {
          case UserStatus.ACTIVE:
            resolve({
              nextStep: 'home',
              userData: {
                accessToken: response.data.accessToken,
                refreshToken: response.data.refreshToken,
                userId: response.data.userId,
                nickname: response.data.nickname,
              },
            });
            break;
          case UserStatus.PENDING_VERIFICATION:
            resolve({
              nextStep: 'signup',
              userData: {
                kakaoUserInfo: response.data.kakaoUserInfo,
              },
            });
            break;
          case UserStatus.AGE_RESTRICTED:
            resolve({
              nextStep: 'ageRestricted',
            });
            break;
          default:
            throw new Error('알 수 없는 사용자 상태');
        }
      }, 1500);
    });
  }
}
