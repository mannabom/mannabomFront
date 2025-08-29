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
import {
  KakaoLoginService,
  MockKakaoLoginService,
} from '../../services/KakaoLoginService';
import { saveAuthTokens, saveProfileId } from '../../utils/AuthUtils';
import AgeRestrictionModal from '../../components/login/AgeRestrictionModal';

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
    if (isLoading) return;

    try {
      setIsLoading(true);
      console.log('카카오 로그인 시작');

      let result;

      // 실제 카카오 로그인 사용
      console.log('실제 카카오 로그인 사용');
      result = await KakaoLoginService.performKakaoLogin();

      console.log('카카오 로그인 결과:', result);

      // 결과에 따라 처리
      switch (result.nextStep) {
        case 'home':
          // 기존 회원 - 토큰 저장 후 홈으로
          if (result.userData.accessToken && result.userData.refreshToken) {
            await saveAuthTokens(
              result.userData.accessToken,
              result.userData.refreshToken,
            );
          }

          Alert.alert(
            '로그인 성공',
            `${result.userData.nickname}님, 환영합니다!`,
            [
              {
                text: '확인',
                onPress: () => onLoginSuccess(result.userData),
              },
            ],
          );
          break;

        case 'signup':
          // 신규 사용자 - 회원가입 진행
          if (result.userData.kakaoUserInfo.profileId) {
            await saveProfileId(result.userData.kakaoUserInfo.profileId);
          }

          console.log('신규 사용자 - 회원가입 진행');
          onSignupRequired(result.userData.kakaoUserInfo);
          break;

        case 'ageRestricted':
          // 연령 제한 - 모달 표시
          console.log('연령 제한 사용자');
          setShowAgeRestrictionModal(true);
          break;

        default:
          throw new Error('알 수 없는 결과 타입');
      }
    } catch (error) {
      console.error('카카오 로그인 오류:', error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : '로그인 중 오류가 발생했습니다. 다시 시도해주세요.';

      Alert.alert('로그인 실패', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgeRestrictionClose = () => {
    setShowAgeRestrictionModal(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#87CEEB" />

      <View style={styles.backgroundContainer}>
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
                  <Text style={styles.kakaoButtonText}>
                    {isLoading ? '로그인 중...' : '카카오 간편 로그인'}
                  </Text>
                </>
              )}
            </View>
          </TouchableOpacity>

          {/* 개발 모드 표시 */}
          {__DEV__ && (
            <Text style={styles.devModeText}>
              개발 모드: 카카오 SDK 실패시 Mock 데이터 사용
            </Text>
          )}
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
    backgroundColor: '#87CEEB',
  },
  loginContainer: {
    position: 'absolute',
    bottom: 200,
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
    opacity: 0.6,
    backgroundColor: '#F0F0F0',
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
  devModeText: {
    marginTop: 10,
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.8,
  },
});

export default KakaoLoginScreen;
