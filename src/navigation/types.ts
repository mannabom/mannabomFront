// src/navigation/types.ts
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Gender } from '../types/KakaoAPI';
import { DrinkingHabit, MatchSource, SmokingHabit } from '../types/DatingAPI';

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
    startIndex?: number;
    ratedByProfileId?: Record<number, number>;
    lockedRatedProfileIds?: number[];
    isVip: boolean;
    isSubscribed: boolean;
    tingBalance: number;
    eventTingBalance: number;
    freeProfileNum?: number;
    additionalProfileNum?: number;
    minAge?: number;
    maxAge?: number;
    smoking?: SmokingHabit[];
    drinking?: DrinkingHabit[];
    noCards?: boolean;
  };
  LoveCodePreview: {
    nickname?: string;
    intro?: string;
    want?: string;
    charm?: string;
    loveCards?: Array<{
      profileId: number;
      nickname: string;
      requiredQA: Array<{ question: string; answer: string }>;
      openQA: Array<{ question: string; answer: string }>;
      choiceQA: Array<{
        id: string;
        title: string;
        left: string;
        right: string;
        selected: 'LEFT' | 'RIGHT' | null;
      }>;
    }>;
    startIndex?: number;
    openQA?: Array<{
      question: string;
      answer: string;
    }>;
    choiceQA?: Array<{
      id: string;
      title: string;
      left: string;
      right: string;
      selected: 'LEFT' | 'RIGHT' | null;
    }>;
    isVip: boolean;
    isSubscribed: boolean;
    tingBalance: number;
    eventTingBalance: number;
    freeProfileNum?: number;
    freeLoveViewNum?: number;
    additionalProfileNum?: number;
    page?: number;
    total?: number;
  };

  MatchDetail: {
    source: MatchSource;
    targetProfileId: number;
    previewName?: string;
    previewImageUrl?: string;
    fromInterestTab?: 'received' | 'sent';
    interestEntryKind?: 'LIKE' | 'MESSAGE' | 'HIGH_SCORE';
    initialLikedSent?: boolean;
    initialMessagedSent?: boolean;
    initialSentMessage?: string;
    initialSentGiftName?: string;
  };
  InterestDetail: {
    tab: 'received' | 'sent';
    kind: 'LIKE' | 'MESSAGE' | 'HIGH_SCORE';
    sourceId: number;
    profileId: number;
    nickname: string;
    imageUrl?: string;
    isLoveView?: boolean;
    message?: string;
    hasGift?: boolean;
    giftName?: string;
    staySeconds?: number;
    receivedScore?: number;
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
