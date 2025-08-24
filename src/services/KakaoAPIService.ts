// src/services/KakaoAPIService.ts
import {
  KakaoLoginRequestDto,
  KakaoLoginResponseDto,
  UserStatus,
} from '../types/KakaoAPI';

// 임시로 직접 설정 (config 파일 생성 전까지)
const API_BASE_URL = 'http://localhost:8080'; // 백엔드 로컬 서버
const KAKAO_LOGIN_ENDPOINT = '/login/kakao';

export class KakaoAPIService {
  /**
   * 카카오 로그인 API 호출
   */
  static async loginWithKakao(
    authorizationCode: string,
    redirectUri: string,
  ): Promise<KakaoLoginResponseDto> {
    try {
      const requestData: KakaoLoginRequestDto = {
        authorizationCode,
        redirectUri,
      };

      console.log('카카오 로그인 API 호출:', requestData);

      const response = await fetch(`${API_BASE_URL}${KAKAO_LOGIN_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const responseData: KakaoLoginResponseDto = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || '로그인 요청에 실패했습니다.');
      }

      return responseData;
    } catch (error) {
      console.error('카카오 로그인 API 오류:', error);
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
            userId: response.data.userId,
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

  /**
   * 임시 카카오 로그인 (SDK 연동 전까지 사용)
   * 실제로는 카카오 SDK에서 authorizationCode를 받아와야 함
   */
  static async mockKakaoLogin(): Promise<KakaoLoginResponseDto> {
    // 실제로는 카카오 SDK 연동 필요
    // const result = await KakaoLogin.login();
    // return this.loginWithKakao(result.authorizationCode, REDIRECT_URI);

    // 임시 Mock 데이터
    const mockResponses = [
      // 기존 회원 응답
      {
        success: true,
        userStatus: UserStatus.ACTIVE,
        data: {
          accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
          refreshToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
          userId: 12345,
          nickname: '김만나',
        },
        message: '로그인 성공',
      },
      // 신규 사용자 응답
      {
        success: true,
        userStatus: UserStatus.PENDING_VERIFICATION,
        data: {
          kakaoUserInfo: {
            kakaoId: '12345',
            name: '김신규',
            birthYear: 2000,
            gender: 'MALE' as const,
            profileId: 'eeeeee',
          },
        },
        message: '회원가입이 필요합니다.',
      },
      // 연령 제한 응답
      {
        success: false,
        userStatus: UserStatus.AGE_RESTRICTED,
        data: {
          birthYear: 1995,
        },
        message: '20대만 이용 가능한 서비스입니다.',
      },
    ];

    // 랜덤하게 응답 선택 (테스트용)
    const randomResponse =
      mockResponses[Math.floor(Math.random() * mockResponses.length)];

    // 실제 API 호출 시뮬레이션 (1초 딜레이)
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(randomResponse as KakaoLoginResponseDto);
      }, 1000);
    });
  }
}
