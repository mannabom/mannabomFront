// App.tsx
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from './src/components/SplashScreen';
import KakaoLoginScreen from './src/screens/KakaoLoginScreen';
import EmailVerificationScreen from './src/screens/EmailVerificationScreen';
import NicknameScreen from './src/screens/NicknameScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import SelfIntroductionScreen from './src/screens/SelfIntroductionScreen';
import DatingQuestionsScreen from './src/screens/DatingQuestionsScreen';
import PersonalityTestScreen from './src/screens/PersonalityTestScreen';
import HomeScreen from './src/screens/HomeScreen';
import { AuthManager } from './src/utils/SecurityUtils';

const Stack = createNativeStackNavigator();

type AppState =
  | 'splash'
  | 'login'
  | 'emailVerification'
  | 'nickname'
  | 'profileSetup'
  | 'selfIntroduction'
  | 'datingQuestions'
  | 'personalityTest'
  | 'home';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('splash');

  const handleSplashComplete = async () => {
    try {
      // 로그인 정보 확인 및 자동 로그인 처리
      const isAutoLoginSuccess = await AuthManager.performAutoLogin();

      if (isAutoLoginSuccess) {
        setAppState('home');
      } else {
        setAppState('login');
      }
    } catch (error) {
      console.error('로그인 상태 확인 오류:', error);
      setAppState('login');
    }
  };

  const handleKakaoLoginSuccess = (userData?: any) => {
    // 기존 회원의 경우 - 토큰 저장 후 홈 화면으로
    if (userData?.accessToken) {
      // AuthManager에 토큰 저장
      console.log('기존 회원 로그인:', userData);
      setAppState('home');
    }
  };

  const handleSignupRequired = (kakaoUserInfo: any) => {
    // 신규 사용자의 경우 - 회원가입 프로세스 시작
    console.log('신규 사용자 회원가입 시작:', kakaoUserInfo);
    // 카카오 정보를 전역 상태나 AsyncStorage에 저장
    setAppState('emailVerification');
  };

  const handleEmailVerificationComplete = () => {
    setAppState('nickname');
  };

  const handleNicknameComplete = () => {
    setAppState('profileSetup');
  };

  const handleProfileComplete = () => {
    setAppState('selfIntroduction');
  };

  const handleIntroductionComplete = () => {
    setAppState('datingQuestions');
  };

  const handleQuestionsComplete = () => {
    setAppState('personalityTest');
  };

  const handleTestComplete = () => {
    // 모든 회원가입 과정 완료
    setAppState('home');
  };

  const handleLogout = async () => {
    await AuthManager.logout();
    setAppState('login');
  };

  if (appState === 'splash') {
    return <SplashScreen onSplashComplete={handleSplashComplete} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {appState === 'login' && (
          <Stack.Screen name="KakaoLogin">
            {props => (
              <KakaoLoginScreen
                {...props}
                onLoginSuccess={handleKakaoLoginSuccess}
                onSignupRequired={handleSignupRequired}
              />
            )}
          </Stack.Screen>
        )}

        {appState === 'emailVerification' && (
          <Stack.Screen name="EmailVerification">
            {props => (
              <EmailVerificationScreen
                {...props}
                onVerificationComplete={handleEmailVerificationComplete}
              />
            )}
          </Stack.Screen>
        )}

        {appState === 'nickname' && (
          <Stack.Screen name="Nickname">
            {props => (
              <NicknameScreen
                {...props}
                onNicknameComplete={handleNicknameComplete}
              />
            )}
          </Stack.Screen>
        )}

        {appState === 'profileSetup' && (
          <Stack.Screen name="ProfileSetup">
            {props => (
              <ProfileSetupScreen
                {...props}
                onProfileComplete={handleProfileComplete}
              />
            )}
          </Stack.Screen>
        )}

        {appState === 'selfIntroduction' && (
          <Stack.Screen name="SelfIntroduction">
            {props => (
              <SelfIntroductionScreen
                {...props}
                onIntroductionComplete={handleIntroductionComplete}
              />
            )}
          </Stack.Screen>
        )}

        {appState === 'datingQuestions' && (
          <Stack.Screen name="DatingQuestions">
            {props => (
              <DatingQuestionsScreen
                {...props}
                onQuestionsComplete={handleQuestionsComplete}
              />
            )}
          </Stack.Screen>
        )}

        {appState === 'personalityTest' && (
          <Stack.Screen name="PersonalityTest">
            {props => (
              <PersonalityTestScreen
                {...props}
                onTestComplete={handleTestComplete}
              />
            )}
          </Stack.Screen>
        )}

        {appState === 'home' && (
          <Stack.Screen name="Home">
            {props => <HomeScreen {...props} onLogout={handleLogout} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
