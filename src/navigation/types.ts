// src/navigation/types.ts
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

  PhotoUpload: undefined;
  TermsAgreement: undefined;
  TermsDetail: { termType: 'service' | 'privacy' | 'marketing' };
  Congratulations: undefined;

  // ✅ 홈 이후
  MainTabs: undefined;

  // ✅ 탭 위로 띄우는 상세(스택)
  ProfileDetail: undefined;
  ProfilePreview: {
    profiles: Array<{
      profileId: number;
      nickname: string;
      name?: string;
      age: number;
      mbti?: string;
      photoUris?: string[];
    }>;
    isVip: boolean;
    isSubscribed: boolean;
    tingBalance: number;
    eventTingBalance: number;
    noCards?: boolean;
  };
  LoveCodePreview: {
    nickname?: string;
    intro?: string;
    want?: string;
    charm?: string;
    isVip: boolean;
    isSubscribed: boolean;
    tingBalance: number;
    eventTingBalance: number;
    page?: number;
    total?: number;
  };

  // ✅ 스토어 (간단 화면)
  Store: undefined;
};

export type RootNavigationProp<T extends keyof RootStackParamList> =
  StackNavigationProp<RootStackParamList, T>;

export type RootRouteProp<T extends keyof RootStackParamList> = RouteProp<
  RootStackParamList,
  T
>;
