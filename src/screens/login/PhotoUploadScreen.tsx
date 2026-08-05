// src/screens/login/PhotoUploadScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
  Dimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import {
  launchImageLibrary,
  launchCamera,
  ImagePickerResponse,
  MediaType,
} from 'react-native-image-picker';
import signupApiClient from '../../services/signupApiClient';
import { getSignupProfileId } from '../../utils/AuthUtils';
import { API_ENDPOINTS_LIST } from '../../config/api';
import type { ProfilePhotosResponseDto } from '../../types/ProfilePhotoAPI';
import { requireExternalId } from '../../utils/IdUtils';

interface PhotoUploadScreenProps {
  onUploadComplete: () => void;
}

interface PhotoItem {
  uri: string;
  fileName?: string;
  type?: string;
  fileSize?: number;
}

const { width: SCREEN_W } = Dimensions.get('window');

// ✅ 최대 5장 고정
const MAX_PHOTOS = 5;

const CARD_W = Math.round(SCREEN_W * 0.62);
const CARD_H = Math.round(CARD_W * 1.15);

// ✅ “겹쳐 보이게”
const ITEM_W = Math.round(CARD_W * 0.67);
const SIDE_PADDING = Math.round((SCREEN_W - ITEM_W) / 2);

const PINK = '#FFB6C1';
const PINK_STRONG = '#FF6B6B';

const PhotoUploadScreen: React.FC<PhotoUploadScreenProps> = ({
  onUploadComplete,
}) => {
  const [signupProfileId, setSignupProfileId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const listRef = useRef<any>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchProfileId = async () => {
      const id = await getSignupProfileId();
      setSignupProfileId(id);
    };
    fetchProfileId();
  }, []);

  const canUploadMore = photos.length < MAX_PHOTOS && !isLoading;
  const canSubmit = photos.length > 0 && !!signupProfileId && !isLoading;

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
      quality: 0.8 as any,
      selectionLimit: MAX_PHOTOS - photos.length, // ✅ 남은 개수만큼만 선택 가능
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel) return;

      if (response.errorCode) {
        Alert.alert('오류', '갤러리 접근 중 문제가 발생했어요.');
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const newPhotos = response.assets
          .filter(a => !!a.uri)
          .map(asset => ({
            uri: asset.uri!,
            fileName: asset.fileName,
            type: asset.type,
            fileSize: asset.fileSize,
          }));

        setPhotos(prev => {
          // ✅ 어떤 상황이 와도 최대 5장 유지
          const merged = [...prev, ...newPhotos].slice(0, MAX_PHOTOS);
          const nextIndex = Math.max(0, merged.length - 1);

          setTimeout(() => {
            listRef.current?.scrollToOffset({
              offset: nextIndex * ITEM_W,
              animated: true,
            });
            setCurrentPhotoIndex(nextIndex);
          }, 50);

          return merged;
        });
      }
    });
  };

  const openCamera = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8 as any,
    };

    launchCamera(options, (response: ImagePickerResponse) => {
      if (response.didCancel) return;

      if (response.errorCode) {
        Alert.alert('오류', '카메라 실행 중 문제가 발생했어요.');
        return;
      }

      if (response.assets && response.assets[0]?.uri) {
        const asset = response.assets[0];
        const newPhoto: PhotoItem = {
          uri: asset.uri!,
          fileName: asset.fileName,
          type: asset.type,
          fileSize: asset.fileSize,
        };

        setPhotos(prev => {
          // ✅ 카메라도 무조건 최대 5장 유지
          const merged = [...prev, newPhoto].slice(0, MAX_PHOTOS);
          const nextIndex = Math.max(0, merged.length - 1);

          setTimeout(() => {
            listRef.current?.scrollToOffset({
              offset: nextIndex * ITEM_W,
              animated: true,
            });
            setCurrentPhotoIndex(nextIndex);
          }, 50);

          return merged;
        });
      }
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      const merged = prev.filter((_, i) => i !== index);
      const nextIndex = Math.max(0, Math.min(index, merged.length - 1));

      setTimeout(() => {
        listRef.current?.scrollToOffset({
          offset: nextIndex * ITEM_W,
          animated: true,
        });
        setCurrentPhotoIndex(nextIndex);
      }, 50);

      return merged;
    });
  };

  const goPrev = () => {
    if (photos.length <= 1) return;
    const next = Math.max(0, currentPhotoIndex - 1);
    setCurrentPhotoIndex(next);
    listRef.current?.scrollToOffset({ offset: next * ITEM_W, animated: true });
  };

  const goNext = () => {
    if (photos.length <= 1) return;
    const next = Math.min(photos.length - 1, currentPhotoIndex + 1);
    setCurrentPhotoIndex(next);
    listRef.current?.scrollToOffset({ offset: next * ITEM_W, animated: true });
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('profileId', signupProfileId as string);

      // ✅ 최대 5장만 업로드되도록 보장
      photos.slice(0, MAX_PHOTOS).forEach((photo, index) => {
        formData.append('photos', {
          uri: photo.uri,
          type: photo.type || 'image/jpeg',
          name: photo.fileName || `photo_${index}.jpg`,
        } as any);
      });

      const response = await signupApiClient.post(
        API_ENDPOINTS_LIST.PROFILE_PHOTOS,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      const responseData = response.data as ProfilePhotosResponseDto;
      if (responseData.success) {
        if (
          !Array.isArray(responseData.data?.uploadedPhotos) ||
          responseData.data.uploadedPhotos.length === 0
        ) {
          throw new Error('업로드된 사진 목록이 없는 잘못된 서버 응답입니다.');
        }
        responseData.data.uploadedPhotos.forEach(photo => {
          requireExternalId(photo.photoId, '프로필 사진 ID');
          if (typeof photo.url !== 'string' || !photo.url.trim()) {
            throw new Error('프로필 사진 URL이 없는 잘못된 서버 응답입니다.');
          }
        });
        // ✅ 성공 팝업 제거: 업로드 성공하면 바로 다음
        onUploadComplete();
      } else {
        Alert.alert(
          '오류',
          responseData.message || '사진 업로드에 실패했습니다.',
        );
      }
    } catch (error: any) {
      const serverMessage = error.response?.data?.message;
      const serverDetails = error.response?.data?.details;
      const status = error.response?.status;
      const fallbackMessage =
        status === 401 && error.message
          ? error.message
          : status || serverMessage || serverDetails
            ? `status: ${status ?? 'unknown'}\nmessage: ${
                serverMessage || '응답 메시지 없음'
              }${serverDetails ? `\ndetails: ${serverDetails}` : ''}`
            : '사진 업로드 중 오류가 발생했습니다. 다시 시도해주세요.';

      if (__DEV__) {
        console.warn('사진 업로드 오류:', {
          status,
          message: serverMessage || error.message,
        });
      }

      Alert.alert(
        '오류',
        serverMessage || fallbackMessage,
        [{ text: '확인', style: 'cancel' }],
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onMomentumEnd = (x: number) => {
    const index = Math.round(x / ITEM_W);
    const clamped = Math.max(
      0,
      Math.min(index, Math.max(0, photos.length - 1)),
    );
    setCurrentPhotoIndex(clamped);
  };

  const renderEmptyCard = () => {
    return (
      <View style={styles.sliderWrap}>
        <View style={styles.card}>
          <Text style={styles.placeholderIcon}>👤</Text>
        </View>
      </View>
    );
  };

  const renderItem = ({ item, index }: { item: PhotoItem; index: number }) => {
    const inputRange = [
      (index - 1) * ITEM_W,
      index * ITEM_W,
      (index + 1) * ITEM_W,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.86, 1, 0.86],
      extrapolate: 'clamp',
    });

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [18, 0, 18],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.75, 1, 0.75],
      extrapolate: 'clamp',
    });

    const isCenter = index === currentPhotoIndex;

    return (
      <View style={styles.itemSlot}>
        <Animated.View
          style={[
            styles.card,
            styles.cardShadow,
            {
              opacity,
              transform: [{ translateY }, { scale }],
              zIndex: isCenter ? 20 : 1,
            },
          ]}
        >
          <Image source={{ uri: item.uri }} style={styles.photo} />

          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removePhoto(index)}
            activeOpacity={0.85}
          >
            <Text style={styles.removeButtonText}>×</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  const renderCarousel = () => {
    if (photos.length === 0) return renderEmptyCard();

    return (
      <View style={styles.sliderWrap}>
        <TouchableOpacity
          style={[
            styles.arrowBtn,
            styles.arrowLeft,
            currentPhotoIndex === 0 && styles.arrowBtnDisabled,
          ]}
          onPress={goPrev}
          disabled={currentPhotoIndex === 0}
          activeOpacity={0.8}
        >
          <Text style={styles.arrowText}>‹</Text>
        </TouchableOpacity>

        <Animated.FlatList
          ref={listRef}
          data={photos}
          keyExtractor={(p, i) => `${p.uri}-${i}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={false}
          decelerationRate="fast"
          snapToInterval={ITEM_W}
          snapToAlignment="start"
          contentContainerStyle={{ paddingHorizontal: SIDE_PADDING }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true },
          )}
          onMomentumScrollEnd={e =>
            onMomentumEnd(e.nativeEvent.contentOffset.x)
          }
          scrollEventThrottle={16}
          renderItem={renderItem}
        />

        <TouchableOpacity
          style={[
            styles.arrowBtn,
            styles.arrowRight,
            currentPhotoIndex === photos.length - 1 && styles.arrowBtnDisabled,
          ]}
          onPress={goNext}
          disabled={currentPhotoIndex === photos.length - 1}
          activeOpacity={0.8}
        >
          <Text style={styles.arrowText}>›</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.page}>
        <View style={styles.centerGroup}>
          {renderCarousel()}

          <View style={styles.noticeArea}>
            <Text style={styles.helperText}>프로필 사진을 등록해주세요</Text>
            <Text style={styles.warnText}>*최소 한 장은 등록해야 합니다.</Text>
            <Text style={styles.maxText}>최대 {MAX_PHOTOS}장까지 업로드 가능</Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.smallButton,
                canUploadMore
                  ? styles.uploadButtonActive
                  : styles.buttonDisabled,
              ]}
              onPress={showImagePickerOptions}
              disabled={!canUploadMore}
              activeOpacity={0.85}
            >
              <Text style={styles.smallButtonTextDark}>사진 업로드하기</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.smallButton,
                canSubmit ? styles.completeButtonActive : styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!canSubmit}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.smallButtonTextLight}>
                  완료하기
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  page: {
    flex: 1,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerGroup: {
    width: '100%',
    alignItems: 'center',
  },

  sliderWrap: {
    width: '100%',
    height: CARD_H + 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  itemSlot: {
    width: ITEM_W,
    height: CARD_H,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },

  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

  placeholderIcon: {
    fontSize: 58,
    color: '#BDBDBD',
  },

  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: -1,
  },

  arrowBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    zIndex: 50,
  },
  arrowLeft: { left: 2 },
  arrowRight: { right: 2 },
  arrowBtnDisabled: { opacity: 0.3 },
  arrowText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333333',
    marginTop: -2,
  },

  noticeArea: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 14,
  },
  helperText: { fontSize: 13, color: '#333333', marginBottom: 6 },
  warnText: { fontSize: 12, color: PINK_STRONG, fontWeight: '800' },
  maxText: { fontSize: 12, color: '#666', marginTop: 6 },

  buttonRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  smallButton: {
    width: '40%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonActive: { backgroundColor: PINK },
  completeButtonActive: { backgroundColor: PINK_STRONG },
  buttonDisabled: { backgroundColor: '#E0E0E0' },

  smallButtonTextDark: {
    fontSize: 14,
    fontWeight: '800',
    color: '#333333',
  },
  smallButtonTextLight: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default PhotoUploadScreen;
