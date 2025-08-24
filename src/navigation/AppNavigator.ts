// src/navigation/AppNavigator.ts
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Gender } from '../types/KakaoAPI';

// 앱 내 모든 스크린의 목록과 각 스크린이 받을 수 있는 파라미터를 정의합니다.
// 'undefined'는 파라미터가 없음을 의미합니다.
export type RootStackParamList = {
  SplashScreen: undefined;
  KakaoLogin: undefined;
  EmailVerification: undefined;
  Nickname: undefined;
  ProfileSetup: { kakaoUserInfo: { gender: Gender } }; // ProfileSetup에 필요한 파라미터 정의
  SelfIntroduction: undefined;
  DatingQuestions: undefined;
  PersonalityTest: undefined;
  Home: undefined;
};

// 스크린의 네비게이션 Props 타입을 쉽게 사용하기 위해 정의합니다.
export type RootNavigationProp<T extends keyof RootStackParamList> =
  StackNavigationProp<RootStackParamList, T>;

// 스크린의 라우트 Props 타입을 정의합니다.
export type RootRouteProp<T extends keyof RootStackParamList> = RouteProp<
  RootStackParamList,
  T
>;
