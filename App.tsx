import React, { useState } from 'react';
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
import TermsDetailScreen from './src/screens/login/TermsDetailScreen';
import CongratulationsScreen from './src/screens/login/CongratulationsScreen';
import HomeScreen from './src/screens/home/HomeScreen';
import MyPage from './src/screens/MyPage/MyPage';
import ProfileDetail from './src/screens/MyPage/ProfileDetail';
import { AuthManager } from './src/utils/SecurityUtils';
import { RootStackParamList } from './src/navigation/types';

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
  termType: 'service' | 'privacy' | 'marketing';
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('splash');
  const [termsDetailState, setTermsDetailState] = useState<TermsDetailState>({
    termType: 'service',
  });

  const handleSplashComplete = async () => {
    try {
      const isAutoLoginSuccess = await AuthManager.performAutoLogin();
      setAppState(isAutoLoginSuccess ? 'home' : 'login');
    } catch {
      setAppState('login');
    }
  };

  const handleLogout = async () => {
    await AuthManager.logout();
    setAppState('login');
  };

  const handleViewTermsDetail = (
    termType: 'service' | 'privacy' | 'marketing',
  ) => {
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
      <Stack.Navigator
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
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
            <Stack.Screen name="Home">
              {props => <HomeScreen {...props} onLogout={handleLogout} />}
            </Stack.Screen>
            <Stack.Screen name="MyPage" component={MyPage} />
            <Stack.Screen name="ProfileDetail" component={ProfileDetail} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
