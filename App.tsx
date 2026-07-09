// App.tsx
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from './src/components/login/SplashScreen';
import KakaoLoginScreen from './src/screens/login/KakaoLoginScreen';
import EmailVerificationScreen from './src/screens/login/EmailVerificationScreen';
import NicknameScreen from './src/screens/login/NicknameScreen';
import ProfileSetupScreen from './src/screens/login/ProfileSetupScreen';
import SelfIntroductionScreen from './src/screens/login/SelfIntroductionScreen';
import DatingQuestionsScreen from './src/screens/login/DatingQuestionsScreen';
import PersonalityTestScreen from './src/screens/login/PersonalityTestScreen';
import PhotoUploadScreen from './src/screens/login/PhotoUploadScreen';
import TermsAgreementScreen from './src/screens/login/TermsAgreementScreen';
import type { SignupTermType } from './src/screens/login/TermsAgreementScreen';
import TermsDetailScreen from './src/screens/login/TermsDetailScreen';
import CongratulationsScreen from './src/screens/login/CongratulationsScreen';

import ProfileDetail from './src/screens/MyPage/ProfileDetail';
import StoreScreen from './src/screens/store/StoreScreen'; // ✅ 추가
import ProfilePreviewScreen from './src/screens/home/ProfilePreviewScreen';
import LoveCodePreviewScreen from './src/screens/home/LoveCodePreviewScreen';
import MatchDetailScreen from './src/screens/home/MatchDetailScreen';
import InterestDetailScreen from './src/screens/interest/InterestDetailScreen';
import MeetingTeamChatScreen from './src/screens/chat/MeetingTeamChatScreen';
import MeetingGeneralChatScreen from './src/screens/chat/MeetingGeneralChatScreen';
import DatingChatRoomScreen from './src/screens/chat/DatingChatRoomScreen';
import ChatProfileDetailScreen from './src/screens/chat/ChatProfileDetailScreen';

import { AuthManager } from './src/utils/SecurityUtils';
import { RootStackParamList } from './src/navigation/types';

import MainTabNavigator from './src/navigation/MainTabNavigator';

// ✅ FCM 토큰 등록 + 포그라운드 알림 리스너
import {
  registerFcmTokenToServer,
  startForegroundNotificationListener,
  startTokenRefreshListener,
  stopPushListeners,
} from './src/services/PushTokenService';

import { debugPushStatus } from './src/services/PushTokenService';

const Stack = createNativeStackNavigator<RootStackParamList>();

type AppState =
  | 'splash'
  | 'login'
  | 'emailVerification'
  | 'nickname'
  | 'profileSetup'
  | 'selfIntroduction'
  | 'datingQuestions'
  | 'personalityTest'
  | 'photoUpload'
  | 'termsAgreement'
  | 'termsDetail'
  | 'congratulations'
  | 'home';

interface TermsDetailState {
  termType: SignupTermType;
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('splash');
  const [termsDetailState, setTermsDetailState] = useState<TermsDetailState>({
    termType: 'privacy',
  });

  // ✅ 앱 켜질 때 1번만: 포그라운드에서도 상태바 알림 뜨게
  useEffect(() => {
    if (__DEV__) {
      debugPushStatus();
    }
    startForegroundNotificationListener();
  }, []);

  // ✅ 핵심: home 진입(=로그인 완료)할 때마다 토큰 등록 + 갱신 리스너 시작
  useEffect(() => {
    if (appState !== 'home') return;

    let cancelled = false;

    (async () => {
      try {
        const token = await registerFcmTokenToServer({ force: true });
        if (cancelled) return;

        if (token) {
          startTokenRefreshListener();
        } else {
          console.warn('⚠️ [App] FCM token is null (permission/FCM issue?)');
        }
      } catch (e) {
        console.warn('⚠️ [App] registerFcmTokenToServer failed (ignored):', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [appState]);

  const handleSplashComplete = async () => {
    try {
      const isAutoLoginSuccess = await AuthManager.performAutoLogin();
      setAppState(isAutoLoginSuccess ? 'home' : 'login');
    } catch {
      setAppState('login');
    }
  };

  const handleLogout = async () => {
    stopPushListeners();
    await AuthManager.logout();
    setAppState('login');
  };

  const handleViewTermsDetail = (termType: SignupTermType) => {
    setTermsDetailState({ termType });
    setAppState('termsDetail');
  };

  const handleCloseTermsDetail = () => {
    setAppState('termsAgreement');
  };

  if (appState === 'splash') {
    return <SplashScreen onSplashComplete={handleSplashComplete} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {appState === 'login' && (
          <Stack.Screen name="KakaoLogin">
            {props => (
              <KakaoLoginScreen
                {...props}
                onLoginSuccess={() => setAppState('home')}
                onSignupRequired={() => setAppState('emailVerification')}
              />
            )}
          </Stack.Screen>
        )}

        {appState === 'emailVerification' && (
          <Stack.Screen name="EmailVerification">
            {props => (
              <EmailVerificationScreen
                {...props}
                onVerificationComplete={() => setAppState('nickname')}
              />
            )}
          </Stack.Screen>
        )}

        {appState === 'nickname' && (
          <Stack.Screen name="Nickname">
            {props => (
              <NicknameScreen
                {...props}
                onNicknameComplete={() => setAppState('profileSetup')}
              />
            )}
          </Stack.Screen>
        )}

        {appState === 'profileSetup' && (
          <Stack.Screen name="ProfileSetup">
            {props => (
              <ProfileSetupScreen
                {...props}
                onProfileComplete={() => setAppState('selfIntroduction')}
              />
            )}
          </Stack.Screen>
        )}

        {appState === 'selfIntroduction' && (
          <Stack.Screen name="SelfIntroduction">
            {props => (
              <SelfIntroductionScreen
                {...props}
                onIntroductionComplete={() => setAppState('datingQuestions')}
              />
            )}
          </Stack.Screen>
        )}

        {appState === 'datingQuestions' && (
          <Stack.Screen name="DatingQuestions">
            {props => (
              <DatingQuestionsScreen
                {...props}
                onQuestionsComplete={() => setAppState('personalityTest')}
              />
            )}
          </Stack.Screen>
        )}

        {appState === 'personalityTest' && (
          <Stack.Screen name="PersonalityTest">
            {props => (
              <PersonalityTestScreen
                {...props}
                onTestComplete={() => setAppState('photoUpload')}
              />
            )}
          </Stack.Screen>
        )}

        {appState === 'photoUpload' && (
          <Stack.Screen name="PhotoUpload">
            {props => (
              <PhotoUploadScreen
                {...props}
                onUploadComplete={() => setAppState('termsAgreement')}
              />
            )}
          </Stack.Screen>
        )}

        {appState === 'termsAgreement' && (
          <Stack.Screen name="TermsAgreement">
            {props => (
              <TermsAgreementScreen
                {...props}
                onAgreementComplete={() => setAppState('congratulations')}
                onViewTermsDetail={handleViewTermsDetail}
                onCancel={() => setAppState('photoUpload')}
              />
            )}
          </Stack.Screen>
        )}

        {appState === 'termsDetail' && (
          <Stack.Screen name="TermsDetail">
            {props => (
              <TermsDetailScreen
                {...props}
                termType={termsDetailState.termType}
                onClose={handleCloseTermsDetail}
              />
            )}
          </Stack.Screen>
        )}

        {appState === 'congratulations' && (
          <Stack.Screen name="Congratulations">
            {props => (
              <CongratulationsScreen
                {...props}
                onComplete={() => setAppState('home')}
              />
            )}
          </Stack.Screen>
        )}

        {appState === 'home' && (
          <>
            <Stack.Screen name="MainTabs">
              {() => <MainTabNavigator onLogout={handleLogout} />}
            </Stack.Screen>

            <Stack.Screen name="ProfileDetail" component={ProfileDetail} />
            <Stack.Screen name="ProfilePreview" component={ProfilePreviewScreen} />
            <Stack.Screen name="LoveCodePreview" component={LoveCodePreviewScreen} />
            <Stack.Screen name="MatchDetail" component={MatchDetailScreen} />
            <Stack.Screen name="InterestDetail" component={InterestDetailScreen} />
            <Stack.Screen name="MeetingTeamChat" component={MeetingTeamChatScreen} />
            <Stack.Screen name="MeetingGeneralChat" component={MeetingGeneralChatScreen} />
            <Stack.Screen name="ProfileChat" component={DatingChatRoomScreen} />
            <Stack.Screen name="LoveviewChat" component={DatingChatRoomScreen} />
            <Stack.Screen name="ChatProfileDetail" component={ChatProfileDetailScreen} />

            {/* ✅ 스토어 */}
            <Stack.Screen name="Store" component={StoreScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
