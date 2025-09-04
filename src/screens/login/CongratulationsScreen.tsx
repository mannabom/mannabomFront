// src/screens/login/CongratulationsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { API_BASE_URL, API_ENDPOINTS_LIST } from '../../config/api';
import { getProfileId, saveAuthTokens } from '../../utils/AuthUtils';
import {
  SignupCompleteRequestDto,
  SignupCompleteResponseDto,
} from '../../types/NicknameAPI';

interface CongratulationsScreenProps {
  onComplete: (userData: any) => void;
}

const { width, height } = Dimensions.get('window');

const CongratulationsScreen: React.FC<CongratulationsScreenProps> = ({
  onComplete,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [initialPoints, setInitialPoints] = useState(100); // 기본값

  // 배경 도형들을 위한 랜덤 위치와 색상
  const backgroundShapes = [
    // 컬러풀한 작은 도형들
    {
      type: 'circle',
      size: 8,
      color: '#FFD93D',
      top: '15%',
      left: '10%',
      rotation: '0deg',
    },
    {
      type: 'triangle',
      size: 12,
      color: '#6BCF7F',
      top: '20%',
      right: '15%',
      rotation: '45deg',
    },
    {
      type: 'square',
      size: 10,
      color: '#4D96FF',
      top: '25%',
      left: '20%',
      rotation: '30deg',
    },
    {
      type: 'circle',
      size: 6,
      color: '#FF6B9D',
      top: '30%',
      right: '25%',
      rotation: '0deg',
    },
    {
      type: 'triangle',
      size: 14,
      color: '#FF9F43',
      top: '10%',
      left: '70%',
      rotation: '60deg',
    },
    {
      type: 'square',
      size: 8,
      color: '#A55EEA',
      top: '35%',
      left: '5%',
      rotation: '15deg',
    },
    {
      type: 'circle',
      size: 10,
      color: '#26C0C7',
      top: '40%',
      right: '10%',
      rotation: '0deg',
    },
    {
      type: 'triangle',
      size: 10,
      color: '#FD5E53',
      top: '45%',
      left: '80%',
      rotation: '90deg',
    },
    {
      type: 'square',
      size: 12,
      color: '#FFD93D',
      top: '50%',
      left: '15%',
      rotation: '45deg',
    },
    {
      type: 'circle',
      size: 14,
      color: '#6BCF7F',
      top: '55%',
      right: '20%',
      rotation: '0deg',
    },
    {
      type: 'triangle',
      size: 8,
      color: '#4D96FF',
      top: '65%',
      left: '25%',
      rotation: '120deg',
    },
    {
      type: 'square',
      size: 6,
      color: '#FF6B9D',
      top: '70%',
      right: '30%',
      rotation: '60deg',
    },
    {
      type: 'circle',
      size: 12,
      color: '#FF9F43',
      top: '75%',
      left: '10%',
      rotation: '0deg',
    },
    {
      type: 'triangle',
      size: 16,
      color: '#A55EEA',
      top: '80%',
      right: '15%',
      rotation: '30deg',
    },
    {
      type: 'square',
      size: 14,
      color: '#26C0C7',
      top: '85%',
      left: '75%',
      rotation: '75deg',
    },
  ];

  const handleCompleteSignup = async () => {
    try {
      setIsLoading(true);

      // 저장된 profileId 가져오기
      const profileId = await getProfileId();
      if (!profileId) {
        throw new Error('프로필 ID가 없습니다. 다시 로그인해주세요.');
      }

      // 회원가입 완료 API 호출
      const requestData: SignupCompleteRequestDto = {
        profileId,
      };

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS_LIST.SIGNUP_COMPLETE}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        },
      );

      const responseData: SignupCompleteResponseDto = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.message || '회원가입 완료 중 오류가 발생했습니다.',
        );
      }

      // 토큰 저장
      await saveAuthTokens(
        responseData.data.accessToken,
        responseData.data.refreshToken,
      );

      // 포인트 정보 업데이트
      setInitialPoints(responseData.data.initialPoints);

      // 완료 처리
      const userData = {
        userId: responseData.data.userId,
        accessToken: responseData.data.accessToken,
        refreshToken: responseData.data.refreshToken,
        initialPoints: responseData.data.initialPoints,
      };

      onComplete(userData);
    } catch (error) {
      console.error('회원가입 완료 오류:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : '회원가입 완료 중 오류가 발생했습니다.';
      Alert.alert('오류', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderShape = (shape: any, index: number) => {
    const shapeStyle = {
      position: 'absolute' as const,
      width: shape.size,
      height: shape.size,
      backgroundColor: shape.color,
      top: shape.top,
      left: shape.left,
      right: shape.right,
      transform: [{ rotate: shape.rotation }],
      zIndex: 1,
    };

    if (shape.type === 'circle') {
      return (
        <View
          key={index}
          style={[
            shapeStyle,
            {
              borderRadius: shape.size / 2,
            },
          ]}
        />
      );
    }

    if (shape.type === 'triangle') {
      return (
        <View
          key={index}
          style={[
            shapeStyle,
            {
              backgroundColor: 'transparent',
              borderLeftWidth: shape.size / 2,
              borderRightWidth: shape.size / 2,
              borderBottomWidth: shape.size,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: shape.color,
              width: 0,
              height: 0,
            },
          ]}
        />
      );
    }

    // square
    return <View key={index} style={shapeStyle} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 배경 그라데이션 효과 */}
      <View style={styles.backgroundGradient} />

      {/* 배경 도형들 */}
      {backgroundShapes.map((shape, index) => renderShape(shape, index))}

      {/* 메인 콘텐츠 */}
      <View style={styles.content}>
        <View style={styles.messageContainer}>
          <Text style={styles.congratulationsText}>축하합니다!</Text>

          <View style={styles.pointContainer}>
            <Text style={styles.pointMainText}>포인트링</Text>
            <Text style={styles.pointAmountText}>{initialPoints}P 지급!</Text>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Text style={styles.detailBullet}>•</Text>
              <Text style={styles.detailText}>
                지금 시작: 지금 즉시 사용 가능
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailBullet}>•</Text>
              <Text style={styles.detailText}>사용기간: 유효기간 30일</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailBullet}>•</Text>
              <Text style={styles.detailText}>
                유의사항: 유효기간 경과 시 소멸
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.confirmButton,
            isLoading && styles.confirmButtonDisabled,
          ]}
          onPress={handleCompleteSignup}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmButtonText}>확인</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F4FD',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#E8F4FD',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 10,
  },
  messageContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 40,
    paddingHorizontal: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 40,
    width: '100%',
    maxWidth: 320,
  },
  congratulationsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 20,
    textAlign: 'center',
  },
  pointContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  pointMainText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4ECDC4',
    marginBottom: 5,
  },
  pointAmountText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  detailsContainer: {
    alignSelf: 'stretch',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  detailBullet: {
    fontSize: 16,
    color: '#666666',
    marginRight: 8,
    marginTop: 2,
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
    lineHeight: 20,
  },
  confirmButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default CongratulationsScreen;
