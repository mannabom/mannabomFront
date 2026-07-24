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
  id: number;
  index: number;
  url: string;
}

export interface UserProfilePhotosResponseDTO {
  photos: UserProfilePhotoDTO[];
}

export interface DeleteUserProfilePhotoRequestDTO {
  photoId: number;
}

export interface ProfilePhotoUploadFile {
  uri: string;
  type: string;
  name: string;
}

export const toSafeProfilePhotoId = (value: unknown): number | null => {
  const trimmedValue = typeof value === 'string' ? value.trim() : '';
  const numericValue =
    typeof value === 'number'
      ? value
      : /^\d+$/.test(trimmedValue)
        ? Number(trimmedValue)
        : Number.NaN;

  return Number.isSafeInteger(numericValue) && numericValue > 0
    ? numericValue
    : null;
};

export interface UnlockTargetPhotoRequestDto {
  targetProfileId: number;
  photoId: number;
}

export interface UnlockTargetPhotoResponseDto {
  tingRemains: number;
  eventTingRemains: number;
}
