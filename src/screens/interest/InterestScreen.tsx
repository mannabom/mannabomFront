import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { datingApiService } from '../../services/DatingApiService';
import apiClient from '../../services/apiClient';
import { API_ENDPOINTS_LIST } from '../../config/api';
import { FEATURE_FLAGS } from '../../config/features';
import {
  FromMeSignalProfileDto,
  InterestType,
  ToMeSignalProfileDto,
} from '../../types/DatingAPI';
import { toExternalId } from '../../utils/IdUtils';

const vipBadgeImg = require('../../assets/images/VIP.png');
const subBadgeImg = require('../../assets/images/SUB.png');
const tingIconImg = require('../../assets/images/Ting.png');
const eventTingIconImg = require('../../assets/images/Eventting.png');

type InterestTab = 'received' | 'sent';
type InterestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
type ItemKind = InterestType;

type InterestItem = {
  id: string;
  sourceId: string;
  profileId?: string;
  kind: ItemKind;
  nickname: string;
  imageUrl?: string;
  message?: string;
  hasGift?: boolean;
  giftName?: string;
  staySeconds?: number;
  receivedScore?: number;
  isLoveView?: boolean;
  status?: InterestStatus;
  rejectReason?: string;
  createdAt: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const defaultRejectReasons = ['관심사가 저랑 맞지 않아요', '외모가 제 취향이 아니었어요'];

const kindPriority: Record<ItemKind, number> = {
  MESSAGE: 0,
  LIKE: 1,
  HIGH_SCORE: 2,
};

const isWithin30Days = (createdAt: string) => {
  const t = new Date(createdAt).getTime();
  if (!Number.isFinite(t) || t <= 0) return true;
  return Date.now() - t <= 30 * DAY_MS;
};

const blurNickname = (v: string) => '●'.repeat(Math.max(2, v.length));

const normalizeStatus = (raw: FromMeSignalProfileDto['status']): InterestStatus | undefined => {
  const s = String(raw ?? '').toUpperCase();
  if (s === 'REJECT' || s === 'REJECTED') return 'REJECTED';
  if (s === 'ACCEPT' || s === 'ACCEPTED') return 'ACCEPTED';
  if (s === 'PENDING') return 'PENDING';
  return undefined;
};

const firstExternalId = (...vals: any[]): string | undefined => {
  for (const v of vals) {
    const id = toExternalId(v);
    if (id) return id;
  }
  return undefined;
};

const extractProfileIdCandidates = (raw: any) => {
  const anyRaw: any = raw;
  return [
    anyRaw?.profileId,
    anyRaw?.targetProfileId,
    anyRaw?.toProfileId,
    anyRaw?.fromProfileId,
    anyRaw?.profile?.profileId,
    anyRaw?.target?.profileId,
    anyRaw?.toProfile?.profileId,
    anyRaw?.fromProfile?.profileId,
    anyRaw?.toUserProfileId,
    anyRaw?.fromUserProfileId,
    anyRaw?.targetUserProfileId,
    anyRaw?.receiverProfileId,
    anyRaw?.ratedProfileId,
    anyRaw?.scoreTargetProfileId,
    anyRaw?.matchProfileId,
  ];
};

const mapReceivedItem = (raw: ToMeSignalProfileDto): InterestItem => {
  const anyRaw: any = raw;
  const resolvedProfileId = firstExternalId(
    ...extractProfileIdCandidates(raw),
  );
  return {
    id: `received-${raw.type}-${raw.id}`,
    sourceId: raw.id,
    profileId: resolvedProfileId,
    kind: raw.type,
    nickname: String(raw.fromUserNickname ?? '회원'),
    imageUrl: raw.fromUserImageUrl ?? undefined,
    message: raw.message ?? undefined,
    hasGift: Boolean(anyRaw?.hasGift ?? anyRaw?.giftIncluded ?? anyRaw?.gift),
    giftName: String(anyRaw?.giftName ?? anyRaw?.giftTitle ?? ''),
    staySeconds: Number(anyRaw?.myProfileStaySeconds ?? anyRaw?.staySeconds ?? 0) || undefined,
    receivedScore: Number(anyRaw?.receivedScore ?? anyRaw?.scoreToMe ?? 0) || undefined,
    isLoveView: String(raw.matchType ?? '').toUpperCase() === 'LOVE_VIEW',
    createdAt: raw.receivedAt,
  };
};

const mapSentItem = (raw: FromMeSignalProfileDto): InterestItem => {
  const anyRaw: any = raw;
  const resolvedProfileId = firstExternalId(
    ...extractProfileIdCandidates(raw),
  );
  return {
    id: `sent-${raw.type}-${raw.id}`,
    sourceId: raw.id,
    profileId: resolvedProfileId,
    kind: raw.type,
    nickname: String(raw.toUserNickname ?? '회원'),
    imageUrl: raw.toUserImageUrl ?? undefined,
    message: raw.message ?? undefined,
    hasGift: Boolean(anyRaw?.hasGift ?? anyRaw?.giftIncluded ?? anyRaw?.gift),
    giftName: String(anyRaw?.giftName ?? anyRaw?.giftTitle ?? ''),
    isLoveView: String(raw.matchType ?? '').toUpperCase() === 'LOVE_VIEW',
    status: normalizeStatus(raw.status),
    rejectReason: raw.rejectReason ?? undefined,
    createdAt: raw.receivedAt,
  };
};

export default function InterestScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [tab, setTab] = useState<InterestTab>('received');
  const [tingBalance, setTingBalance] = useState(0);
  const [eventTingBalance, setEventTingBalance] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const [loading, setLoading] = useState(true);
  const [receivedItems, setReceivedItems] = useState<InterestItem[]>([]);
  const [sentItems, setSentItems] = useState<InterestItem[]>([]);
  const [purchasedHighScoreIds, setPurchasedHighScoreIds] = useState<string[]>([]);

  const [viewModalItem, setViewModalItem] = useState<InterestItem | null>(null);
  const [rejectModalItem, setRejectModalItem] = useState<InterestItem | null>(null);
  const [shortageVisible, setShortageVisible] = useState(false);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    const [walletRes, receivedRes, sentRes] = await Promise.allSettled([
      datingApiService.getTingWalletInfo(),
      datingApiService.getReceivedInterests(),
      datingApiService.getSentInterests(),
    ]);

    if (walletRes.status === 'fulfilled') {
      setTingBalance(walletRes.value.tingNum ?? 0);
      setEventTingBalance(walletRes.value.eventTingNum ?? 0);
    } else {
      if (__DEV__) {
        console.warn(
          'Failed to load wallet on interest screen',
          walletRes.reason instanceof Error
            ? walletRes.reason.message
            : 'unknown error',
        );
      }
    }

    if (receivedRes.status === 'fulfilled') {
      const mappedReceived = receivedRes.value
        .map(mapReceivedItem)
        .filter(v => isWithin30Days(v.createdAt));
      setReceivedItems(mappedReceived);
    } else {
      if (__DEV__) {
        console.warn(
          'Failed to load received interests',
          receivedRes.reason instanceof Error
            ? receivedRes.reason.message
            : 'unknown error',
        );
      }
      setReceivedItems([]);
    }

    if (sentRes.status === 'fulfilled') {
      const mappedSent = sentRes.value
        .map(mapSentItem)
        .filter(v => isWithin30Days(v.createdAt));
      setSentItems(mappedSent);
    } else {
      if (__DEV__) {
        console.warn(
          'Failed to load sent interests',
          sentRes.reason instanceof Error
            ? sentRes.reason.message
            : 'unknown error',
        );
      }
      setSentItems([]);
    }

    if (receivedRes.status === 'rejected' && sentRes.status === 'rejected') {
      Alert.alert('오류', '관심 목록을 불러오지 못했어요.');
    }

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
      setIsSubscribed(profileSub);
    } catch (e) {
      if (__DEV__) {
        console.warn(
          'Failed to load subscription on interest screen',
          e instanceof Error ? e.message : 'unknown error',
        );
      }
      setIsSubscribed(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const requestedTab = route.params?.initialTab;
      if (requestedTab === 'sent' || requestedTab === 'received') {
        setTab(requestedTab);
      }
      refreshAll();
      return undefined;
    }, [refreshAll, route.params?.initialTab]),
  );

  const hasFreeHighScoreView = isSubscribed || tingBalance >= 200;

  const list = useMemo(() => {
    const src = tab === 'received' ? receivedItems : sentItems;
    return [...src].sort((a, b) => {
      const byKind = kindPriority[a.kind] - kindPriority[b.kind];
      if (byKind !== 0) return byKind;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [receivedItems, sentItems, tab]);

  const messages = list.filter(v => v.kind === 'MESSAGE');
  const likes = list.filter(v => v.kind === 'LIKE');
  const highScores = list.filter(v => v.kind === 'HIGH_SCORE');

  const canOpenHighScoreProfile = (item: InterestItem) =>
    hasFreeHighScoreView || purchasedHighScoreIds.includes(item.id);

  const openProfile = (item: InterestItem) => {
    const targetProfileId = item.profileId;

    if (!targetProfileId) {
      Alert.alert('안내', '서버 응답에 profileId가 없어 상세 프로필을 열 수 없어요.');
      return;
    }
    // 보낸 관심은 모두 기존 MatchDetail 화면으로 통일
    if (tab === 'sent') {
      navigation.navigate('MatchDetail', {
        source: item.isLoveView ? 'LOVE_VIEW_MATCH' : 'PROFILE_MATCH',
        targetProfileId,
        previewName: item.nickname,
        previewImageUrl: item.imageUrl,
        fromInterestTab: 'sent',
        interestEntryKind: item.kind,
        initialLikedSent: item.kind === 'LIKE',
        initialMessagedSent: item.kind === 'MESSAGE',
        initialSentMessage: item.message,
        initialSentGiftName: item.giftName,
      });
      return;
    }

    const isReceivedHighScore = tab === 'received' && item.kind === 'HIGH_SCORE';
    if (isReceivedHighScore) {
      const linkedSentItems = sentItems.filter(
        sent => sent.profileId && item.profileId && sent.profileId === item.profileId,
      );
      const linkedMessage = linkedSentItems.find(sent => sent.kind === 'MESSAGE');
      navigation.navigate('MatchDetail', {
        source: item.isLoveView ? 'LOVE_VIEW_MATCH' : 'PROFILE_MATCH',
        targetProfileId,
        previewName: item.nickname,
        previewImageUrl: item.imageUrl,
        initialLikedSent: linkedSentItems.some(sent => sent.kind === 'LIKE'),
        initialMessagedSent: linkedSentItems.some(sent => sent.kind === 'MESSAGE'),
        initialSentMessage: linkedMessage?.message,
        initialSentGiftName: linkedMessage?.giftName,
      });
      return;
    }

    navigation.navigate('InterestDetail', {
      tab,
      kind: item.kind,
      sourceId: item.sourceId,
      profileId: item.profileId,
      nickname: item.nickname,
      imageUrl: item.imageUrl,
      isLoveView: item.isLoveView,
      message: item.message,
      hasGift: item.hasGift,
      giftName: item.giftName,
      staySeconds: item.staySeconds,
      receivedScore: item.receivedScore,
    });
  };

  const handlePressAvatar = (item: InterestItem) => {
    if (item.kind === 'HIGH_SCORE' && tab === 'received' && !canOpenHighScoreProfile(item)) {
      setViewModalItem(item);
      return;
    }
    openProfile(item);
  };

  const handleConfirmViewProfile = () => {
    if (!viewModalItem) return;
    if (hasFreeHighScoreView) {
      const item = viewModalItem;
      setViewModalItem(null);
      openProfile(item);
      return;
    }

    const available = tingBalance + eventTingBalance;
    if (available < 5) {
      setViewModalItem(null);
      setShortageVisible(true);
      return;
    }

    setTingBalance(prev => Math.max(0, prev - 5));
    setPurchasedHighScoreIds(prev =>
      prev.includes(viewModalItem.id) ? prev : [...prev, viewModalItem.id],
    );
    const item = viewModalItem;
    setViewModalItem(null);
    openProfile(item);
  };

  const statusText = (status?: InterestStatus) => {
    if (status === 'ACCEPTED') return '수락';
    if (status === 'REJECTED') return '거절';
    return '대기';
  };

  const renderAvatar = (
    item: InterestItem,
    opts?: { blurProfile?: boolean; blurName?: boolean },
  ) => (
    <TouchableOpacity
      key={item.id}
      style={styles.avatarItem}
      activeOpacity={0.88}
      onPress={() => handlePressAvatar(item)}
    >
      <View style={styles.avatarWrap}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.avatar} blurRadius={opts?.blurProfile ? 14 : 0} />
        ) : (
          <View style={styles.avatarEmpty}>
            {item.isLoveView ? <Text style={styles.lvBadge}>LV</Text> : null}
          </View>
        )}
      </View>
      <Text style={styles.avatarName}>{opts?.blurName ? blurNickname(item.nickname) : item.nickname}</Text>
      {item.kind !== 'HIGH_SCORE' ? <Text style={styles.messageMark}>💬</Text> : null}

      {tab === 'sent' && item.status ? (
        <Text style={[styles.statusPill, item.status === 'REJECTED' && styles.statusRejected]}>
          {statusText(item.status)}
        </Text>
      ) : null}

      {tab === 'sent' && item.status === 'ACCEPTED' ? (
        <TouchableOpacity
          style={styles.actionSmallBtn}
          onPress={() => navigation.navigate('MainTabs', { screen: 'chat' })}
        >
          <Text style={styles.actionSmallBtnText}>채팅방으로</Text>
        </TouchableOpacity>
      ) : null}
      {tab === 'sent' && item.status === 'REJECTED' ? (
        <TouchableOpacity style={styles.actionSmallBtn} onPress={() => setRejectModalItem(item)}>
          <Text style={styles.actionSmallBtnText}>거절 사유 보기</Text>
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );

  const vipActive = tingBalance >= 200;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.topTabs}>
        <TouchableOpacity onPress={() => setTab('received')}>
          <Text style={[styles.topTabText, tab === 'received' && styles.topTabActive]}>받은 관심</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('sent')}>
          <Text style={[styles.topTabText, tab === 'sent' && styles.topTabActive]}>보낸 관심</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.topBar}>
        <View style={styles.topRow}>
          {vipActive ? (
            <View style={[styles.chip, styles.vipChip]}>
              <Image source={vipBadgeImg} style={styles.chipIcon} />
              <Text style={styles.vipChipText}>VIP</Text>
            </View>
          ) : null}
          {isSubscribed ? (
            <View style={[styles.chip, styles.subChip]}>
              <Image source={subBadgeImg} style={styles.chipIcon} />
              <Text style={styles.subChipText}>SUB</Text>
            </View>
          ) : null}
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

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>관심 목록 불러오는 중...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>프로필</Text>

          <Text style={styles.subTitle}>메시지</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {messages.map(item => renderAvatar(item))}
          </ScrollView>
          {messages.length === 0 ? <View style={styles.emptyRowSpace} /> : null}

          <Text style={styles.subTitle}>호감</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {likes.map(item => renderAvatar(item))}
          </ScrollView>
          {likes.length === 0 ? <View style={styles.emptyRowSpace} /> : null}

          <Text style={styles.sectionTitle}>
            {tab === 'received' ? '나에게 높은 점수를 준 사람' : '내가 높은 점수를 준 사람'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {highScores.map(item =>
              renderAvatar(item, {
                blurProfile: tab === 'received' && !canOpenHighScoreProfile(item),
                blurName: tab === 'received' && !canOpenHighScoreProfile(item),
              }),
            )}
          </ScrollView>
          {highScores.length === 0 ? <View style={styles.emptyRowSpace} /> : null}
        </ScrollView>
      )}

      <Modal
        visible={!!viewModalItem}
        transparent
        animationType="fade"
        onRequestClose={() => setViewModalItem(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setViewModalItem(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>프로필 보기</Text>
              <TouchableOpacity onPress={() => setViewModalItem(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDesc}>이 회원의 프로필을 열람하시겠습니까?</Text>
            <View style={styles.modalBenefitRow}>
              {vipActive ? (
                <View style={[styles.chip, styles.vipChip]}>
                  <Image source={vipBadgeImg} style={styles.chipIcon} />
                  <Text style={styles.vipChipText}>VIP</Text>
                </View>
              ) : null}
              {isSubscribed ? (
                <View style={[styles.chip, styles.subChip]}>
                  <Image source={subBadgeImg} style={styles.chipIcon} />
                  <Text style={styles.subChipText}>SUB</Text>
                </View>
              ) : null}
            </View>
            <TouchableOpacity style={styles.profileOpenBtn} onPress={handleConfirmViewProfile}>
              <Text style={styles.profileOpenText}>프로필 보기</Text>
              <View style={styles.pricePill}>
                <Image source={tingIconImg} style={styles.priceIcon} />
                <Text style={styles.priceText}>{hasFreeHighScoreView ? '0' : '5'}</Text>
              </View>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={!!rejectModalItem}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalItem(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setRejectModalItem(null)}>
          <Pressable style={[styles.modalCard, { maxWidth: 340 }]} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>거절 사유</Text>
              <TouchableOpacity onPress={() => setRejectModalItem(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.rejectIntro}>
              아쉽게도 이번에는 연결이 이어지지 않았어요.{'\n'}
              아래는 상대방이 선택한 거절 사유입니다.
            </Text>
            {(rejectModalItem?.rejectReason
              ? [rejectModalItem.rejectReason]
              : defaultRejectReasons
            ).map(v => (
              <Text key={v} style={styles.rejectReason}>{`· ${v}`}</Text>
            ))}
            <Text style={styles.rejectOutro}>
              모든 사람이 빛어지진 않지만, 더 좋은 만남이 분명 기다리고 있을 거예요.
            </Text>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={shortageVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setShortageVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShortageVisible(false)}>
          <Pressable style={[styles.modalCard, { maxWidth: 300 }]} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>팅 부족</Text>
              <TouchableOpacity onPress={() => setShortageVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDesc}>죄송합니다.{'\n'}팅이 부족하여 프로필을 열람하실 수 없습니다.</Text>
            <TouchableOpacity
              style={styles.storeBtn}
              onPress={() => {
                setShortageVisible(false);
                if (FEATURE_FLAGS.store) {
                  navigation.navigate('Store');
                }
              }}
            >
              <Text style={styles.storeBtnText}>
                {FEATURE_FLAGS.store ? '스토어로 이동' : '확인'}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  topTabs: {
    paddingHorizontal: 16,
    paddingTop: 10,
    flexDirection: 'row',
    gap: 14,
  },
  topTabText: { fontSize: 24, color: '#BABCC4', fontWeight: '900' },
  topTabActive: { color: '#111' },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
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
    gap: 4,
  },
  chipIcon: { width: 11, height: 11, resizeMode: 'contain' },
  vipChip: { backgroundColor: '#65008F' },
  subChip: { backgroundColor: '#FFE3EA', borderWidth: 1, borderColor: '#00000020' },
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
  balanceLine: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 1,
  },
  balanceIcon: { width: 19, height: 19, resizeMode: 'contain' },
  balanceNumber: { marginLeft: 10, fontSize: 16, fontWeight: '400', color: '#111' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 8, color: '#666', fontSize: 12 },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  sectionTitle: { marginTop: 16, fontSize: 24, fontWeight: '900', color: '#111' },
  subTitle: { marginTop: 10, fontSize: 17, fontWeight: '800', color: '#444' },
  row: { paddingTop: 8, paddingBottom: 4, gap: 12 },
  emptyRowSpace: { height: 74 },
  avatarItem: { alignItems: 'center', width: 74 },
  avatarWrap: { width: 68, height: 68, borderRadius: 34, overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },
  avatarEmpty: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    backgroundColor: '#F4EFEF',
    borderWidth: 1,
    borderColor: '#F0B9C2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lvBadge: {
    position: 'absolute',
    right: 6,
    top: 6,
    fontSize: 10,
    fontWeight: '900',
    color: '#D76379',
    backgroundColor: '#FFE6ED',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
  },
  avatarName: { marginTop: 6, fontSize: 16, fontWeight: '700', color: '#111' },
  messageMark: { fontSize: 14, marginTop: -1 },
  statusPill: {
    marginTop: 4,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 11,
    overflow: 'hidden',
    color: '#2D7D46',
    backgroundColor: '#E8F8ED',
    fontWeight: '800',
  },
  statusRejected: { color: '#CC4A5B', backgroundColor: '#FFE8EC' },
  actionSmallBtn: {
    marginTop: 4,
    backgroundColor: '#F7AFC0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9,
  },
  actionSmallBtnText: { fontSize: 10, color: '#FFF', fontWeight: '800' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalCard: { width: '100%', maxWidth: 290, backgroundColor: '#FFF', borderRadius: 12, padding: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 32, color: '#101B4D', fontWeight: '900' },
  modalClose: { fontSize: 32, color: '#333' },
  modalDesc: {
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 19,
    color: '#111',
    lineHeight: 28,
  },
  modalBenefitRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
  profileOpenBtn: {
    marginTop: 6,
    alignSelf: 'center',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F6B1BF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  profileOpenText: { fontSize: 18, fontWeight: '800', color: '#111' },
  pricePill: {
    minHeight: 30,
    borderRadius: 15,
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceIcon: { width: 14, height: 14, resizeMode: 'contain' },
  priceText: { fontSize: 18, fontWeight: '900', color: '#666' },
  rejectIntro: { marginTop: 10, fontSize: 13, lineHeight: 20, color: '#111', fontWeight: '700' },
  rejectReason: { marginTop: 8, fontSize: 13, color: '#111', fontWeight: '600' },
  rejectOutro: { marginTop: 12, fontSize: 13, lineHeight: 20, color: '#111', fontWeight: '700' },
  storeBtn: {
    marginTop: 10,
    alignSelf: 'center',
    width: 130,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F6B1BF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeBtnText: { fontSize: 16, fontWeight: '800', color: '#111' },
});
