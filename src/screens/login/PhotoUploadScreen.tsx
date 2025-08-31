// src/screens/login/PhotoUploadScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {
  launchImageLibrary,
  launchCamera,
  ImagePickerResponse,
  MediaType,
} from 'react-native-image-picker';
import apiClient from '../../services/apiClient';
import { getProfileId } from '../../utils/AuthUtils';
import { API_ENDPOINTS_LIST } from '../../config/api';

interface PhotoUploadScreenProps {
  onUploadComplete: () => void;
}

interface UploadedPhoto {
  photoId: string;
  url: string;
}

interface PhotoItem {
  uri: string;
  fileName?: string;
  type?: string;
  fileSize?: number;
}

const { width: screenWidth } = Dimensions.get('window');
const photoWidth = screenWidth - 80; // 좌우 패딩 40씩 제외

const PhotoUploadScreen: React.FC<PhotoUploadScreenProps> = ({
  onUploadComplete,
}) => {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);

  useEffect(() => {
    const fetchProfileId = async () => {
      const id = await getProfileId();
      setProfileId(id);
    };
    fetchProfileId();
  }, []);

  const showImagePickerOptions = () => {
    Alert.alert(
      '사진 선택',
      '프로필 사진을 어떻게 추가하시겠어요?',
      [
        { text: '취소', style: 'cancel' },
        { text: '갤러리에서 선택', onPress: openGallery },
        { text: '카메라로 촬영', onPress: openCamera },
      ],
      { cancelable: true },
    );
  };

  const openGallery = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8 as any, // 타입 호환성을 위해 any로 캐스팅
      selectionLimit: 5 - photos.length, // 최대 5장까지
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.assets && response.assets.length > 0) {
        const newPhotos = response.assets.map(asset => ({
          uri: asset.uri!,
          fileName: asset.fileName,
          type: asset.type,
          fileSize: asset.fileSize,
        }));
        setPhotos(prev => [...prev, ...newPhotos]);
      }
    });
  };

  const openCamera = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8 as any, // 타입 호환성을 위해 any로 캐스팅
    };

    launchCamera(options, (response: ImagePickerResponse) => {
      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        const newPhoto = {
          uri: asset.uri!,
          fileName: asset.fileName,
          type: asset.type,
          fileSize: asset.fileSize,
        };
        setPhotos(prev => [...prev, newPhoto]);
      }
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    if (currentPhotoIndex >= photos.length - 1 && currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!profileId || photos.length === 0 || isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('profileId', profileId);

      photos.forEach((photo, index) => {
        formData.append('photos', {
          uri: photo.uri,
          type: photo.type || 'image/jpeg',
          name: photo.fileName || `photo_${index}.jpg`,
        } as any);
      });

      const response = await apiClient.post(
        API_ENDPOINTS_LIST.PROFILE_PHOTOS,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      if (response.data.success) {
        setUploadedPhotos(response.data.data.uploadedPhotos);
        Alert.alert(
          '업로드 완료',
          response.data.message || '프로필 사진이 업로드되었습니다.',
          [{ text: '확인', onPress: onUploadComplete }],
        );
      } else {
        Alert.alert(
          '오류',
          response.data.message || '사진 업로드에 실패했습니다.',
        );
      }
    } catch (error) {
      console.error('사진 업로드 오류:', error);
      Alert.alert('오류', '네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPhotoSlider = () => {
    if (photos.length === 0) {
      // 기본 투명한 사람 실루엣
      return (
        <View style={styles.emptyPhotoContainer}>
          <View style={styles.emptyPhoto}>
            <Text style={styles.emptyPhotoIcon}>👤</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.photoSliderContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={event => {
            const index = Math.round(
              event.nativeEvent.contentOffset.x / photoWidth,
            );
            setCurrentPhotoIndex(index);
          }}
        >
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoContainer}>
              <Image source={{ uri: photo.uri }} style={styles.photo} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removePhoto(index)}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* 페이지 인디케이터 */}
        {photos.length > 1 && (
          <View style={styles.pageIndicator}>
            {photos.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  currentPhotoIndex === index && styles.activeDot,
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>프로필 사진 등록</Text>
          <Text style={styles.subtitle}>
            매력적인 프로필 사진을 등록해주세요!
          </Text>

          {/* 사진 슬라이더 */}
          {renderPhotoSlider()}

          {/* 업로드 가이드 */}
          <View style={styles.guideContainer}>
            <Text style={styles.guideTitle}>사진 등록 가이드</Text>
            <View style={styles.guideItem}>
              <Text style={styles.guideBullet}>1</Text>
              <View>
                <Text style={styles.guideText}>사진 등록 최대</Text>
                <Text style={styles.guideSubText}>
                  • 사진 한 장에 사람 한 명이 나와야 함
                </Text>
                <Text style={styles.guideSubText}>
                  • 등록된 사진이 여러 장이면 옆으로 넘기며 확인
                </Text>
                <Text style={styles.guideSubText}>
                  • 정면에는 본인만 다른 사진이 나와야 함
                </Text>
              </View>
            </View>

            <View style={styles.guideItem}>
              <Text style={styles.guideBullet}>2</Text>
              <View>
                <Text style={styles.guideText}>사진 업로드 버튼</Text>
                <Text style={styles.guideSubText}>
                  • 누를 시 갤러리 목록 또는 사진 찍기 팝업
                </Text>
                <Text style={styles.guideSubText}>• 선택한 사진 업로드</Text>
              </View>
            </View>

            <View style={styles.guideItem}>
              <Text style={styles.guideBullet}>3</Text>
              <Text style={styles.guideText}>완료하기 버튼</Text>
              <Text style={styles.guideSubText}>
                사진이 한 장 이상 등록되기 전까지는 비활성화
              </Text>
            </View>
          </View>

          {/* 버튼들 */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={showImagePickerOptions}
              disabled={isLoading || photos.length >= 5}
            >
              <Text style={styles.uploadButtonText}>
                사진 업로드하기 ({photos.length}/5)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.completeButton,
                photos.length === 0 || isLoading
                  ? styles.completeButtonDisabled
                  : styles.completeButtonActive,
              ]}
              onPress={handleSubmit}
              disabled={photos.length === 0 || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.completeButtonText,
                    photos.length === 0
                      ? styles.completeButtonTextDisabled
                      : styles.completeButtonTextActive,
                  ]}
                >
                  완료하기
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
  },
  emptyPhotoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  emptyPhoto: {
    width: photoWidth,
    height: photoWidth * 1.2,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  emptyPhotoIcon: {
    fontSize: 80,
    color: '#CCCCCC',
  },
  photoSliderContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  photoContainer: {
    width: photoWidth,
    height: photoWidth * 1.2,
    marginHorizontal: 0,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  pageIndicator: {
    flexDirection: 'row',
    marginTop: 15,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: '#FF6B6B',
  },
  guideContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  guideItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  guideBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6B6B',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 20,
    marginRight: 12,
    marginTop: 2,
  },
  guideText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  guideSubText: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
  },
  buttonContainer: {
    gap: 12,
  },
  uploadButton: {
    backgroundColor: '#FFB6C1',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  completeButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  completeButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  completeButtonTextActive: {
    color: '#FFFFFF',
  },
  completeButtonTextDisabled: {
    color: '#999999',
  },
});

export default PhotoUploadScreen;
