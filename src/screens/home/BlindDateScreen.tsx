// src/screens/BlindDate/BlindDateScreen.tsx
import React, { useMemo, useState } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import FilterModal from '../../components/common/FilterModal';

import {
  DrinkingHabit,
  CheckTingWalletResponse,
  FilterSettings,
  LoveViewMatchConditionRequest,
  ProfileMatchConditionRequest,
  SmokingHabit,
} from '../../types/DatingAPI';
import { defaultFilterSettings } from '../../utils/DatingUtils';
import { datingApiService } from '../../services/DatingApiService';
import { API_BASE_URL } from '../../config/api';
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
  smoking: SmokingHabit;
  drinking: DrinkingHabit;
};

type BlindLoveCodeCard = {
  profileId: number;
  nickname: string;
  requiredQA: { question: string; answer: string }[];
  optionalQA: { question: string; answer: string }[];
};
type PreviewModalProfile = {
  profileId: number;
  name?: string;
  nickname: string;
  age: number;
  mbti: string;
  smoking: SmokingHabit;
  drinking: DrinkingHabit;
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
  const [isSubscribed] = useState<boolean>(true);
  const isVip = tingBalance >= 200;

  const pickSmoking = (smoking: SmokingHabit[]) =>
    smoking[0] ?? SmokingHabit.NON_SMOKER;
  const pickDrinking = (drinking: DrinkingHabit[]) =>
    drinking[0] ?? DrinkingHabit.NON_DRINKER;

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
  const parseLoveCodeCard = (raw: any): BlindLoveCodeCard | null => {
    const loveViewRes: any = firstLoveCandidate(raw);
    if (!loveViewRes) return null;

    const loveProfileId =
      toPositiveId(loveViewRes?.profileId, loveViewRes?.userId, loveViewRes?.id) ?? 1;

    const introText =
      firstNonEmptyString(
        loveViewRes?.intro,
        loveViewRes?.selfIntroduction,
        loveViewRes?.description,
        loveViewRes?.bio,
      ) ?? '자기소개가 아직 등록되지 않았어요.';
    const wantText =
      firstNonEmptyString(
        loveViewRes?.want,
        loveViewRes?.desiredPartnerTrait,
        loveViewRes?.requiredAnswer1,
      ) ?? '연인에게 바라는 한 가지 응답이 없어요.';
    const charmText =
      firstNonEmptyString(
        loveViewRes?.charm,
        loveViewRes?.attractivePartnerTrait,
        loveViewRes?.requiredAnswer2,
      ) ?? '매력 응답이 아직 없어요.';

    return {
      profileId: loveProfileId,
      nickname:
        firstNonEmptyString(
          loveViewRes?.name,
          loveViewRes?.nickname,
          loveViewRes?.nickName,
        ) ?? '회원',
      requiredQA: [
        { question: '자기소개', answer: introText },
        { question: '연인에게 바라는 한 가지는?', answer: wantText },
        { question: '나를 설레게 하는 이성의 매력?', answer: charmText },
      ],
      optionalQA: [],
    };
  };

  const fetchProfilePreview = async (): Promise<BlindProfileCard | null> => {
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
    const profileId =
      toPositiveId(profileRes?.profileId, profileRes?.userId, profileRes?.id) ?? 1;

    const photoUris = extractPhotoUris(profileRes);
    return {
      profileId,
      name: firstNonEmptyString(profileRes?.name),
      nickname:
        firstNonEmptyString(profileRes?.nickname, profileRes?.nickName, profileRes?.name) ??
        '회원',
      age: Number(profileRes?.age ?? 0),
      mbti: String(profileRes?.mbti ?? ''),
      photoUris,
      smoking: profileRes?.smoking ?? SmokingHabit.NON_SMOKER,
      drinking: profileRes?.drinking ?? DrinkingHabit.NON_DRINKER,
      mainPhotoUrl: photoUris[0] ?? '',
    };
  };

  const fetchLovePreview = async (): Promise<BlindLoveCodeCard | null> => {
    const loveViewCondition: LoveViewMatchConditionRequest = {
      minAge: filterSettings.ageRange.min,
      maxAge: filterSettings.ageRange.max,
      smoking: pickSmoking(filterSettings.smoking),
      drinking: pickDrinking(filterSettings.drinking),
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
  };

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
  }, [filterSettings]);

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
        smoking: p.smoking,
        drinking: p.drinking,
        photoUris: p.photoUris.length ? p.photoUris : [p.mainPhotoUrl],
      })),
    [profileCards],
  );

  const firstLoveCode = loveCodeCards[0];
  const findAnswer = (q: string | undefined) =>
    firstLoveCode?.requiredQA.find(item => item.question === q)?.answer;

  const openProfilePreview = async () => {
    try {
      let profiles: PreviewModalProfile[] = mapProfilesForModal;
      if (!profiles.length && previewProfile) {
        profiles = [
          {
            profileId: previewProfile.profileId,
            nickname: previewProfile.nickname,
            name: previewProfile.name ?? previewProfile.nickname,
            age: previewProfile.age,
            mbti: previewProfile.mbti,
            smoking: previewProfile.smoking,
            drinking: previewProfile.drinking,
            photoUris: previewProfile.photoUris.length
              ? previewProfile.photoUris
              : [previewProfile.mainPhotoUrl],
          },
        ];
      }
      if (!profiles.length) {
        const fresh = await fetchProfilePreview();
        if (!fresh) throw new Error('empty profile');
        setProfileCards([fresh]);
        setPreviewProfile(fresh);
        profiles = [
          {
            profileId: fresh.profileId,
            name: fresh.name ?? fresh.nickname,
            nickname: fresh.nickname,
            age: fresh.age,
            mbti: fresh.mbti,
            smoking: fresh.smoking,
            drinking: fresh.drinking,
            photoUris: fresh.photoUris.length ? fresh.photoUris : [fresh.mainPhotoUrl],
          },
        ];
      }

      navigation.navigate('ProfilePreview', {
        profiles,
        isVip,
        isSubscribed,
        tingBalance,
        eventTingBalance: coinBalance,
        freeProfileNum: walletInfo.freeProfileNum,
        additionalProfileNum: walletInfo.additionalProfileNum,
      });
    } catch (e: any) {
      if (isNoProfileQuotaError(e)) {
        navigation.navigate('ProfilePreview', {
          profiles: [],
          isVip,
        isSubscribed,
        tingBalance,
        eventTingBalance: coinBalance,
        freeProfileNum: walletInfo.freeProfileNum,
        additionalProfileNum: walletInfo.additionalProfileNum,
        noCards: true,
      });
        return;
      }
      Alert.alert('오류', '일반 소개팅 데이터를 불러오지 못했어요.\n잠시 후 다시 시도해 주세요.');
    }
  };

  const openLoveCodePreview = async () => {
    try {
      let card = firstLoveCode;
      if (!card && previewLoveCode) {
        card = previewLoveCode;
      }
      if (!card) {
        const fresh = await fetchLovePreview();
        if (!fresh) throw new Error('empty love');
        setLoveCodeCards([fresh]);
        setPreviewLoveCode(fresh);
        card = fresh;
      }

      navigation.navigate('LoveCodePreview', {
        nickname: card.nickname,
        intro: card.requiredQA.find(q => q.question === '자기소개')?.answer,
        want: card.requiredQA.find(q => q.question === '연인에게 바라는 한 가지는?')?.answer,
        charm: card.requiredQA.find(q => q.question === '나를 설레게 하는 이성의 매력?')?.answer,
        isVip,
        isSubscribed,
        tingBalance,
        eventTingBalance: coinBalance,
        page: 1,
        total: loveCodeCards.length || 1,
      });
    } catch {
      Alert.alert('오류', '블라인드 소개팅 데이터를 불러오지 못했어요.\n잠시 후 다시 시도해 주세요.');
    }
  };
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
            <ImageBackground
              source={{ uri: previewProfile?.mainPhotoUrl ?? 'https://picsum.photos/700/700' }}
              blurRadius={7}
              style={styles.cardImage}
              imageStyle={styles.cardImageStyle}
            >
              <View style={styles.blurScrim} />
            </ImageBackground>
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
              <Text style={styles.blindLabel}>자기소개</Text>
              <Text style={styles.blindText} numberOfLines={4}>
                {previewLoveCode?.requiredQA.find(q => q.question === '자기소개')?.answer ??
                  '소개팅 프로필에 작성된 자기소개가 여기에 블러 처리되어 보여요.'}
              </Text>
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

  cardTitle: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '900',
    color: '#111',
  },

  blindPlaceholder: {
    borderWidth: 1,
    borderColor: '#FFE0EA',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: '94%',
    alignSelf: 'center',
    flex: 1,
    minHeight: 80,
  },
  blindBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(240,240,240,0.97)',
  },
  blindLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#111',
    marginBottom: 10,
    opacity: 0.18,
  },
  blindText: {
    color: '#111',
    fontWeight: '900',
    textAlign: 'center',
    opacity: 0.08,
    letterSpacing: 3.6,
    textShadowColor: '#000',
    textShadowRadius: 16,
    textShadowOffset: { width: 2, height: 2 },
    lineHeight: 20,
    transform: [{ scaleX: 0.82 }, { scaleY: 0.8 }],
  },

  petal: { position: 'absolute', width: 34, height: 34, opacity: 0.9 },
  petalLeft: { left: 14, bottom: 10, transform: [{ rotate: '-18deg' }] },
  petalRight: { right: 16, top: '44%', transform: [{ rotate: '18deg' }] },
});

export default BlindDateScreen;
