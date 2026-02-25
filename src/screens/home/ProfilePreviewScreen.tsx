import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import BottomNavigationBar from '../../components/common/BottomNavigationBar';
import { datingApiService } from '../../services/DatingApiService';
import { API_BASE_URL } from '../../config/api';
import { DrinkingHabit, ProfileMatchConditionRequest, SmokingHabit } from '../../types/DatingAPI';
import { getProfilePreviewState, setProfilePreviewState } from '../../utils/ProfilePreviewStore';

const vipBadgeImg = require('../../assets/images/VIP.png');
const subBadgeImg = require('../../assets/images/SUB.png');
const tingIconImg = require('../../assets/images/Ting.png');
const eventTingIconImg = require('../../assets/images/Eventting.png');
const petalImg = require('../../assets/images/petal.png');
const freeProfileImg = require('../../assets/images/freeprofile.png');
const paidProfileImg = require('../../assets/images/paidprofile.png');

type ProfileCard = {
  profileId: number;
  nickname: string;
  name?: string;
  age: number;
  mbti?: string;
  photoUris?: string[];
};

const firstNonEmptyString = (...vals: any[]): string | undefined => {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim().length > 0) return v;
  }
  return undefined;
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
  return Array.from(new Set(candidates.filter(Boolean)));
};

export default function ProfilePreviewScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const savedState = getProfilePreviewState();
  const initialLockedRatedProfileIds: number[] =
    savedState?.lockedRatedProfileIds ?? route.params?.lockedRatedProfileIds ?? [];
  const initialProfiles: ProfileCard[] = (
    savedState?.profiles?.length ? savedState.profiles : route.params?.profiles ?? []
  ).filter((p: ProfileCard) => !initialLockedRatedProfileIds.includes(p.profileId));

  const [profiles, setProfiles] = useState<ProfileCard[]>(initialProfiles);
  const isVip: boolean = route.params?.isVip ?? false;
  const isSubscribed: boolean = route.params?.isSubscribed ?? false;
  const [tingBalance, setTingBalance] = useState<number>(route.params?.tingBalance ?? 0);
  const [eventTingBalance, setEventTingBalance] = useState<number>(
    route.params?.eventTingBalance ?? 0,
  );
  const [freeProfileNum, setFreeProfileNum] = useState<number>(route.params?.freeProfileNum ?? 5);
  const [additionalProfileNum, setAdditionalProfileNum] = useState<number>(
    route.params?.additionalProfileNum ?? 5,
  );
  const initialFilterCondition: ProfileMatchConditionRequest = {
    minAge: route.params?.minAge ?? 20,
    maxAge: route.params?.maxAge ?? 45,
    smoking: route.params?.smoking ?? [
      SmokingHabit.NON_SMOKER,
      SmokingHabit.VAPE_ONLY,
      SmokingHabit.REGULAR_SMOKER,
    ],
    drinking: route.params?.drinking ?? [
      DrinkingHabit.NON_DRINKER,
      DrinkingHabit.OCCASIONAL_DRINKER,
      DrinkingHabit.FREQUENT_DRINKER,
    ],
  };
  const noCards: boolean = profiles.length === 0;

  const [index, setIndex] = useState<number>(() => {
    const seed = savedState?.index ?? route.params?.startIndex ?? 0;
    const maxIdx = Math.max(0, (savedState?.profiles?.length ?? route.params?.profiles?.length ?? 1) - 1);
    return Math.max(0, Math.min(seed, maxIdx));
  });
  const [ratedByProfileId, setRatedByProfileId] = useState<Record<number, number>>(
    savedState?.ratedByProfileId ?? route.params?.ratedByProfileId ?? {},
  );
  const [lockedRatedProfileIds, setLockedRatedProfileIds] = useState<number[]>(
    initialLockedRatedProfileIds,
  );
  const [shortageVisible, setShortageVisible] = useState(false);
  const [purchasing, setPurchasing] = useState<1 | 5 | null>(null);
  const [counterInfoVisible, setCounterInfoVisible] = useState(false);
  const [metaAnchor, setMetaAnchor] = useState({ x: 18, y: 120, width: 120, height: 28 });
  const metaRowRef = React.useRef<View>(null);

  const refreshWalletInfo = useCallback(async () => {
    try {
      const wallet = await datingApiService.getTingWalletInfo();
      setTingBalance(wallet.tingNum ?? 0);
      setEventTingBalance(wallet.eventTingNum ?? 0);
      setFreeProfileNum(wallet.freeProfileNum ?? 0);
      setAdditionalProfileNum(wallet.additionalProfileNum ?? 0);
    } catch (e) {
      console.warn('Failed to refresh profile wallet info', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshWalletInfo();
      return undefined;
    }, [refreshWalletInfo]),
  );

  React.useEffect(() => {
    const safeIndex = Math.max(0, Math.min(index, Math.max(0, profiles.length - 1)));
    setProfilePreviewState({
      profiles,
      index: safeIndex,
      ratedByProfileId,
      lockedRatedProfileIds,
    });
  }, [profiles, index, ratedByProfileId, lockedRatedProfileIds]);

  const current = useMemo(
    () => (profiles.length ? profiles[Math.min(index, profiles.length - 1)] : null),
    [profiles, index],
  );
  const currentRated = current ? ratedByProfileId[current.profileId] ?? 0 : 0;
  const isCurrentRatingLocked = current
    ? lockedRatedProfileIds.includes(current.profileId)
    : false;
  const displayName = useMemo(() => {
    const raw = current?.name ?? current?.nickname ?? '';
    return raw.trim() && raw.trim() !== '익명' ? raw : '회원';
  }, [current]);

  const goPrev = () => setIndex(i => Math.max(0, i - 1));
  const goNext = () =>
    setIndex(i => {
      if (!profiles.length) return i;
      return (i + 1) % profiles.length;
    });
  const loadMoreProfiles = async (): Promise<boolean> => {
    try {
      const todayList = await datingApiService.getTodayMatchingProfiles();
      if (Array.isArray(todayList) && todayList.length) {
        const mappedRaw: ProfileCard[] = todayList
          .map(p => ({
            profileId: p.profileId ?? p.userId ?? 0,
            name: p.name ?? p.nickname ?? p.nickName,
            nickname: p.nickname ?? p.nickName ?? p.name ?? '회원',
            age: p.age ?? 0,
            mbti: p.mbti ?? '',
            photoUris: [toAbsoluteUri(p.profileImageUrl)],
          }))
          .filter(p => p.profileId > 0);

        if (mappedRaw.length) {
          const existing = new Set(profiles.map(item => item.profileId));
          const ratedSet = new Set(lockedRatedProfileIds);
          const deduped = mappedRaw.filter(
            item => !existing.has(item.profileId) && !ratedSet.has(item.profileId),
          );
          if (!deduped.length) {
            // 오늘 목록이 와도 이미 본/평가한 카드뿐이면 다음 소스를 시도한다.
          } else {
            setProfiles(prev => [...prev, ...deduped]);
            return true;
          }
        }
      }

      let raw: any;
      try {
        raw = await datingApiService.getMatchingProfile(initialFilterCondition);
      } catch {
        raw = await datingApiService.getMatchingProfileExtra(initialFilterCondition);
      }

      const profileId = toPositiveId(raw?.profileId, raw?.userId, raw?.id);
      if (!profileId) return false;
      if (profiles.some(item => item.profileId === profileId)) return false;
      if (lockedRatedProfileIds.includes(profileId)) return false;

      const mapped: ProfileCard = {
        profileId,
        name: firstNonEmptyString(raw?.name),
        nickname: firstNonEmptyString(raw?.nickname, raw?.nickName, raw?.name) ?? '회원',
        age: Number(raw?.age ?? 0),
        mbti: String(raw?.mbti ?? ''),
        photoUris: extractPhotoUris(raw),
      };

      setProfiles(prev => [...prev, mapped]);
      return true;
    } catch {
      return false;
    }
  };
  const handleNext = async () => {
    if (!profiles.length) return;
    if (currentRated <= 0) {
      return;
    }
    if (!current?.profileId) return;

    const currentProfileId = current.profileId;
    const alreadyLocked = lockedRatedProfileIds.includes(currentProfileId);
    if (!alreadyLocked) {
      try {
        await datingApiService.rateProfile({
          targetProfileId: currentProfileId,
          score: currentRated,
        });
      } catch (e: any) {
        const status = e?.response?.status;
        const message = String(e?.response?.data?.message ?? '');
        if (__DEV__) {
          console.warn('rateProfile failed:', status, message);
        }
        // 이미 평가한 상대(400)도 포함해 저장 실패여도 UX를 막지 않는다.
      }
      await refreshWalletInfo();
    }

    setLockedRatedProfileIds(prev =>
      prev.includes(currentProfileId) ? prev : [...prev, currentProfileId],
    );
    const nextProfiles = profiles.filter(item => item.profileId !== currentProfileId);
    setProfiles(nextProfiles);

    if (nextProfiles.length) {
      const nextIndex = Math.min(index, nextProfiles.length - 1);
      setIndex(nextIndex);
      return;
    }

    const loaded = await loadMoreProfiles();
    if (loaded) {
      await refreshWalletInfo();
      setIndex(0);
      return;
    }
    Alert.alert('안내', '다음으로 보여줄 일반 프로필이 아직 없어요.');
  };
  const openCounterInfo = () => {
    if (metaRowRef.current) {
      metaRowRef.current.measureInWindow((x, y, width, height) => {
        setMetaAnchor({ x, y, width, height });
        setCounterInfoVisible(true);
      });
      return;
    }
    setCounterInfoVisible(true);
  };

  const handleBuyProfiles = async (count: 1 | 5, cost: number) => {
    if (tingBalance < cost) {
      setShortageVisible(true);
      return;
    }
    if (purchasing) return;

    try {
      setPurchasing(count);
      await datingApiService.purchaseExtraProfileByTing(count);
      setTingBalance(prev => Math.max(0, prev - cost));
      setAdditionalProfileNum(prev => prev + count);
      navigation.goBack();
    } catch {
      setShortageVisible(true);
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={styles.back}>{'←'}</Text>
        </Pressable>

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
              <Text style={styles.balanceNumber}>{eventTingBalance}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {noCards ? (
          <>
            <Text style={styles.doneText}>프로필을 모두 확인하셨어요!</Text>
            <View style={styles.emptyCard}>
              <TouchableOpacity
                style={styles.buyBtn}
                onPress={() => handleBuyProfiles(1, 5)}
                activeOpacity={0.9}
              >
                <Text style={styles.buyBtnText}>
                  {purchasing === 1 ? '구매 중...' : '추가 프로필 1장'}
                </Text>
                <View style={styles.buyCostPill}>
                  <Image source={tingIconImg} style={styles.buyCostIcon} />
                  <Text style={styles.buyCostText}>5</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.buyBtn, { marginTop: 26 }]}
                onPress={() => handleBuyProfiles(5, 20)}
                activeOpacity={0.9}
              >
                <Text style={styles.buyBtnText}>
                  {purchasing === 5 ? '구매 중...' : '추가 프로필 5장'}
                </Text>
                <View style={styles.buyCostPill}>
                  <Image source={tingIconImg} style={styles.buyCostIcon} />
                  <Text style={styles.buyCostText}>20</Text>
                </View>
              </TouchableOpacity>
            </View>
            <Text style={styles.emptyDesc}>
              여기서 구매한 프로필은{'\n'}일반 소개팅, 블라인드 소개팅 모두{'\n'}사용할 수 있어요!
            </Text>
          </>
        ) : (
          <>
            <View style={styles.photoArea}>
              <View ref={metaRowRef} collapsable={false}>
                <TouchableOpacity
                  style={styles.metaRowAbovePhoto}
                  activeOpacity={0.85}
                  onPress={openCounterInfo}
                >
                  <Image source={freeProfileImg} style={styles.metaIconLarge} />
                  <Text style={styles.metaTextLarge}>{freeProfileNum}</Text>
                  <Image source={paidProfileImg} style={styles.metaIconLarge} />
                  <Text style={[styles.metaTextLarge, { color: '#E76A8C' }]}>
                    {additionalProfileNum}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.photoWrap}>
                <Pressable onPress={goPrev} hitSlop={10}>
                  <Text style={styles.arrow}>{'‹'}</Text>
                </Pressable>
                <View style={styles.photoBox}>
                  {current?.photoUris?.[0] ? (
                    <Image source={{ uri: current.photoUris[0] }} style={styles.photo} />
                  ) : (
                    <View style={styles.photoEmpty}>
                      <Text style={styles.photoEmptyText}>사진 없음</Text>
                    </View>
                  )}
                </View>
                <Pressable onPress={handleNext} hitSlop={10}>
                  <Text style={styles.arrow}>{'›'}</Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.hint}>상세 프로필에서 당신의 호감을 표시하세요!</Text>

            <Text style={styles.nickname}>{displayName}</Text>

            <View style={styles.heartRow}>
              {[1, 2, 3, 4, 5].map(n => (
                <Pressable
                  key={n}
                  onPress={() => {
                    if (!current?.profileId || isCurrentRatingLocked) return;
                    setRatedByProfileId(prev => ({ ...prev, [current.profileId]: n }));
                  }}
                  disabled={isCurrentRatingLocked}
                >
                  <Text style={[styles.heart, n <= currentRated && styles.heartActive]}>♡</Text>
                </Pressable>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.profileBtn, currentRated <= 0 && styles.profileBtnDisabled]}
              activeOpacity={0.9}
              onPress={() => {
                if (!current?.profileId) return;
                navigation.navigate('MatchDetail', {
                  source: 'PROFILE_MATCH',
                  targetProfileId: current.profileId,
                  previewName: displayName,
                  previewMbti: current.mbti,
                  previewImageUrl: current.photoUris?.[0],
                });
              }}
              disabled={currentRated <= 0}
            >
              <Text style={styles.profileBtnText}>프로필 보기</Text>
            </TouchableOpacity>
          </>
        )}

      </ScrollView>

      <Text style={styles.pageText}>
        {profiles.length ? `${index + 1}/${profiles.length}` : '1/5'}
      </Text>

      <Image source={petalImg} style={[styles.petal, styles.petalLeft]} />
      <Image source={petalImg} style={[styles.petal, styles.petalRight]} />

      <BottomNavigationBar
        activeTab="dating"
        onTabPress={tabKey => navigation.navigate('MainTabs', { screen: tabKey } as any)}
      />

      <Modal
        visible={shortageVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setShortageVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShortageVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>팅 부족</Text>
              <Pressable onPress={() => setShortageVisible(false)} hitSlop={10}>
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>
            <Text style={styles.modalDesc}>
              죄송합니다.{'\n'}팅이 부족하여 추가로 프로필을{'\n'}열람 할 수 없습니다.
            </Text>
            <TouchableOpacity
              style={styles.storeBtn}
              onPress={() => {
                setShortageVisible(false);
                navigation.navigate('Store');
              }}
            >
              <Text style={styles.storeBtnText}>스토어 이동</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={counterInfoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCounterInfoVisible(false)}
      >
        <Pressable style={styles.counterBackdrop} onPress={() => setCounterInfoVisible(false)}>
          <Pressable
            style={[
              styles.counterCard,
              { left: Math.max(10, metaAnchor.x - 2), top: metaAnchor.y + metaAnchor.height + 6 },
            ]}
            onPress={() => {}}
          >
            <View style={styles.counterHeader}>
              <Text style={styles.counterTitle}>정보</Text>
              <Pressable onPress={() => setCounterInfoVisible(false)} hitSlop={10}>
                <Text style={styles.counterClose}>✕</Text>
              </Pressable>
            </View>
            <View style={styles.counterLine}>
              <Image source={freeProfileImg} style={styles.counterIcon} />
              <Text style={styles.counterText}>무료 프로필 잔여횟수</Text>
            </View>
            <View style={styles.counterLine}>
              <Image source={paidProfileImg} style={styles.counterIcon} />
              <Text style={styles.counterText}>유료 프로필 잔여횟수</Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    paddingHorizontal: 12,
    paddingTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  back: { fontSize: 22, color: '#111', fontWeight: '700' },

  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  chip: {
    height: 24,
    width: 62,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  chipIcon: { width: 11, height: 11, resizeMode: 'contain' },
  vipChip: { backgroundColor: '#660099' },
  subChip: { backgroundColor: '#FFB6C180', borderWidth: 1, borderColor: '#00000020' },
  vipChipText: { color: '#F0C22D', fontSize: 12, fontWeight: '900' },
  subChipText: { color: '#111', fontSize: 12, fontWeight: '700' },

  balancePanel: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    width: 65,
  },
  balanceLine: { flexDirection: 'row', alignItems: 'center', paddingVertical: 1 },
  balanceIcon: { width: 19, height: 19, resizeMode: 'contain' },
  balanceNumber: { marginLeft: 10, fontSize: 16, fontWeight: '400', color: '#111' },

  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
    minHeight: '100%',
  },
  photoArea: {
    width: '100%',
    marginTop: 18,
  },
  metaRowAbovePhoto: {
    width: '82%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  metaIconLarge: { width: 22, height: 22, resizeMode: 'contain' },
  metaTextLarge: { fontSize: 21, color: '#111', fontWeight: '800' },
  hint: { marginTop: 6, marginBottom: 6, fontSize: 9, color: '#555', fontWeight: '700' },
  doneText: { marginTop: 18, marginBottom: 14, fontSize: 14, color: '#444', fontWeight: '700' },
  emptyCard: {
    width: '94%',
    minHeight: 260,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyBtn: {
    width: 150,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F8B8C8',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buyBtnText: { color: '#111', fontWeight: '800', fontSize: 14 },
  buyCostPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFFCC',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  buyCostIcon: { width: 14, height: 14, resizeMode: 'contain' },
  buyCostText: { color: '#D95F7E', fontWeight: '900', fontSize: 12 },
  emptyDesc: {
    marginTop: 14,
    textAlign: 'center',
    color: '#777',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },

  photoWrap: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: { fontSize: 24, color: '#111' },
  photoBox: {
    width: '82%',
    aspectRatio: 0.86,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#EEE',
  },
  photo: { width: '100%', height: '100%', resizeMode: 'cover' },
  photoEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  photoEmptyText: { color: '#666', fontWeight: '700' },

  nickname: { marginTop: 8, fontSize: 28, fontWeight: '900', color: '#111' },
  heartRow: { marginTop: 6, flexDirection: 'row', gap: 8 },
  heart: { fontSize: 30, color: '#D4D4D4' },
  heartActive: { color: '#F3A2B6' },

  profileBtn: {
    marginTop: 8,
    width: 90,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#F8C5D2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBtnDisabled: {
    opacity: 0.45,
  },
  profileBtnText: { fontSize: 10, color: '#111', fontWeight: '800' },
  pageText: {
    position: 'absolute',
    right: 10,
    bottom: 4,
    color: '#111',
    fontWeight: '700',
    fontSize: 14,
  },

  petal: { position: 'absolute', width: 34, height: 34, opacity: 0.9, zIndex: 0, elevation: 0 },
  petalLeft: { left: 14, bottom: 96, transform: [{ rotate: '-18deg' }] },
  petalRight: { right: 16, top: '44%', transform: [{ rotate: '18deg' }] },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxWidth: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#111' },
  modalClose: { fontSize: 20, color: '#111' },
  modalDesc: { marginTop: 8, color: '#111', fontSize: 14, lineHeight: 18 },
  storeBtn: {
    marginTop: 10,
    alignSelf: 'center',
    width: 120,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F8B8C8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeBtnText: { color: '#111', fontWeight: '800', fontSize: 15 },

  counterBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.15)' },
  counterCard: {
    position: 'absolute',
    width: 210,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E4E4',
    padding: 10,
  },
  counterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  counterTitle: { fontSize: 12, fontWeight: '900', color: '#111' },
  counterClose: { fontSize: 12, color: '#111' },
  counterLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  counterIcon: { width: 16, height: 16, resizeMode: 'contain' },
  counterText: { fontSize: 12, color: '#111', fontWeight: '700' },
});
