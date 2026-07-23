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

export type {
  SignupCompleteRequestDto,
  SignupCompleteResponseDto,
} from './SignupAPI';
