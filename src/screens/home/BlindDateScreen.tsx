// src/screens/BlindDate/BlindDateScreen.tsx
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  ImageBackground,
  Image,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import FilterModal from '../../components/common/FilterModal';

import {
  CheckTingWalletResponse,
  FilterSettings,
  LoveViewMatchConditionRequest,
  ProfileMatchConditionRequest,
} from '../../types/DatingAPI';
import { defaultFilterSettings } from '../../utils/DatingUtils';
import { datingApiService } from '../../services/DatingApiService';
import apiClient from '../../services/apiClient';
import { API_BASE_URL, API_ENDPOINTS_LIST } from '../../config/api';
import { getProfilePreviewState } from '../../utils/ProfilePreviewStore';
const petalImg = require('../../assets/images/petal.png');
const vipBadgeImg = require('../../assets/images/VIP.png');
const subBadgeImg = require('../../assets/images/SUB.png');
const tingIconImg = require('../../assets/images/Ting.png');
const eventTingIconImg = require('../../assets/images/Eventting.png');
const filterImg = require('../../assets/images/Filter.png');

interface BlindDateScreenProps {
  onLogout: () => void;
}

type BlindProfileCard = {
  profileId: number;
  name?: string;
  nickname: string;
  age: number;
  mbti: string;
  photoUris: string[];
  mainPhotoUrl: string;
};

type BlindLoveCodeCard = {
  profileId: number;
  nickname: string;
  mbti: string;
  requiredQA: { question: string; answer: string }[];
  openQA: { question: string; answer: string }[];
  choiceQA: {
    id: string;
    title: string;
    left: string;
    right: string;
    selected: 'LEFT' | 'RIGHT' | null;
  }[];
};
type PreviewModalProfile = {
  profileId: number;
  name?: string;
  nickname: string;
  age: number;
  mbti: string;
  photoUris: string[];
};

const firstNonEmptyString = (...vals: any[]): string | undefined => {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim().length > 0) return v;
  }
  return undefined;
};
const toAbsoluteUri = (uri: string | undefined): string => {
  const s = (uri ?? '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('/')) return `${API_BASE_URL}${s}`;
  return `${API_BASE_URL}/${s}`;
};
const extractPhotoUris = (raw: any): string[] => {
  const candidates: string[] = [];
  const push = (v: any) => {
    if (typeof v === 'string' && v.trim()) candidates.push(toAbsoluteUri(v));
  };
  push(raw?.profileImageUrl);
  push(raw?.profileImage);
  push(raw?.imageUrl);
  push(raw?.mainPhotoUrl);
  if (Array.isArray(raw?.photoUris)) raw.photoUris.forEach(push);
  if (Array.isArray(raw?.profilePhotoUrls)) raw.profilePhotoUrls.forEach(push);
  if (Array.isArray(raw?.photos)) {
    raw.photos.forEach((p: any) => {
      push(p?.url);
      push(p?.photoUrl);
      push(p?.imageUrl);
    });
  }
  return Array.from(new Set(candidates.filter(Boolean)));
};

const toPositiveId = (...vals: any[]): number | undefined => {
  for (const v of vals) {
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) return v;
    if (typeof v === 'string' && v.trim().length > 0) {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) return n;
    }
  }
  return undefined;
};

const firstProfileCandidate = (raw: any): any => {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  if (Array.isArray(raw?.profiles)) return raw.profiles[0] ?? null;
  if (Array.isArray(raw?.profileList)) return raw.profileList[0] ?? null;
  if (Array.isArray(raw?.matches)) return raw.matches[0] ?? null;
  return raw?.profile ?? raw?.matchProfile ?? raw;
};

const firstLoveCandidate = (raw: any): any => {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  if (Array.isArray(raw?.loveViews)) return raw.loveViews[0] ?? null;
  if (Array.isArray(raw?.loveViewList)) return raw.loveViewList[0] ?? null;
  if (Array.isArray(raw?.matches)) return raw.matches[0] ?? null;
  return raw?.loveView ?? raw?.matchLoveView ?? raw;
};

const normalizeQuestionKey = (value: string | undefined): string =>
  String(value ?? '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '');

const CHOICE_QUESTIONS = [
  { id: 'fight', title: '연인과 싸웠을 때', left: '바로 풀고 싶다', right: '시간을 좀 가지고 싶다' },
  { id: 'photo', title: '연인과 함께한 사진', left: 'SNS에 공유해도 된다', right: 'SNS에 공유하기 싫다' },
  { id: 'important', title: '연애에서 더 중요한 것은', left: '편안함', right: '설렘' },
  { id: 'date', title: '연인과의 데이트에서', left: '실내에서 데이트하기', right: '실외에서 데이트하기' },
  { id: 'jealousy', title: '연애에서 적당한 질투가', left: '있어야 재미있다', right: '쿨한 게 편하다' },
  { id: 'idealDay', title: '연인과의 이상적인 하루는', left: '편한 일상 즐기기', right: '새로운 경험 해보기' },
  { id: 'attracted', title: '연인에게 주로 끌리는 모습은', left: '배려심 넘치는 모습', right: '주도적인 모습' },
  { id: 'friends', title: '연인이 내 친구들과', left: '어울리며 놀기', right: '따로 놀기' },
] as const;

const CHOICE_QUESTION_ID_BY_KEY: Record<string, number> = {
  fight: 8,
  photo: 9,
  important: 10,
  date: 11,
  jealousy: 12,
  idealDay: 13,
  attracted: 14,
  friends: 15,
};

const CHOICE_CODE_TO_SIDE: Record<string, 'LEFT' | 'RIGHT'> = {
  IMMEDIATE_RESOLVE: 'LEFT',
  CALM_AFTER_TIME: 'RIGHT',
  SOLVE_IMMEDIATELY: 'LEFT',
  TAKE_TIME: 'RIGHT',
  SNS_SHARE_OK: 'LEFT',
  SNS_SHARE_YES: 'LEFT',
  SNS_SHARE_NO: 'RIGHT',
  PRIVATE_MEMORY: 'RIGHT',
  COMFORT: 'LEFT',
  EXCITEMENT: 'RIGHT',
  THRILL: 'RIGHT',
  INDOOR: 'LEFT',
  INDOOR_DATE: 'LEFT',
  OUTDOOR: 'RIGHT',
  OUTDOOR_DATE: 'RIGHT',
  MODERATE_JEALOUSY: 'LEFT',
  SLIGHT_JEALOUSY_OK: 'LEFT',
  COOL_AND_CALM: 'RIGHT',
  COOL_ATTITUDE: 'RIGHT',
  COMFORTABLE_DAILY: 'LEFT',
  COMFY_DAILY: 'LEFT',
  NEW_EXPERIENCE: 'RIGHT',
  ACTIVE_DATE: 'RIGHT',
  CONSIDERATION: 'LEFT',
  CONSIDERATE: 'LEFT',
  STRONG_OPINION: 'RIGHT',
  LEADERSHIP: 'RIGHT',
  MIX_WELL: 'LEFT',
  MIX_WITH_FRIENDS: 'LEFT',
  SEPARATE_CIRCLE: 'RIGHT',
  KEEP_DISTANCE: 'RIGHT',
};

const normalizeChoiceCode = (value: string | undefined): string =>
  String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

const getChoiceSideByCode = (answer: string | undefined): 'LEFT' | 'RIGHT' | undefined =>
  CHOICE_CODE_TO_SIDE[normalizeChoiceCode(answer)];

const isNoFreeTicketError = (e: any) => {
  const status = e?.response?.status;
  const msg = String(e?.response?.data?.message ?? '');
  return status === 400 && msg.includes('무료권') && msg.includes('부족');
};

const isNoProfileQuotaError = (e: any) => {
  const status = e?.response?.status;
  const msg = String(e?.response?.data?.message ?? '');
  if (status !== 400) return false;
  return (
    (msg.includes('무료권') && msg.includes('부족')) ||
    (msg.includes('추가 프로필') && msg.includes('혜택권') && msg.includes('없'))
  );
};

const isNetworkError = (e: any) => {
  const hasResponse = !!e?.response;
  const msg = String(e?.message ?? '');
  return !hasResponse && msg.toLowerCase().includes('network');
};

const withNetworkRetry = async <T,>(fn: () => Promise<T>, retries = 2): Promise<T> => {
  let lastError: any;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (e: any) {
      lastError = e;
      if (!isNetworkError(e) || i === retries) break;
    }
  }
  throw lastError;
};

const BlindDateScreen: React.FC<BlindDateScreenProps> = () => {
  const navigation = useNavigation<any>();
  const [filterSettings, setFilterSettings] = useState<FilterSettings>(defaultFilterSettings);

  const [previewProfile, setPreviewProfile] = useState<BlindProfileCard | null>(null);
  const [previewLoveCode, setPreviewLoveCode] = useState<BlindLoveCodeCard | null>(null);
  const [profileCards, setProfileCards] = useState<BlindProfileCard[]>([]);
  const [loveCodeCards, setLoveCodeCards] = useState<BlindLoveCodeCard[]>([]);

  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // ✅ 재화/카운트
  const [tingBalance, setTingBalance] = useState<number>(0);
  const [coinBalance, setCoinBalance] = useState<number>(0);
  const [walletInfo, setWalletInfo] = useState<CheckTingWalletResponse>({
    freeLikeNum: 0,
    freeMessageNum: 0,
    eventTingNum: 0,
    tingNum: 0,
    freeProfileNum: 0,
    freeLoveViewNum: 0,
    additionalProfileNum: 0,
  });
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const isVip = tingBalance >= 200;

  const refreshWalletInfo = useCallback(async (): Promise<CheckTingWalletResponse | null> => {
    try {
      const wallet = await datingApiService.getTingWalletInfo();
      setWalletInfo(wallet);
      setTingBalance(wallet.tingNum ?? 0);
      setCoinBalance(wallet.eventTingNum ?? 0);
      return wallet;
    } catch (e) {
      console.warn('Failed to load ting wallet info', e);
      return null;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshWalletInfo();
      const saved = getProfilePreviewState();
      if (saved?.profiles?.length) {
        const safeIdx = Math.max(0, Math.min(saved.index ?? 0, saved.profiles.length - 1));
        const current = saved.profiles[safeIdx];
        if (current?.profileId) {
          setPreviewProfile({
            profileId: current.profileId,
            name: current.name,
            nickname: current.nickname,
            age: current.age,
            mbti: current.mbti ?? '',
            photoUris: current.photoUris?.length ? current.photoUris : [''],
            mainPhotoUrl: current.photoUris?.[0] ?? '',
          });
        }
      }
      return undefined;
    }, [refreshWalletInfo]),
  );

  React.useEffect(() => {
    let mounted = true;
    const loadWallet = async () => {
      try {
        const wallet = await datingApiService.getTingWalletInfo();
        if (!mounted) return;
        setWalletInfo(wallet);
        setTingBalance(wallet.tingNum ?? 0);
        setCoinBalance(wallet.eventTingNum ?? 0);
      } catch (e) {
        console.warn('Failed to load ting wallet info', e);
      }
    };
    loadWallet();
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    let mounted = true;
    const loadSubscription = async () => {
      try {
        const profileRes = await apiClient.get(API_ENDPOINTS_LIST.USER_PROFILE);
        const profileData: any = profileRes.data?.data ?? profileRes.data;
        const profileSub = Boolean(
          profileData?.isSubscribed ??
            profileData?.subscribed ??
            profileData?.profile?.isSubscribed ??
            profileData?.profile?.subscribed ??
            false,
        );

        if (!mounted) return;
        setIsSubscribed(profileSub);
      } catch (e) {
        if (!mounted) return;
        setIsSubscribed(false);
        console.warn('Failed to load subscription status', e);
      }
    };

    loadSubscription();
    return () => {
      mounted = false;
    };
  }, []);
  const parseLoveCodeCard = useCallback((raw: any): BlindLoveCodeCard | null => {
    const loveViewRes: any = firstLoveCandidate(raw);
    if (!loveViewRes) return null;

    const loveProfileId = toPositiveId(
      loveViewRes?.profileId,
      loveViewRes?.userId,
      loveViewRes?.id,
    );
    if (!loveProfileId) return null;

    const questionAnswers = Array.isArray(loveViewRes?.questionAnswers) ? loveViewRes.questionAnswers : [];
    const qaMap = new Map<string, string>();
    const qaById = new Map<number, string>();

    questionAnswers.forEach((item: any) => {
      const answer = String(item?.answer ?? '').trim();
      if (!answer) return;

      const qObj = item?.question;
      const questionText =
        typeof qObj === 'string'
          ? qObj
          : firstNonEmptyString(qObj?.question, qObj?.title, qObj?.content, item?.questionText);
      const questionIdRaw =
        typeof qObj === 'object' ? (qObj?.questionId ?? qObj?.id) : item?.questionId;
      const questionId = Number(questionIdRaw);

      if (questionText) {
        qaMap.set(normalizeQuestionKey(questionText), answer);
      }
      if (Number.isFinite(questionId) && questionId > 0) {
        qaById.set(questionId, answer);
      }
    });

    const findAnswer = (
      questionCandidates: string[],
      fieldCandidates: any[] = [],
      questionIds: number[] = [],
    ): string => {
      for (const id of questionIds) {
        const foundById = qaById.get(id);
        if (foundById) return foundById;
      }
      for (const q of questionCandidates) {
        const found = qaMap.get(normalizeQuestionKey(q));
        if (found) return found;
      }
      const byField = firstNonEmptyString(...fieldCandidates);
      return byField ?? '';
    };

    const introText =
      findAnswer(
        ['자기소개'],
        [loveViewRes?.intro, loveViewRes?.selfIntroduction, loveViewRes?.description, loveViewRes?.bio],
        [1],
      ) || '자기소개가 아직 등록되지 않았어요.';
    const wantText =
      findAnswer(
        ['연인에게 꼭 바라는 한 가지는?', '연인에게 바라는 한 가지는?', '연인에게 바라는 한 가지'],
        [loveViewRes?.want, loveViewRes?.desiredPartnerTrait, loveViewRes?.requiredAnswer1],
        [3],
      ) || '연인에게 바라는 한 가지 응답이 없어요.';
    const charmText =
      findAnswer(
        ['나를 설레게 하는 이성의 매력?', '나를 설레게 하는 이성의 매력'],
        [loveViewRes?.charm, loveViewRes?.attractivePartnerTrait, loveViewRes?.requiredAnswer2],
        [2],
      ) || '매력 응답이 아직 없어요.';

    const openQA = [
      {
        question: '나에게 연애란 어떤 의미인가요?',
        answer:
          findAnswer(['나에게 연애란?', '나에게 연애란 어떤 의미인가요?', '나에게 연애란'], [], [4]) ||
          firstNonEmptyString(loveViewRes?.meaningOfLove) ||
          '아직 작성된 답변이 없어요.',
      },
      {
        question: '나의 소울 푸드?',
        answer:
          findAnswer(['나의 소울 푸드는?', '나의 소울 푸드?'], [], [5]) ||
          firstNonEmptyString(loveViewRes?.soulFood) ||
          '아직 작성된 답변이 없어요.',
      },
      {
        question: '나의 하루 그리고 나의 휴일은?',
        answer:
          findAnswer(['나의 하루, 그리고 나의 휴일은?', '나의 하루 그리고 나의 휴일은?'], [], [6]) ||
          firstNonEmptyString(loveViewRes?.dailyAndHoliday) ||
          '아직 작성된 답변이 없어요.',
      },
      {
        question: '하고 싶은 데이트는?',
        answer:
          findAnswer(['하고 싶은 데이트는?'], [], [7]) ||
          firstNonEmptyString(loveViewRes?.idealDate) ||
          '아직 작성된 답변이 없어요.',
      },
    ];

    const choiceQA = CHOICE_QUESTIONS.map(q => {
      const choiceQuestionId = CHOICE_QUESTION_ID_BY_KEY[q.id];
      const answer =
        findAnswer([q.title, `${q.title}?`], [loveViewRes?.[q.id]], [choiceQuestionId]) || '';
      const normalizedAnswer = normalizeQuestionKey(answer);
      const leftKey = normalizeQuestionKey(q.left);
      const rightKey = normalizeQuestionKey(q.right);
      const selectedByCode = getChoiceSideByCode(answer);
      const selected: 'LEFT' | 'RIGHT' | null =
        selectedByCode ??
        (normalizedAnswer && normalizedAnswer === leftKey
          ? 'LEFT'
          : normalizedAnswer && normalizedAnswer === rightKey
            ? 'RIGHT'
            : null);

      return {
        ...q,
        selected,
      };
    });

    return {
      profileId: loveProfileId,
      nickname:
        firstNonEmptyString(
          loveViewRes?.name,
          loveViewRes?.nickname,
          loveViewRes?.nickName,
        ) ?? '회원',
      mbti: String(loveViewRes?.mbti ?? ''),
      requiredQA: [
        { question: '자기소개', answer: introText },
        { question: '연인에게 바라는 한 가지는?', answer: wantText },
        { question: '나를 설레게 하는 이성의 매력?', answer: charmText },
      ],
      openQA,
      choiceQA,
    };
  }, []);

  const fetchProfilePreview = useCallback(async (): Promise<BlindProfileCard | null> => {
    const profileCondition: ProfileMatchConditionRequest = {
      minAge: filterSettings.ageRange.min,
      maxAge: filterSettings.ageRange.max,
      smoking: filterSettings.smoking,
      drinking: filterSettings.drinking,
    };
    let profileRaw: any;
    try {
      profileRaw = await withNetworkRetry(
        () => datingApiService.getMatchingProfile(profileCondition),
        2,
      );
    } catch (e: any) {
      if (isNoFreeTicketError(e)) {
        profileRaw = await withNetworkRetry(
          () => datingApiService.getMatchingProfileExtra(profileCondition),
          2,
        );
      } else {
        throw e;
      }
    }
    const profileRes: any = firstProfileCandidate(profileRaw);
    const profileId = toPositiveId(
      profileRes?.profileId,
      profileRes?.userId,
      profileRes?.id,
    );
    if (!profileRes || !profileId) return null;

    const photoUris = extractPhotoUris(profileRes);
    const nextWallet = await refreshWalletInfo();
    if (__DEV__ && nextWallet) {
      console.log('프로필 간편 제공 후 서버 잔여권:', {
        freeProfileNum: nextWallet.freeProfileNum,
        additionalProfileNum: nextWallet.additionalProfileNum,
      });
    }

    return {
      profileId,
      name: firstNonEmptyString(profileRes?.name),
      nickname:
        firstNonEmptyString(profileRes?.nickname, profileRes?.nickName, profileRes?.name) ??
        '회원',
      age: Number(profileRes?.age ?? 0),
      mbti: String(profileRes?.mbti ?? ''),
      photoUris,
      mainPhotoUrl: photoUris[0] ?? '',
    };
  }, [filterSettings, refreshWalletInfo]);

  const fetchLovePreview = useCallback(async (): Promise<BlindLoveCodeCard | null> => {
    const loveViewCondition: LoveViewMatchConditionRequest = {
      minAge: filterSettings.ageRange.min,
      maxAge: filterSettings.ageRange.max,
      smoking: filterSettings.smoking,
      drinking: filterSettings.drinking,
    };
    let loveRaw: any;
    try {
      loveRaw = await withNetworkRetry(
        () => datingApiService.getLoveViewMatching(loveViewCondition),
        2,
      );
    } catch (e: any) {
      if (isNoFreeTicketError(e)) {
        loveRaw = await withNetworkRetry(
          () => datingApiService.getLoveViewMatchingExtra(loveViewCondition),
          2,
        );
      } else {
        throw e;
      }
    }
    return parseLoveCodeCard(loveRaw);
  }, [filterSettings, parseLoveCodeCard]);

  React.useEffect(() => {
    let mounted = true;

    const loadPreview = async () => {
      const [profileResult, loveViewResult] = await Promise.allSettled([
        fetchProfilePreview(),
        fetchLovePreview(),
      ]);

      if (!mounted) return;

      if (profileResult.status === 'fulfilled') {
        const profileCard = profileResult.value;

        if (__DEV__) {
          console.log('🧪 [BlindDate] profile parsed:', profileCard);
        }
        if (profileCard) {
          setProfileCards([profileCard]);
          setPreviewProfile(profileCard);
        } else {
          setProfileCards([]);
          setPreviewProfile(null);
        }
      } else {
        console.warn('Failed to load profile preview', profileResult.reason);
        setProfileCards([]);
        setPreviewProfile(null);
      }

      if (loveViewResult.status === 'fulfilled') {
        const loveCodeCard = loveViewResult.value;

        if (__DEV__) {
          console.log('🧪 [BlindDate] love parsed:', loveCodeCard);
        }
        if (loveCodeCard) {
          setLoveCodeCards([loveCodeCard]);
          setPreviewLoveCode(loveCodeCard);
        } else {
          setLoveCodeCards([]);
          setPreviewLoveCode(null);
        }
      } else {
        console.warn('Failed to load love code preview', loveViewResult.reason);
        setLoveCodeCards([]);
        setPreviewLoveCode(null);
      }
    };

    loadPreview();
    return () => {
      mounted = false;
    };
  }, [fetchLovePreview, fetchProfilePreview]);

  const handleFilterApply = (newFilters: FilterSettings) => {
    setFilterSettings(newFilters);
    setFilterModalVisible(false);
  };

  const mapProfilesForModal = useMemo(
    (): PreviewModalProfile[] =>
      profileCards.map(p => ({
        profileId: p.profileId,
        name: p.name ?? p.nickname,
        nickname: p.nickname,
        age: p.age,
        mbti: p.mbti,
        photoUris: p.photoUris.length ? p.photoUris : [p.mainPhotoUrl],
      })),
    [profileCards],
  );

  const openProfilePreview = async () => {
    try {
      const saved = getProfilePreviewState();
      let profiles: PreviewModalProfile[] = mapProfilesForModal;
      if (saved?.profiles?.length) {
        profiles = saved.profiles.map(p => ({
          profileId: p.profileId,
          name: p.name ?? p.nickname,
          nickname: p.nickname,
          age: p.age,
          mbti: p.mbti ?? '',
          photoUris: p.photoUris?.length ? p.photoUris : [''],
        }));
      }
      if (!profiles.length && previewProfile) {
        const fallback = [
          {
            profileId: previewProfile.profileId,
            nickname: previewProfile.nickname,
            name: previewProfile.name ?? previewProfile.nickname,
            age: previewProfile.age,
            mbti: previewProfile.mbti,
            photoUris: previewProfile.photoUris.length
              ? previewProfile.photoUris
              : [previewProfile.mainPhotoUrl],
          },
        ];
        profiles = fallback;
      }
      if (!profiles.length) {
        const fresh = await fetchProfilePreview();
        if (!fresh) throw new Error('empty profile');
        setProfileCards([fresh]);
        setPreviewProfile(fresh);
        const fallback = [
          {
            profileId: fresh.profileId,
            name: fresh.name ?? fresh.nickname,
            nickname: fresh.nickname,
            age: fresh.age,
            mbti: fresh.mbti,
            photoUris: fresh.photoUris.length ? fresh.photoUris : [fresh.mainPhotoUrl],
          },
        ];
        profiles = fallback;
      }

      const openParams = {
        profiles,
        startIndex: Math.max(0, Math.min(saved?.index ?? 0, profiles.length)),
        ratedByProfileId: saved?.ratedByProfileId ?? {},
        lockedRatedProfileIds: saved?.lockedRatedProfileIds ?? [],
        isVip,
        isSubscribed,
        tingBalance,
        eventTingBalance: coinBalance,
        freeProfileNum: saved?.freeProfileNum ?? walletInfo.freeProfileNum,
        additionalProfileNum: saved?.additionalProfileNum ?? walletInfo.additionalProfileNum,
        minAge: filterSettings.ageRange.min,
        maxAge: filterSettings.ageRange.max,
        smoking: filterSettings.smoking,
        drinking: filterSettings.drinking,
      };

      if (typeof navigation.push === 'function') {
        navigation.push('ProfilePreview', openParams);
      } else {
        navigation.navigate('ProfilePreview', openParams);
      }
    } catch (e: any) {
      if (isNoProfileQuotaError(e)) {
        const noCardParams = {
          profiles: [],
          isVip,
          isSubscribed,
          tingBalance,
          eventTingBalance: coinBalance,
          freeProfileNum: walletInfo.freeProfileNum,
          additionalProfileNum: walletInfo.additionalProfileNum,
          minAge: filterSettings.ageRange.min,
          maxAge: filterSettings.ageRange.max,
          smoking: filterSettings.smoking,
          drinking: filterSettings.drinking,
          noCards: true,
        };

        if (typeof navigation.push === 'function') {
          navigation.push('ProfilePreview', noCardParams);
        } else {
          navigation.navigate('ProfilePreview', noCardParams);
        }
        return;
      }
      Alert.alert('오류', '일반 소개팅 데이터를 불러오지 못했어요.\n잠시 후 다시 시도해 주세요.');
    }
  };

  const openLoveCodePreview = async () => {
    try {
      let cards = [...loveCodeCards];
      if (!cards.length && previewLoveCode) {
        cards = [previewLoveCode];
      }

      try {
        const todayList = await withNetworkRetry(() => datingApiService.getTodayLoveViewMatching(), 2);
        if (Array.isArray(todayList) && todayList.length) {
          const parsed = todayList
            .map(raw => parseLoveCodeCard(raw))
            .filter((item): item is BlindLoveCodeCard => !!item);
          if (parsed.length) {
            const seen = new Set<number>();
            cards = [...cards, ...parsed].filter(item => {
              if (seen.has(item.profileId)) return false;
              seen.add(item.profileId);
              return true;
            });
            setLoveCodeCards(cards);
            if (!previewLoveCode && cards.length) {
              setPreviewLoveCode(cards[0]);
            }
          }
        }
      } catch (e) {
        console.warn('Failed to load today love cards', e);
      }

      if (!cards.length) {
        const fresh = await fetchLovePreview();
        if (!fresh) throw new Error('empty love');
        cards = [fresh];
        setLoveCodeCards(cards);
        setPreviewLoveCode(fresh);
      }

      const card = cards[0];

      navigation.navigate('LoveCodePreview', {
        nickname: card.nickname,
        mbti: card.mbti,
        intro: card.requiredQA.find(q => q.question === '자기소개')?.answer,
        want: card.requiredQA.find(q => q.question === '연인에게 바라는 한 가지는?')?.answer,
        charm: card.requiredQA.find(q => q.question === '나를 설레게 하는 이성의 매력?')?.answer,
        loveCards: cards,
        startIndex: 0,
        openQA: card.openQA,
        choiceQA: card.choiceQA,
        isVip,
        isSubscribed,
        tingBalance,
        eventTingBalance: coinBalance,
        freeProfileNum: walletInfo.freeProfileNum,
        freeLoveViewNum: walletInfo.freeLoveViewNum,
        additionalProfileNum: walletInfo.additionalProfileNum,
        page: 1,
        total: loveCodeCards.length || 1,
      });
    } catch {
      Alert.alert('오류', '블라인드 소개팅 데이터를 불러오지 못했어요.\n잠시 후 다시 시도해 주세요.');
    }
  };
  const blindIntroPreview =
    previewLoveCode?.requiredQA.find(q => q.question === '자기소개')?.answer ??
    '추천 자기소개가 없습니다.';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        {/* 상단 바 */}
        <View style={styles.topBar}>
          <View style={styles.topRow}>
            {isVip && (
              <View style={[styles.chip, styles.vipChip]}>
                <Image source={vipBadgeImg} style={styles.chipIcon} />
                <Text style={styles.vipChipText}>VIP</Text>
              </View>
            )}
            {isSubscribed && (
              <View style={[styles.chip, styles.subChip]}>
                <Image source={subBadgeImg} style={styles.chipIcon} />
                <Text style={styles.subChipText}>SUB</Text>
              </View>
            )}

            <View style={styles.balancePanel}>
              <View style={styles.balanceLine}>
                <Image source={tingIconImg} style={styles.balanceIcon} />
                <Text style={styles.balanceNumber}>{tingBalance}</Text>
              </View>
              <View style={styles.balanceLine}>
                <Image source={eventTingIconImg} style={styles.balanceIcon} />
                <Text style={styles.balanceNumber}>{coinBalance}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
            activeOpacity={0.85}
          >
            <Image source={filterImg} style={styles.filterImg} />
          </TouchableOpacity>
        </View>

        {/* 카드 2개 */}
        <View style={styles.cardsWrap}>
          {/* 떠다니는 벚꽃잎 */}
          <Image source={petalImg} style={[styles.petal, styles.petalLeft]} />
          <Image source={petalImg} style={[styles.petal, styles.petalRight]} />

          {/* 일반 소개팅 */}
          <TouchableOpacity
            style={styles.card}
            onPress={openProfilePreview}
            activeOpacity={0.9}
          >
            {previewProfile?.mainPhotoUrl ? (
              <ImageBackground
                source={{ uri: previewProfile.mainPhotoUrl }}
                blurRadius={21}
                style={styles.cardImage}
                imageStyle={styles.cardImageStyle}
              >
                <View style={styles.blurScrim} />
              </ImageBackground>
            ) : (
              <View style={[styles.cardImage, styles.emptyProfileCard]}>
                <Text style={styles.emptyProfileText}>추천 프로필이 없습니다</Text>
              </View>
            )}
            <Text style={styles.cardTitle}>일반 소개팅</Text>
          </TouchableOpacity>

          {/* 블라인드 소개팅 */}
          <TouchableOpacity
            style={[styles.card, styles.blindCard]}
            onPress={openLoveCodePreview}
            activeOpacity={0.9}
          >
            <View style={[styles.cardImage, styles.blindPlaceholder]}>
              <View style={styles.blindBlur} />
              <View style={styles.blindTextWrap}>
                <Text style={styles.blindLabel}>자기소개</Text>
                <ScrollView
                  style={styles.blindTextScroll}
                  contentContainerStyle={styles.blindTextContent}
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.blindText}>{blindIntroPreview}</Text>
                </ScrollView>
                <View pointerEvents="none" style={styles.blindTextFog} />
              </View>
            </View>
            <Text style={styles.cardTitle}>블라인드 소개팅</Text>
          </TouchableOpacity>
        </View>

        {/* 필터 모달 */}
        <FilterModal
          visible={filterModalVisible}
          onClose={() => setFilterModalVisible(false)}
          onApply={handleFilterApply}
          initialFilters={filterSettings}
        />

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#FFFFFF', position: 'relative' },

  topBar: {
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 8,
    alignItems: 'flex-end',
  },

  topRow: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  chip: {
    height: 24,
    width: 62,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  chipIcon: {
    width: 11,
    height: 11,
    resizeMode: 'contain',
  },
  vipChip: {
    backgroundColor: '#660099',
  },
  subChip: {
    backgroundColor: '#FFB6C180',
    borderWidth: 1,
    borderColor: '#00000020',
  },
  vipChipText: {
    color: '#F0C22D',
    fontSize: 12,
    fontWeight: '900',
  },
  subChipText: {
    color: '#111111',
    fontSize: 12,
    fontWeight: '700',
  },
  balancePanel: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    width: 65,
  },
  balanceLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minWidth: 48,
    paddingVertical: 1,
    gap: 0,
  },
  balanceIcon: {
    width: 19,
    height: 19,
    resizeMode: 'contain',
  },
  balanceNumber: {
    color: '#111',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 18,
    marginLeft: 7,
  },

  filterButton: {
    marginTop: 30,
    marginRight: -1,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  filterImg: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },

  cardsWrap: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
    position: 'relative',
    overflow: 'visible',
    alignItems: 'center',
  },

  card: {
    width: '82%',
    borderWidth: 2.2,
    borderColor: '#FFB3C7',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingTop: 16,
    paddingBottom: 10,
    shadowColor: '#FFB3C7',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    aspectRatio: 1.1,
  },
  blindCard: { marginTop: 12 },

  cardImage: {
    width: '94%',
    alignSelf: 'center',
    flex: 1,
    minHeight: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  cardImageStyle: { borderRadius: 12 },
  blurScrim: { flex: 1, backgroundColor: 'rgba(255,255,255,0.26)' },
  emptyProfileCard: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyProfileText: {
    color: '#8A8A8A',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },

  cardTitle: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '900',
    color: '#111',
  },

  blindPlaceholder: {
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: '94%',
    alignSelf: 'center',
    flex: 1,
    minHeight: 80,
  },
  blindBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(238,238,238,0.92)',
  },
  blindLabel: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
    marginTop: 10,
    marginLeft: 12,
    marginBottom: 8,
    opacity: 0.6,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },
  blindTextWrap: {
    width: '100%',
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#C5C5C5',
    borderRadius: 18,
    backgroundColor: '#ECECEC',
  },
  blindText: {
    color: '#000',
    fontWeight: '900',
    textAlign: 'left',
    fontSize: 16,
    lineHeight: 28,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 14,
    opacity: 0.17,
    letterSpacing: 1.8,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowRadius: 30,
    textShadowOffset: { width: 0, height: 0 },
    transform: [{ scaleX: 0.94 }, { scaleY: 0.92 }],
  },
  blindTextScroll: {
    width: '100%',
    flex: 1,
  },
  blindTextContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  blindTextFog: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245,245,245,0.56)',
  },

  petal: { position: 'absolute', width: 34, height: 34, opacity: 0.9 },
  petalLeft: { left: 14, bottom: 10, transform: [{ rotate: '-18deg' }] },
  petalRight: { right: 16, top: '44%', transform: [{ rotate: '18deg' }] },
});

export default BlindDateScreen;
