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
import { KakaoLoginService } from '../../services/KakaoLoginService';
import {
  clearSignupProfileId,
  getSignupProfileId,
  saveAuthenticatedSession,
  saveSignupProfileId,
} from '../../utils/AuthUtils';
import { clearAllProfileData } from '../../utils/ProfileStorage';
import { requireExternalId } from '../../utils/IdUtils';
import AgeRestrictionModal from '../../components/login/AgeRestrictionModal';

// ✅ 로그인 성공 직후 토큰 확보 & 서버 등록
import { registerFcmTokenToServer } from '../../services/PushTokenService';

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
      if (__DEV__) console.log('카카오 로그인 시작');

      let result;

      // 실제 카카오 로그인 사용
      if (__DEV__) console.log('실제 카카오 로그인 사용');
      result = await KakaoLoginService.performKakaoLogin();

      // 사용자가 취소한 경우 (null 반환)
      if (result === null) {
        if (__DEV__) console.log('사용자가 카카오 로그인을 취소했습니다.');
        return;
      }

      if (__DEV__) console.log('카카오 로그인 다음 단계:', result.nextStep);

      switch (result.nextStep) {
        case 'home':
          // 기존 회원 - 영구 userId와 토큰을 함께 저장 후 홈으로
          if (
            !result.userData.accessToken ||
            !result.userData.refreshToken ||
            result.userData.userId == null
          ) {
            throw new Error('로그인 응답에 사용자 정보가 없습니다.');
          }
          await saveAuthenticatedSession(
            result.userData.accessToken,
            result.userData.refreshToken,
            result.userData.userId,
          );
          const staleSignupProfileId = await getSignupProfileId();
          try {
            await clearAllProfileData(staleSignupProfileId ?? undefined);
            await clearSignupProfileId();
          } catch (cleanupError) {
            if (__DEV__) {
              console.warn(
                '기존 가입 임시 데이터 정리 실패(로그인은 계속 진행):',
                cleanupError,
              );
            }
          }

          // ✅ 토큰 저장 직후: FCM 토큰 서버 등록
          try {
            await registerFcmTokenToServer();
          } catch (e) {
            if (__DEV__) console.warn('⚠️ [KakaoLogin] registerFcmTokenToServer failed (ignored):', e);
          }

          Alert.alert(
            '로그인 성공',
            `${result.userData.nickname}님, 환영합니다!`,
            [{ text: '확인', onPress: () => onLoginSuccess(result.userData) }],
          );
          break;

        case 'signup':
          // 신규 사용자 - 회원가입 진행
          const kakaoUserInfo = result.userData?.kakaoUserInfo;
          const signupProfileId = requireExternalId(
            kakaoUserInfo?.profileId,
            '가입 진행 ID',
          );
          const storedSignupProfileId = await getSignupProfileId();

          if (
            storedSignupProfileId &&
            storedSignupProfileId !== signupProfileId
          ) {
            await clearAllProfileData(storedSignupProfileId);
            await clearSignupProfileId();
          }

          await saveSignupProfileId(signupProfileId);

          if (__DEV__) console.log('신규 사용자 - 회원가입 진행');
          onSignupRequired({
            ...kakaoUserInfo,
            profileId: signupProfileId,
          });
          break;

        case 'ageRestricted':
          if (__DEV__) console.log('연령 제한 사용자');
          setShowAgeRestrictionModal(true);
          break;

        default:
          throw new Error('알 수 없는 결과 타입');
      }
    } catch (error) {
      if (__DEV__) console.warn('카카오 로그인 오류:', error);

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

      <ImageBackground
        source={require('../../assets/images/login_screen.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.contentContainer}>
          <TouchableOpacity
            style={[styles.kakaoButton, isLoading && styles.kakaoButtonDisabled]}
            onPress={handleKakaoLogin}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <View style={styles.kakaoButtonContent}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#381E1E" />
              ) : (
                <>
                  <Text style={styles.kakaoIcon}>💬</Text>
                  <Text style={styles.kakaoButtonText}>카카오 간편 로그인</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </ImageBackground>

      <AgeRestrictionModal
        visible={showAgeRestrictionModal}
        onClose={handleAgeRestrictionClose}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  backgroundImage: { flex: 1, width: width, height: height },
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
  kakaoIcon: { fontSize: 20, marginRight: 12 },
  kakaoButtonText: {
    color: '#381E1E',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default KakaoLoginScreen;
