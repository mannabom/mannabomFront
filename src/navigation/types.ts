import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Gender } from '../types/KakaoAPI';

export type RootStackParamList = {
  SplashScreen: undefined;
  KakaoLogin: undefined;
  EmailVerification: undefined;
  Nickname: undefined;
  ProfileSetup: { kakaoUserInfo: { gender: Gender } };
  SelfIntroduction: undefined;
  DatingQuestions: undefined;
  PersonalityTest: undefined;
  Home: undefined;
  MyPage: undefined;
  ProfileDetail: undefined;
};

// 네비게이션 Prop 타입
export type RootNavigationProp<T extends keyof RootStackParamList> =
  StackNavigationProp<RootStackParamList, T>;

// 라우트 Prop 타입
export type RootRouteProp<T extends keyof RootStackParamList> = RouteProp<
  RootStackParamList,
  T
>;
