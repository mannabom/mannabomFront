import { API_ENDPOINTS_LIST } from '../config/api';
import type {
  DeleteUserProfilePhotoRequestDTO,
  ProfilePhotoUploadFile,
  UserProfilePhotosResponseDTO,
} from '../types/ProfilePhotoAPI';
import { toSafeProfilePhotoId } from '../types/ProfilePhotoAPI';
import apiClient from './apiClient';

const sortByServerIndex = (
  response: UserProfilePhotosResponseDTO,
): UserProfilePhotosResponseDTO => {
  if (!Array.isArray(response?.photos)) {
    throw new Error('사진 목록 응답 형식이 올바르지 않습니다.');
  }

  return {
    photos: [...response.photos].sort((left, right) => left.index - right.index),
  };
};

class ProfilePhotoApiService {
  async getAllPhotos(): Promise<UserProfilePhotosResponseDTO> {
    const response = await apiClient.get<UserProfilePhotosResponseDTO>(
      API_ENDPOINTS_LIST.USER_ALL_PHOTOS,
    );
    return sortByServerIndex(response.data);
  }

  async addPhoto(
    photo: ProfilePhotoUploadFile,
  ): Promise<UserProfilePhotosResponseDTO> {
    const formData = new FormData();
    formData.append('photo', photo as any);

    const response = await apiClient.post<UserProfilePhotosResponseDTO>(
      API_ENDPOINTS_LIST.USER_PHOTO,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return sortByServerIndex(response.data);
  }

  async deletePhoto(photoId: number): Promise<UserProfilePhotosResponseDTO> {
    const safePhotoId = toSafeProfilePhotoId(photoId);
    if (!safePhotoId) {
      throw new Error('삭제할 사진 ID가 올바르지 않습니다.');
    }

    const request: DeleteUserProfilePhotoRequestDTO = {
      photoId: safePhotoId,
    };
    const response = await apiClient.delete<UserProfilePhotosResponseDTO>(
      API_ENDPOINTS_LIST.USER_PHOTO,
      { data: request },
    );
    return sortByServerIndex(response.data);
  }
}

export const profilePhotoApiService = new ProfilePhotoApiService();
