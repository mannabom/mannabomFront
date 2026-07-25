// src/services/KakaoAPIService.ts
import {
  KakaoLoginRequestDto,
  KakaoLoginResponseDto,
  UserStatus,
} from '../types/KakaoAPI';
import { API_BASE_URL, API_ENDPOINTS_LIST } from '../config/api';
import { toExternalId } from '../utils/IdUtils';

export class KakaoAPIService {
  /**
   * 카카오 로그인 API 호출 (수정된 부분)
   */
  static async loginWithKakao(
    accessToken: string, // authorizationCode 대신 accessToken 사용
  ): Promise<KakaoLoginResponseDto> {
    try {
      const requestData: KakaoLoginRequestDto = {
        accessToken, // 수정된 부분
      };

      if (__DEV__) console.log('카카오 로그인 API 호출');

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS_LIST.KAKAO_LOGIN}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        },
      );

      const responseData: KakaoLoginResponseDto = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || '로그인 요청에 실패했습니다.');
      }

      return responseData;
    } catch (error) {
      if (__DEV__) console.warn('카카오 로그인 API 오류:', error);
      throw error;
    }
  }

  /**
   * 로그인 응답을 처리하여 다음 단계 결정
   */
  static handleLoginResponse(response: KakaoLoginResponseDto): {
    nextStep: 'home' | 'signup' | 'ageRestricted';
    userData?: any;
    message: string;
  } {
    switch (response.userStatus) {
      case UserStatus.ACTIVE:
        // 기존 회원 - 홈 화면으로
        return {
          nextStep: 'home',
          userData: {
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
            userId: toExternalId(response.data.userId) ?? undefined,
            nickname: response.data.nickname,
          },
          message: response.message,
        };

      case UserStatus.PENDING_VERIFICATION:
        // 신규 사용자 - 회원가입 진행
        return {
          nextStep: 'signup',
          userData: {
            kakaoUserInfo: response.data.kakaoUserInfo,
          },
          message: response.message,
        };

      case UserStatus.AGE_RESTRICTED:
        // 연령 제한 - 접근 차단
        return {
          nextStep: 'ageRestricted',
          userData: {
            birthYear: response.data.birthYear,
          },
          message: response.message,
        };

      default:
        throw new Error('알 수 없는 사용자 상태입니다.');
    }
  }
}
