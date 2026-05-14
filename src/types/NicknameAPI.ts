// src/types/NicknameAPI.ts
export interface SetNicknameRequestDto {
  profileId: string; // 1단계에서 받은 ID
  nickname: string; // 중복 확인 완료된 닉네임
}

export interface SetNicknameResponseDto {
  success: boolean;
  data: {
    profileId: string;
  };
  message: string; // "닉네임이 설정되었습니다"
}

export interface SignupCompleteRequestDto {
  profileId: string; // 모든 단계를 거친 프로필 ID
}

export interface SignupCompleteResponseDto {
  success: boolean;
  data: {
    userId: number; // 생성된 사용자 ID
    accessToken: string; // JWT 액세스 토큰
    refreshToken: string; // JWT 리프레시 토큰
    initialPoints: number; // 지급된 포인트 (남성 60, 여성 30)
    initialTing?: number;
    initialTings?: number;
    ting?: number;
    tingNum?: number;
    eventTing?: number;
    eventTingNum?: number;
    pointTing?: number;
    pointTingNum?: number;
    rewardedPoints?: number;
    rewardPoints?: number;
    points?: number;
  };
  message: string; // "회원가입이 완료되었습니다"
}
