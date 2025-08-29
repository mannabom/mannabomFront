// src/screens/LoginScreen.tsx
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

interface LoginScreenProps {
  onLoginSuccess: (userData?: any) => void;
  onSignupRequired?: (kakaoUserInfo: any) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onSignupRequired,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showAgeRestrictionModal, setShowAgeRestrictionModal] = useState(false);

  const handleLogin = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      console.log('카카오 로그인 시작');

      let result;

      // 실제 카카오 로그인 사용
      result = await KakaoLoginService.performKakaoLogin();

      console.log('카카오 로그인 결과:', result);

      switch (result.nextStep) {
        case 'home':
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
          if (result.userData.kakaoUserInfo.profileId) {
            await saveProfileId(result.userData.kakaoUserInfo.profileId);
          }

          if (onSignupRequired) {
            console.log('신규 사용자 - 회원가입 진행');
            onSignupRequired(result.userData.kakaoUserInfo);
          } else {
            Alert.alert('회원가입 필요', '회원가입이 필요한 사용자입니다.');
          }
          break;

        case 'ageRestricted':
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.content}>
        <Text style={styles.title}>만나봄</Text>
        <Text style={styles.subtitle}>
          카카오 계정으로 간편하게 로그인하세요
        </Text>

        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <View style={styles.buttonContent}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <>
                <Text style={styles.kakaoIcon}>💬</Text>
                <Text style={styles.loginButtonText}>
                  {isLoading ? '로그인 중...' : '카카오 로그인'}
                </Text>
              </>
            )}
          </View>
        </TouchableOpacity>

        {__DEV__ && (
          <Text style={styles.devModeText}>
            개발 모드: 카카오 SDK 실패시 Mock 데이터 사용
          </Text>
        )}
      </View>

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
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 40,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#FEE500',
    paddingVertical: 15,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    maxWidth: 300,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loginButtonDisabled: {
    opacity: 0.6,
    backgroundColor: '#F0F0F0',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 24,
  },
  kakaoIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  loginButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  devModeText: {
    marginTop: 20,
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
  },
});

export default LoginScreen;
