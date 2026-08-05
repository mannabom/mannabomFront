import { toExternalId } from '../utils/IdUtils';

export interface UploadedProfilePhotoDTO {
  photoId: string;
  url: string;
}

export interface ProfilePhotosResponseDto {
  success: boolean;
  data: {
    uploadedPhotos: UploadedProfilePhotoDTO[];
  };
  message: string;
}

/**
 * React Native에서는 실제 multipart 요청을 FormData로 전송합니다.
 * 이 타입은 백엔드 계약의 논리적인 필드 구성을 기록하기 위한 DTO입니다.
 */
export interface ProfilePhotosRequestDto {
  profileId: string;
  photos: File[];
}

export interface UserMainPhotoResponseDTO {
  photoURL: string;
}

export interface UserProfilePhotoDTO {
  id: string;
  index: number;
  url: string;
}

export interface UserProfilePhotosResponseDTO {
  photos: UserProfilePhotoDTO[];
}

export interface DeleteUserProfilePhotoRequestDTO {
  photoId: string;
}

export interface ProfilePhotoUploadFile {
  uri: string;
  type: string;
  name: string;
}

export const toProfilePhotoId = toExternalId;

export interface UnlockTargetPhotoRequestDto {
  targetProfileId: string;
  photoId: string;
}

export interface UnlockTargetPhotoResponseDto {
  tingRemains: number;
  eventTingRemains: number;
}
