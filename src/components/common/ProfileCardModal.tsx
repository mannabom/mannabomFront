// src/components/common/ProfileCardModal.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { datingApiService } from '../../services/DatingApiService';
import {
  ProfileMatchConditionResponse,
  FilterSettings,
} from '../../types/DatingAPI';
import {
  smokingHabitLabels,
  drinkingHabitLabels,
} from '../../utils/DatingUtils';

interface ProfileCardModalProps {
  visible: boolean;
  onClose: () => void;
  filterSettings?: FilterSettings;
}

const ProfileCardModal: React.FC<ProfileCardModalProps> = ({
  visible,
  onClose,
  filterSettings,
}) => {
  const [currentProfile, setCurrentProfile] =
    useState<ProfileMatchConditionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [rated, setRated] = useState(false);

  // 새 프로필 가져오기
  const loadNewProfile = async () => {
    if (!filterSettings) return;

    setLoading(true);
    try {
      const condition = {
        minAge: filterSettings.ageRange.min,
        maxAge: filterSettings.ageRange.max,
        smoking: filterSettings.smoking,
        drinking: filterSettings.drinking,
      };

      const profile = await datingApiService.getMatchingProfile(condition);
      setCurrentProfile(profile);
      setRating(0);
      setRated(false);
    } catch (error) {
      console.error('프로필 로드 실패:', error);
      Alert.alert('오류', '프로필을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 모달 열릴 때 프로필 로드
  useEffect(() => {
    if (visible && filterSettings) {
      loadNewProfile();
    }
  }, [visible, filterSettings]);

  // 평점 매기기
  const handleRating = async (score: number) => {
    if (!currentProfile || rated) return;

    try {
      setRating(score);
      const success = await datingApiService.rateProfile({
        targetUserId: currentProfile.userId,
        score,
      });

      if (success) {
        setRated(true);
        if (score >= 4) {
          Alert.alert('감사합니다!', '높은 별점을 주셨군요! ✨');
        }
      } else {
        Alert.alert('오류', '평점 저장에 실패했습니다.');
        setRating(0);
      }
    } catch (error) {
      console.error('평점 저장 실패:', error);
      Alert.alert('오류', '평점 저장 중 오류가 발생했습니다.');
      setRating(0);
    }
  };

  // 다음 프로필 보기
  const handleNextProfile = () => {
    loadNewProfile();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>프로필 매칭</Text>
          <TouchableOpacity onPress={handleNextProfile} disabled={loading}>
            <Text
              style={[styles.nextButton, loading && styles.nextButtonDisabled]}
            >
              다음
            </Text>
          </TouchableOpacity>
        </View>

        {/* 콘텐츠 */}
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF6B6B" />
              <Text style={styles.loadingText}>새로운 프로필을 찾는 중...</Text>
            </View>
          ) : currentProfile ? (
            <View style={styles.profileContainer}>
              {/* 프로필 이미지 */}
              <Image
                source={{ uri: currentProfile.profileImageUrl }}
                style={styles.profileImage}
                resizeMode="cover"
              />

              {/* 프로필 정보 */}
              <View style={styles.profileInfo}>
                <Text style={styles.userId}>
                  사용자 {currentProfile.userId}
                </Text>
                <Text style={styles.profileDetails}>
                  {currentProfile.age}세 • {currentProfile.mbti}
                </Text>
                <Text style={styles.profileHabits}>
                  {smokingHabitLabels[currentProfile.smoking]} •{' '}
                  {drinkingHabitLabels[currentProfile.drinking]}
                </Text>
              </View>

              {/* 평점 하트 */}
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingTitle}>
                  {rated ? '평가 완료!' : '이 분은 어떠신가요?'}
                </Text>
                <View style={styles.hearts}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => handleRating(star)}
                      disabled={rated}
                      style={styles.heartButton}
                    >
                      <Text
                        style={[
                          styles.heart,
                          star <= rating
                            ? styles.heartFilled
                            : styles.heartEmpty,
                          rated && styles.heartDisabled,
                        ]}
                      >
                        ♥
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 액션 버튼들 */}
              <View style={styles.actions}>
                {!rated && (
                  <TouchableOpacity
                    style={styles.skipButton}
                    onPress={handleNextProfile}
                  >
                    <Text style={styles.skipButtonText}>건너뛰기</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.nextProfileButton}
                  onPress={handleNextProfile}
                >
                  <Text style={styles.nextProfileButtonText}>
                    {rated ? '다음 프로필' : '새로운 프로필'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>프로필을 불러올 수 없습니다</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={loadNewProfile}
              >
                <Text style={styles.retryButtonText}>다시 시도</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  closeButton: {
    fontSize: 18,
    color: '#666666',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  nextButton: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  nextButtonDisabled: {
    color: '#CCCCCC',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  profileContainer: {
    alignItems: 'center',
  },
  profileImage: {
    width: 280,
    height: 350,
    borderRadius: 20,
    marginBottom: 20,
    backgroundColor: '#F0F0F0', // 로딩 중 배경색
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  userId: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  profileDetails: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 4,
  },
  profileHabits: {
    fontSize: 14,
    color: '#888888',
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  ratingTitle: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 15,
    fontWeight: '500',
  },
  hearts: {
    flexDirection: 'row',
    gap: 10,
  },
  heartButton: {
    padding: 5,
  },
  heart: {
    fontSize: 32,
  },
  heartEmpty: {
    color: '#E0E0E0',
  },
  heartFilled: {
    color: '#FF6B6B',
  },
  heartDisabled: {
    opacity: 0.6,
  },
  actions: {
    flexDirection: 'row',
    gap: 15,
  },
  skipButton: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  skipButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500',
  },
  nextProfileButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  nextProfileButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileCardModal;
