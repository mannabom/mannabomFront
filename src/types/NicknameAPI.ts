// src/types/NicknameAPI.ts
export interface SetNicknameRequestDto {
  profileId: string; // Redis에 저장된 임시 가입 진행 ID
  nickname: string; // 중복 확인 완료된 닉네임
}

export interface SetNicknameResponseDto {
  success: boolean;
  data: {
    profileId: string; // 가입 완료 전까지 사용하는 임시 가입 진행 ID
  };
  message: string; // "닉네임이 설정되었습니다"
}

export type {
  SignupCompleteRequestDto,
  SignupCompleteResponseDto,
} from './SignupAPI';
