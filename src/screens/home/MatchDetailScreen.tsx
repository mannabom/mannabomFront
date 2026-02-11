import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import {
  CheckTingWalletResponse,
  DrinkingHabit,
  MatchQuestionAnswer,
  MatchSource,
  ProfileMatchDetailResponse,
  SmokingHabit,
} from '../../types/DatingAPI';
import { datingApiService } from '../../services/DatingApiService';
import { drinkingHabitLabels, smokingHabitLabels } from '../../utils/DatingUtils';
import { API_BASE_URL } from '../../config/api';
import {
  clearSelectedGift,
  getSelectedGift,
  SelectedGift,
  setSelectedGift,
} from '../../utils/GiftSelectionStore';

const { width: SCREEN_W } = Dimensions.get('window');
const likeableImg = require('../../assets/images/likeable.png');
const interestImg = require('../../assets/images/interest.png');
const letterImg = require('../../assets/images/letter.png');
const tingIconImg = require('../../assets/images/Ting.png');

type DetailData = {
  nickname: string;
  age: number;
  region: string;
  smoking?: SmokingHabit;
  drinking?: DrinkingHabit;
  questionAnswers: MatchQuestionAnswer[];
  photos: { photoId: number; imageUrl: string; blind: boolean }[];
};

type ChoiceQA = {
  id: string;
  title: string;
  left: string;
  right: string;
  selected: 'LEFT' | 'RIGHT' | null;
};

const CHOICE_QUESTIONS = [
  { id: 'fight', title: '연인과 싸웠을 때', left: '바로 풀고 싶다', right: '시간을 좀 가지고 싶다', questionId: 8 },
  { id: 'photo', title: '연인과 함께한 사진', left: 'SNS에 공유해도 된다', right: 'SNS에 공유하기 싫다', questionId: 9 },
  { id: 'important', title: '연애에서 더 중요한 것은', left: '편안함', right: '설렘', questionId: 10 },
  { id: 'date', title: '연인과의 데이트에서', left: '실내에서 데이트하기', right: '실외에서 데이트하기', questionId: 11 },
  { id: 'jealousy', title: '연애에서 적당한 질투가', left: '있어야 재미있다', right: '쿨한 게 편하다', questionId: 12 },
  { id: 'idealDay', title: '연인과의 이상적인 하루는', left: '편한 일상 즐기기', right: '새로운 경험 해보기', questionId: 13 },
  { id: 'attracted', title: '연인에게 주로 끌리는 모습은', left: '배려심 넘치는 모습', right: '주도적인 모습', questionId: 14 },
  { id: 'friends', title: '연인이 내 친구들과', left: '어울리며 놀기', right: '따로 놀기', questionId: 15 },
] as const;

const CHOICE_CODE_TO_SIDE: Record<string, 'LEFT' | 'RIGHT'> = {
  CALM_AFTER_TIME: 'RIGHT',
  SOLVE_IMMEDIATELY: 'LEFT',
  SNS_SHARE_YES: 'LEFT',
  SNS_SHARE_NO: 'RIGHT',
  COMFORT: 'LEFT',
  EXCITEMENT: 'RIGHT',
  THRILL: 'RIGHT',
  INDOOR_DATE: 'LEFT',
  OUTDOOR_DATE: 'RIGHT',
  SLIGHT_JEALOUSY_OK: 'LEFT',
  COOL_AND_CALM: 'RIGHT',
  COMFY_DAILY: 'LEFT',
  ACTIVE_DATE: 'RIGHT',
  CONSIDERATE: 'LEFT',
  LEADERSHIP: 'RIGHT',
  HUMOR: 'RIGHT',
  MIX_WITH_FRIENDS: 'LEFT',
  KEEP_DISTANCE: 'RIGHT',
};

const normalizeQuestionKey = (value: string | undefined): string =>
  String(value ?? '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '');

const toAbsoluteUri = (uri: string | undefined): string => {
  const s = (uri ?? '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('/')) return `${API_BASE_URL}${s}`;
  return `${API_BASE_URL}/${s}`;
};

const parseDetail = (
  raw: ProfileMatchDetailResponse | any,
  previewName?: string,
  previewImageUrl?: string,
): DetailData => {
  const questionAnswers = Array.isArray(raw?.questionAnswers) ? raw.questionAnswers : [];
  const photosRaw = Array.isArray(raw?.photos) ? raw.photos : [];
  const photos = photosRaw
    .map((p: any) => ({
      photoId: Number(p?.photoId ?? 0),
      imageUrl: toAbsoluteUri(p?.imageUrl ?? p?.ImageUrl),
      blind: !!p?.blind,
    }))
    .filter((p: any) => p.photoId > 0 && !!p.imageUrl);

  if (!photos.length && previewImageUrl) {
    photos.push({ photoId: 0, imageUrl: previewImageUrl, blind: false });
  }

  return {
    nickname: String(raw?.nickname ?? raw?.nickName ?? previewName ?? '회원'),
    age: Number(raw?.age ?? 0),
    region: String(raw?.region ?? ''),
    smoking: raw?.smoking,
    drinking: raw?.drinking,
    questionAnswers,
    photos,
  };
};

const buildQuestionMap = (questionAnswers: MatchQuestionAnswer[]) => {
  const qaMap = new Map<string, string>();
  const qaIdMap = new Map<number, string>();

  questionAnswers.forEach((item: any) => {
    const answer = String(item?.answer ?? '').trim();
    if (!answer) return;
    const qObj = item?.question;
    const qText =
      typeof qObj === 'string'
        ? qObj
        : (qObj?.question as string) || '';
    const qId = Number(typeof qObj === 'object' ? qObj?.questionId : item?.questionId);

    if (qText) qaMap.set(normalizeQuestionKey(qText), answer);
    if (Number.isFinite(qId) && qId > 0) qaIdMap.set(qId, answer);
  });

  return { qaMap, qaIdMap };
};

export default function MatchDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const source: MatchSource = route.params?.source ?? 'PROFILE_MATCH';
  const targetProfileId: number = route.params?.targetProfileId ?? 0;

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [wallet, setWallet] = useState<CheckTingWalletResponse | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [unlockedPhotoIds, setUnlockedPhotoIds] = useState<number[]>([]);

  const [likeConfirmVisible, setLikeConfirmVisible] = useState(false);
  const [likeSuccessVisible, setLikeSuccessVisible] = useState(false);
  const [likeShortageVisible, setLikeShortageVisible] = useState(false);
  const [messageVisible, setMessageVisible] = useState(false);
  const [messageSuccessVisible, setMessageSuccessVisible] = useState(false);
  const [messageShortageVisible, setMessageShortageVisible] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [selectedGift, setSelectedGiftState] = useState<SelectedGift | null>(null);
  const [sendingLike, setSendingLike] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [walletRes, detailRes] = await Promise.all([
        datingApiService.getTingWalletInfo(),
        source === 'PROFILE_MATCH'
          ? datingApiService.getProfileDetail(targetProfileId)
          : datingApiService.getLoveViewDetail(targetProfileId),
      ]);
      setWallet(walletRes);
      setDetail(parseDetail(detailRes, route.params?.previewName, route.params?.previewImageUrl));
    } catch (e: any) {
      Alert.alert('오류', '상대 상세 프로필을 불러오지 못했어요.');
      console.warn('load match detail failed', e?.response?.data || e?.message || e);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [navigation, route.params?.previewImageUrl, route.params?.previewName, source, targetProfileId]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
      return undefined;
    }, [loadAll]),
  );

  useFocusEffect(
    useCallback(() => {
      const gift = getSelectedGift();
      if (gift) {
        setSelectedGiftState(gift);
        clearSelectedGift();
      }
      return undefined;
    }, []),
  );

  const { qaMap, qaIdMap } = useMemo(
    () => buildQuestionMap(detail?.questionAnswers ?? []),
    [detail?.questionAnswers],
  );

  const findAnswer = useCallback(
    (candidates: string[], ids: number[] = []) => {
      for (const id of ids) {
        const v = qaIdMap.get(id);
        if (v) return v;
      }
      for (const c of candidates) {
        const v = qaMap.get(normalizeQuestionKey(c));
        if (v) return v;
      }
      return '아직 작성된 답변이 없어요.';
    },
    [qaIdMap, qaMap],
  );

  const choiceQA: ChoiceQA[] = useMemo(() => {
    return CHOICE_QUESTIONS.map(q => {
      const answer = findAnswer([q.title, `${q.title}?`], [q.questionId]);
      const byCode = CHOICE_CODE_TO_SIDE[answer];
      const selected: 'LEFT' | 'RIGHT' | null =
        byCode ??
        (answer === q.left ? 'LEFT' : answer === q.right ? 'RIGHT' : null);
      return { id: q.id, title: q.title, left: q.left, right: q.right, selected };
    });
  }, [findAnswer]);

  const isProfileSource = source === 'PROFILE_MATCH';
  const photos = detail?.photos ?? [];
  const activePhoto = photos[activePhotoIndex];
  const isLockedPhoto =
    isProfileSource &&
    !!activePhoto &&
    activePhoto.blind &&
    activePhoto.photoId > 0 &&
    !unlockedPhotoIds.includes(activePhoto.photoId);

  const likeCost = 20;
  const messageBaseCost = 40;
  const messageCost = messageBaseCost + (selectedGift?.price ?? 0);
  const freeLikeLeft = wallet?.freeLikeNum ?? 0;
  const freeMessageLeft = wallet?.freeMessageNum ?? 0;
  const availableTing = (wallet?.tingNum ?? 0) + (wallet?.eventTingNum ?? 0);

  const handleUnlockPhoto = async () => {
    if (!activePhoto || !isLockedPhoto) return;
    try {
      const res = await datingApiService.unlockExtraPhoto(targetProfileId, activePhoto.photoId);
      setUnlockedPhotoIds(prev => [...prev, activePhoto.photoId]);
      setWallet(prev =>
        prev
          ? { ...prev, tingNum: res.tingRemains, eventTingNum: res.eventTingRemains }
          : prev,
      );
    } catch {
      setLikeShortageVisible(true);
    }
  };

  const handleSendLike = async () => {
    if (sendingLike) return;
    if (freeLikeLeft <= 0 && availableTing < likeCost) {
      setLikeConfirmVisible(false);
      setLikeShortageVisible(true);
      return;
    }
    try {
      setSendingLike(true);
      const nextWallet = await datingApiService.sendLike(targetProfileId, source);
      setWallet(nextWallet);
      setLikeConfirmVisible(false);
      setLikeSuccessVisible(true);
    } catch {
      setLikeConfirmVisible(false);
      setLikeShortageVisible(true);
    } finally {
      setSendingLike(false);
    }
  };

  const handleSendMessage = async () => {
    if (sendingMessage) return;
    if (!messageText.trim()) {
      Alert.alert('안내', '메시지를 입력해 주세요.');
      return;
    }
    if (freeMessageLeft <= 0 && availableTing < messageCost) {
      setMessageVisible(false);
      setMessageShortageVisible(true);
      return;
    }
    try {
      setSendingMessage(true);
      const nextWallet = await datingApiService.sendMessage(targetProfileId, messageText.trim(), source);
      setWallet(nextWallet);
      setMessageText('');
      setSelectedGiftState(null);
      setSelectedGift(null);
      setMessageVisible(false);
      setMessageSuccessVisible(true);
    } catch {
      setMessageVisible(false);
      setMessageShortageVisible(true);
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading || !detail) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  const nameLine = `${detail.nickname}${detail.age ? `(${detail.age})` : ''}`;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{isProfileSource ? '프로필' : '연애관 프로필'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isProfileSource ? (
          <View style={styles.heroWrap}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={e => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
                setActivePhotoIndex(Math.max(0, Math.min(idx, Math.max(0, photos.length - 1))));
              }}
            >
              {(photos.length ? photos : [{ photoId: 0, imageUrl: route.params?.previewImageUrl ?? '', blind: false }]).map(
                item => (
                  <Image key={`${item.photoId}-${item.imageUrl}`} source={{ uri: item.imageUrl }} style={styles.heroImage} />
                ),
              )}
            </ScrollView>

            <View style={styles.photoDots}>
              {(photos.length ? photos : [1]).map((_, idx) => (
                <View key={idx} style={[styles.dot, idx === activePhotoIndex && styles.dotActive]} />
              ))}
            </View>

            {isLockedPhoto && (
              <View style={styles.lockOverlay}>
                <TouchableOpacity style={styles.lockCostBadge} onPress={handleUnlockPhoto} activeOpacity={0.9}>
                  <Image source={tingIconImg} style={styles.lockCostIcon} />
                  <Text style={styles.lockCostText}>5</Text>
                </TouchableOpacity>
                <Text style={styles.lockOverlayText}>
                  결제를 하시거나{'\n'}프로필 사진을 추가로 업로드 하시면{'\n'}무료로 열람이 가능합니다.
                </Text>
              </View>
            )}
          </View>
        ) : null}

        <View style={styles.infoCard}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{nameLine}</Text>
            <View style={styles.actionBtns}>
              <TouchableOpacity
                style={[styles.iconSquare, styles.messageSquare]}
                onPress={() => setMessageVisible(true)}
              >
                <Image source={likeableImg} style={styles.actionIcon} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconSquare, styles.likeSquare]}
                onPress={() => setLikeConfirmVisible(true)}
              >
                <Image source={interestImg} style={styles.actionIcon} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.metaText}>📍 {detail.region || '지역 정보 없음'}</Text>
          <Text style={styles.metaText}>🚭 {smokingHabitLabels[detail.smoking ?? SmokingHabit.NON_SMOKER]}</Text>
          <Text style={styles.metaText}>🍷 {drinkingHabitLabels[detail.drinking ?? DrinkingHabit.NON_DRINKER]}</Text>
          <Text style={styles.reportText}>신고 횟수: 0</Text>
        </View>

        <View style={styles.qaSection}>
          <Image source={letterImg} style={styles.letterWatermark} />

          <View style={styles.qaBlock}>
            <Text style={styles.qTitle}>자기소개</Text>
            <Text style={styles.answer}>
              {findAnswer(['자기소개', '자기소개 (필수)'], [1])}
            </Text>
          </View>
          <View style={styles.qaDivider} />

          <View style={styles.qaBlock}>
            <Text style={styles.qTitle}>연인에게 바라는 한 가지는?</Text>
            <Text style={styles.answer}>
              {findAnswer(['연인에게 꼭 바라는 한 가지는? (필수)', '연인에게 바라는 한 가지는?'], [3])}
            </Text>
          </View>
          <View style={styles.qaDivider} />

          <View style={styles.qaBlock}>
            <Text style={styles.qTitle}>나를 설레게 하는 이성의 매력</Text>
            <Text style={styles.answer}>
              {findAnswer(['나를 설레게 하는 이성의 매력? (필수)', '나를 설레게 하는 이성의 매력?'], [2])}
            </Text>
          </View>
          <View style={styles.qaDivider} />

          <View style={styles.qaBlock}>
            <Text style={styles.qTitle}>나에게 연애란 어떤 의미인가요?</Text>
            <Text style={styles.answer}>
              {findAnswer(['나에게 연애란? (선택)', '나에게 연애란?'], [4])}
            </Text>
          </View>
          <View style={styles.qaDivider} />

          <View style={styles.qaBlock}>
            <Text style={styles.qTitle}>나의 하루 그리고 나의 휴일은?</Text>
            <Text style={styles.answer}>
              {findAnswer(['나의 하루, 그리고 나의 휴일은? (선택)', '나의 하루, 그리고 나의 휴일은?'], [6])}
            </Text>
          </View>
          <View style={styles.qaDivider} />

          <View style={styles.qaBlock}>
            {choiceQA.map(item => (
              <View key={item.id} style={styles.choiceBlock}>
                <Text style={styles.choiceTitle}>{item.title}</Text>
                <View style={styles.choiceRow}>
                  <View style={[styles.choiceBtn, item.selected === 'LEFT' ? styles.choiceSelected : styles.choiceIdle]}>
                    <Text style={styles.choiceText}>{item.left}</Text>
                  </View>
                  <Text style={styles.vsText}>VS</Text>
                  <View style={[styles.choiceBtn, item.selected === 'RIGHT' ? styles.choiceSelected : styles.choiceIdle]}>
                    <Text style={styles.choiceText}>{item.right}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <Modal visible={likeConfirmVisible} transparent animationType="fade" onRequestClose={() => setLikeConfirmVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setLikeConfirmVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>호감 보내기</Text>
              <TouchableOpacity onPress={() => setLikeConfirmVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalMessage}>
              이 회원에게 호감을 보내시겠어요?{'\n'}상대방에게 알림이 가요!
            </Text>
            <TouchableOpacity style={styles.pinkActionBtn} onPress={handleSendLike} disabled={sendingLike}>
              <Text style={styles.pinkActionText}>{sendingLike ? '전송 중...' : '호감보내기'}</Text>
              <View style={styles.costPill}>
                {freeLikeLeft > 0 ? (
                  <Text style={styles.costText}>무료</Text>
                ) : (
                  <>
                    <Image source={tingIconImg} style={styles.costIcon} />
                    <Text style={styles.costText}>{likeCost}</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={likeSuccessVisible} transparent animationType="fade" onRequestClose={() => setLikeSuccessVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setLikeSuccessVisible(false)}>
          <Pressable style={styles.modalCardSmall} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>호감 보내기</Text>
              <TouchableOpacity onPress={() => setLikeSuccessVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDoneText}>전송이 완료되었습니다!</Text>
            <TouchableOpacity style={styles.pinkDoneBtn} onPress={() => setLikeSuccessVisible(false)}>
              <Text style={styles.pinkDoneText}>확인하러 가기</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={likeShortageVisible} transparent animationType="fade" onRequestClose={() => setLikeShortageVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setLikeShortageVisible(false)}>
          <Pressable style={styles.modalCardSmall} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>팅 부족</Text>
              <TouchableOpacity onPress={() => setLikeShortageVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalMessage}>죄송합니다.{'\n'}팅이 부족하여 호감을{'\n'}보낼 수 없습니다.</Text>
            <TouchableOpacity
              style={styles.pinkDoneBtn}
              onPress={() => {
                setLikeShortageVisible(false);
                navigation.navigate('Store');
              }}
            >
              <Text style={styles.pinkDoneText}>스토어로 이동</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={messageVisible} transparent animationType="fade" onRequestClose={() => setMessageVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setMessageVisible(false)}>
          <Pressable style={styles.messageModalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>메시지 보내기</Text>
              <TouchableOpacity onPress={() => setMessageVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.messageInputWrap}>
              <TextInput
                style={styles.messageInput}
                multiline
                value={messageText}
                onChangeText={setMessageText}
                placeholder="자유롭게 입력해주세요."
                placeholderTextColor="#B9B9B9"
              />
              <Image source={letterImg} style={styles.messageLetter} />
              {selectedGift ? (
                <View style={styles.giftTag}>
                  <Text style={styles.giftTagText}>{`선물 - ${selectedGift.title} ${selectedGift.price}`}</Text>
                  <TouchableOpacity onPress={() => setSelectedGiftState(null)}>
                    <Text style={styles.giftTagX}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            <View style={styles.messageActions}>
              <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage} disabled={sendingMessage}>
                <Text style={styles.sendBtnText}>{sendingMessage ? '전송 중...' : '보내기'}</Text>
                <View style={styles.costPill}>
                  {freeMessageLeft > 0 ? (
                    <Text style={styles.costText}>{`${Math.min(10, freeMessageLeft)}회 남음`}</Text>
                  ) : (
                    <>
                      <Image source={tingIconImg} style={styles.costIcon} />
                      <Text style={styles.costText}>{messageCost}</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.giftBtn}
                onPress={() => navigation.navigate('Store', { pickGiftMode: true })}
              >
                <Text style={styles.giftBtnIcon}>🎁</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={messageSuccessVisible} transparent animationType="fade" onRequestClose={() => setMessageSuccessVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setMessageSuccessVisible(false)}>
          <Pressable style={styles.modalCardSmall} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>메시지 보내기</Text>
              <TouchableOpacity onPress={() => setMessageSuccessVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDoneText}>전송이 완료되었습니다</Text>
            <TouchableOpacity style={styles.pinkDoneBtn} onPress={() => setMessageSuccessVisible(false)}>
              <Text style={styles.pinkDoneText}>확인하러 가기</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={messageShortageVisible} transparent animationType="fade" onRequestClose={() => setMessageShortageVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setMessageShortageVisible(false)}>
          <Pressable style={styles.modalCardSmall} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>팅 부족</Text>
              <TouchableOpacity onPress={() => setMessageShortageVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalMessage}>죄송합니다.{'\n'}팅이 부족하여 메시지를{'\n'}보낼 수 없습니다.</Text>
            <TouchableOpacity
              style={styles.pinkDoneBtn}
              onPress={() => {
                setMessageShortageVisible(false);
                navigation.navigate('Store');
              }}
            >
              <Text style={styles.pinkDoneText}>스토어로 이동</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    height: 56,
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  headerTitle: { fontSize: 42, fontWeight: '900', color: '#101B4D' },
  scrollContent: { paddingBottom: 24 },

  heroWrap: { width: SCREEN_W, height: 520, backgroundColor: '#EDEDED' },
  heroImage: { width: SCREEN_W, height: 520, resizeMode: 'cover' },
  photoDots: { position: 'absolute', top: 14, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF88', marginHorizontal: 4 },
  dotActive: { backgroundColor: '#FFFFFF' },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockCostBadge: {
    minWidth: 110,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    gap: 8,
  },
  lockCostIcon: { width: 26, height: 26, resizeMode: 'contain' },
  lockCostText: { fontSize: 42, fontWeight: '900', color: '#111' },
  lockOverlayText: {
    fontSize: 17,
    lineHeight: 26,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '700',
  },

  infoCard: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#E8E8E8' },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 22, fontWeight: '900', color: '#111', flexShrink: 1, marginRight: 12 },
  actionBtns: { flexDirection: 'row', gap: 8 },
  iconSquare: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageSquare: { backgroundColor: '#F5E7B3' },
  likeSquare: { backgroundColor: '#FFB6C1' },
  actionIcon: { width: 22, height: 22, resizeMode: 'contain' },
  metaText: { marginTop: 4, fontSize: 13, color: '#111', fontWeight: '700' },
  reportText: { alignSelf: 'flex-end', marginTop: 4, color: '#333', fontSize: 12 },

  qaSection: { position: 'relative', backgroundColor: '#F8F8F8' },
  letterWatermark: {
    position: 'absolute',
    width: 220,
    height: 220,
    resizeMode: 'contain',
    top: 130,
    right: 26,
    opacity: 0.25,
  },
  qaBlock: { paddingHorizontal: 16, paddingVertical: 18 },
  qaDivider: { height: 1, backgroundColor: '#E7E7E7' },
  qTitle: { fontSize: 20, fontWeight: '900', color: '#111', marginBottom: 10 },
  answer: { fontSize: 16, color: '#222', lineHeight: 28, fontWeight: '500' },

  choiceBlock: { marginBottom: 16 },
  choiceTitle: { fontSize: 14, fontWeight: '800', textAlign: 'center', color: '#111', marginBottom: 8 },
  choiceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  choiceBtn: {
    flex: 1,
    minHeight: 36,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceIdle: { backgroundColor: '#FFF', borderColor: '#DADADA' },
  choiceSelected: { backgroundColor: '#F5BBC8', borderColor: '#E8AAB8' },
  choiceText: { fontSize: 11, fontWeight: '700', color: '#222' },
  vsText: { marginHorizontal: 10, fontSize: 12, fontWeight: '900', color: '#777' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', paddingHorizontal: 16 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16 },
  modalCardSmall: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, maxWidth: 360 },
  messageModalCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, color: '#101B4D', fontWeight: '900' },
  modalClose: { fontSize: 32, color: '#333' },
  modalMessage: { marginTop: 12, fontSize: 17, lineHeight: 28, color: '#111' },
  modalDoneText: { marginTop: 20, marginBottom: 16, textAlign: 'center', fontSize: 19, fontWeight: '700', color: '#111' },
  pinkActionBtn: {
    marginTop: 20,
    alignSelf: 'center',
    minWidth: 170,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F5B3C2',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pinkActionText: { fontSize: 17, fontWeight: '800', color: '#111' },
  costPill: {
    minHeight: 34,
    borderRadius: 18,
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  costIcon: { width: 18, height: 18, resizeMode: 'contain' },
  costText: { fontSize: 16, fontWeight: '900', color: '#111' },
  pinkDoneBtn: {
    marginTop: 10,
    alignSelf: 'center',
    minWidth: 160,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F5B3C2',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  pinkDoneText: { fontSize: 18, fontWeight: '800', color: '#111' },

  messageInputWrap: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#B7B7B7',
    borderRadius: 22,
    minHeight: 156,
    overflow: 'hidden',
  },
  messageInput: {
    minHeight: 130,
    paddingHorizontal: 18,
    paddingTop: 18,
    fontSize: 20,
    color: '#111',
  },
  messageLetter: {
    position: 'absolute',
    width: 56,
    height: 56,
    right: 8,
    bottom: 8,
    resizeMode: 'contain',
    opacity: 0.95,
  },
  giftTag: {
    height: 32,
    backgroundColor: '#F4C2CC',
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  giftTagText: { fontSize: 12, fontWeight: '700', color: '#111', maxWidth: '90%' },
  giftTagX: { fontSize: 18, fontWeight: '900', color: '#111' },
  messageActions: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sendBtn: {
    width: 186,
    height: 68,
    borderRadius: 18,
    backgroundColor: '#F5B3C2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  sendBtnText: { fontSize: 20, fontWeight: '800', color: '#111' },
  giftBtn: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: '#F5E7B3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftBtnIcon: { fontSize: 34 },
});
