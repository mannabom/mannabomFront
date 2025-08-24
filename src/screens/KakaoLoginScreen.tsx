// src/screens/KakaoLoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { KakaoAPIService } from '../services/KakaoAPIService';
import AgeRestrictionModal from '../components/AgeRestrictionModal';

interface KakaoLoginScreenProps {
  onLoginSuccess: (userData?: any) => void;
  onSignupRequired: (kakaoUserInfo: any) => void;
}

const KakaoLoginScreen: React.FC<KakaoLoginScreenProps> = ({
  onLoginSuccess,
  onSignupRequired,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showAgeRestrictionModal, setShowAgeRestrictionModal] = useState(false);

  const handleKakaoLogin = async () => {
    try {
      setIsLoading(true);

      // Mock 데이터 사용 (백엔드 API 연동 전까지)
      const response = await KakaoAPIService.mockKakaoLogin();

      const { nextStep, userData } =
        KakaoAPIService.handleLoginResponse(response);

      switch (nextStep) {
        case 'home':
          // 기존 회원 - 토큰 저장 후 홈 화면으로
          onLoginSuccess(userData);
          break;

        case 'signup':
          // 신규 사용자 - 회원가입 진행
          onSignupRequired(userData.kakaoUserInfo);
          break;

        case 'ageRestricted':
          // 연령 제한 - 모달 표시 (바로 종료하지 않음)
          setShowAgeRestrictionModal(true);
          break;
      }
    } catch (error) {
      console.error('카카오 로그인 오류:', error);
      Alert.alert(
        '로그인 실패',
        '로그인 중 오류가 발생했습니다. 다시 시도해주세요.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgeRestrictionClose = () => {
    // 팝업을 먼저 닫고, 앱 종료는 모달 내부의 버튼에서 처리
    setShowAgeRestrictionModal(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#87CEEB" />

      {/* 스플래시와 동일한 배경 */}
      <View style={styles.backgroundContainer}>
        {/* 카카오 로그인 버튼만 중앙에 배치 */}
        <View style={styles.loginContainer}>
          <TouchableOpacity
            style={[
              styles.kakaoButton,
              isLoading && styles.kakaoButtonDisabled,
            ]}
            onPress={handleKakaoLogin}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <View style={styles.kakaoButtonContent}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <>
                  <Text style={styles.kakaoIcon}>💬</Text>
                  <Text style={styles.kakaoButtonText}>카카오 간편 로그인</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* 연령 제한 모달 */}
      <AgeRestrictionModal
        visible={showAgeRestrictionModal}
        onClose={handleAgeRestrictionClose}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundContainer: {
    flex: 1,
    backgroundColor: '#87CEEB', // 스플래시와 동일한 배경색
  },
  loginContainer: {
    position: 'absolute',
    bottom: 200, // 화면 하단에서 200px 위
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    maxWidth: 250,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  kakaoButtonDisabled: {
    opacity: 0.7,
  },
  kakaoButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 24,
  },
  kakaoIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  kakaoButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default KakaoLoginScreen;
