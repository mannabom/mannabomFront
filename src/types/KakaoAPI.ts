// src/types/KakaoAPI.ts

export enum UserStatus {
  ACTIVE = 'ACTIVE', // 기존 사용자
  PENDING_VERIFICATION = 'PENDING_VERIFICATION', // 회원가입 진행 (신규 사용자)
  AGE_RESTRICTED = 'AGE_RESTRICTED', // 연령 제한 사용자
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export interface KakaoLoginRequestDto {
  authorizationCode: string; // 카카오 OAuth에서 받은 인증 코드
  redirectUri: string; // 앱의 리다이렉트 URI
}

export interface KakaoUserInfo {
  kakaoId: string;
  name: string; // 카카오에서 받은 실명
  birthYear: number;
  gender: Gender;
  profileId: string;
}

export interface KakaoLoginResponseDto {
  success: boolean; // 요청 성공 여부
  userStatus: UserStatus; // 사용자 상태 구분
  data: {
    // 기존 회원인 경우에만 제공 (userStatus == "ACTIVE")
    accessToken?: string;
    refreshToken?: string;
    userId?: number;
    nickname?: string; // 앱에서 설정한 닉네임

    // 신규 사용자인 경우에만 제공 (userStatus == "PENDING_VERIFICATION")
    kakaoUserInfo?: KakaoUserInfo;

    // 연령 제한인 경우에만 제공 (userStatus == "AGE_RESTRICTED")
    birthYear?: number;
  };
  message: string; // 결과 메시지
}
