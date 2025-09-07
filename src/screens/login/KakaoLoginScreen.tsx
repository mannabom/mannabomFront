// src/screens/login/KakaoLoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  ImageBackground,
  Dimensions,
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

const { width, height } = Dimensions.get('window');

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

      // 사용자가 취소한 경우 (null 반환)
      if (result === null) {
        console.log('사용자가 카카오 로그인을 취소했습니다.');
        return; // 조용히 종료 - 에러 메시지 표시하지 않음
      }

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

      // 사용자 취소가 아닌 실제 오류만 표시
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
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* 배경 이미지 */}
      <ImageBackground
        source={require('../../assets/images/login_screen.png')} // 이미지 경로
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* 메인 콘텐츠 - 카카오 로그인 버튼만 */}
        <View style={styles.contentContainer}>
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
                <ActivityIndicator size="small" color="#381E1E" />
              ) : (
                <>
                  {/* 말풍선 아이콘 */}
                  <Text style={styles.kakaoIcon}>💬</Text>
                  <Text style={styles.kakaoButtonText}>카카오 간편 로그인</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </ImageBackground>

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
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    maxWidth: 300,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  kakaoButtonDisabled: {
    opacity: 0.6,
    backgroundColor: '#F0F0F0',
  },
  kakaoButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
  },
  kakaoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  kakaoButtonText: {
    color: '#381E1E',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default KakaoLoginScreen;
