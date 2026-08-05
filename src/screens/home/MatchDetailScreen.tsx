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
import { FEATURE_FLAGS } from '../../config/features';
import {
  clearSelectedGift,
  getSelectedGift,
  SelectedGift,
  setSelectedGift,
} from '../../utils/GiftSelectionStore';
import { toExternalId } from '../../utils/IdUtils';

const { width: SCREEN_W } = Dimensions.get('window');
const likeableImg = require('../../assets/images/likeable.png');
const interestImg = require('../../assets/images/interest.png');
const letterImg = require('../../assets/images/letter.png');
const letter2Img = require('../../assets/images/Letter2.png');
const giftImg = require('../../assets/images/Gift.png');
const tingIconImg = require('../../assets/images/Ting.png');

type DetailData = {
  nickname: string;
  age: number;
  mbti: string;
  height?: number;
  bodyType?: string;
  university: string;
  region: string;
  smoking?: SmokingHabit;
  drinking?: DrinkingHabit;
  questionAnswers: MatchQuestionAnswer[];
  photos: { photoId?: string; imageUrl: string; blind: boolean }[];
};

type ChoiceQA = {
  id: string;
  title: string;
  left: string;
  right: string;
  selected: 'LEFT' | 'RIGHT' | null;
};

const CHOICE_QUESTIONS = [
  { id: 'fight', title: '연인과 싸웠을 때', left: '바로 풀고 싶다', right: '시간을 좀 가지고 싶다', questionId: '8', keywords: ['싸웠을', '다퉜', '갈등'] },
  { id: 'photo', title: '연인과 함께한 사진', left: 'SNS에 공유해도 된다', right: 'SNS에 공유하기 싫다', questionId: '9', keywords: ['함께한사진', '사진', 'sns'] },
  { id: 'important', title: '연애에서 더 중요한 것은', left: '편안함', right: '설렘', questionId: '10', keywords: ['중요한것', '중요한것은', '연애에서더중요'] },
  { id: 'date', title: '연인과의 데이트에서', left: '실내에서 데이트하기', right: '실외에서 데이트하기', questionId: '11', keywords: ['데이트', '실내', '실외'] },
  { id: 'jealousy', title: '연애에서 적당한 질투가', left: '있어야 재미있다', right: '쿨한 게 편하다', questionId: '12', keywords: ['질투', '쿨한게편하다'] },
  { id: 'idealDay', title: '연인과의 이상적인 하루는', left: '편한 일상 즐기기', right: '새로운 경험 해보기', questionId: '13', keywords: ['이상적인하루', '하루는', '휴일'] },
  { id: 'attracted', title: '연인에게 주로 끌리는 모습은', left: '배려심 넘치는 모습', right: '주도적인 모습', questionId: '14', keywords: ['끌리는모습', '매력', '주로끌리는'] },
  { id: 'friends', title: '연인이 내 친구들과', left: '어울리며 놀기', right: '따로 놀기', questionId: '15', keywords: ['친구들과', '친구', '어울리며'] },
] as const;

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
  HUMOR: 'RIGHT',
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

const isInsufficientTingError = (e: any): boolean => {
  const status = e?.response?.status;
  const message = String(e?.response?.data?.message ?? '').toLowerCase();
  if (status === 402) return true;
  return message.includes('팅') && (message.includes('부족') || message.includes('없'));
};

const isAlreadyRequestedError = (e: any): boolean => {
  const status = e?.response?.status;
  const message = String(e?.response?.data?.message ?? '');
  if (status !== 400) return false;
  return message.includes('이미 요청');
};

const BODY_TYPE_LABELS: Record<string, string> = {
  SLIM: '마름',
  AVERAGE: '보통',
  CHUBBY: '통통',
};

const normalizeQuestionKey = (value: string | undefined): string =>
  String(value ?? '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '');

const cleanQuestionTitle = (value: string | undefined): string => {
  let s = String(value ?? '').trim();
  if (!s) return '';

  // 제목 끝에 붙은 보조 문구 "(필수)", "(선택)", "(선택, 5포인트 팅)" 등을 반복 제거
  while (true) {
    const next = s
      .replace(/\s*[\(\[\{（【]\s*[^)\]\}）】]*\s*[\)\]\}）】]\s*$/u, '')
      .trim();
    if (next === s) break;
    s = next;
  }

  return s;
};

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
  previewMbti?: string,
  previewImageUrl?: string,
): DetailData => {
  const questionAnswersRaw =
    raw?.questionAnswers ??
    raw?.questionAnswerList ??
    raw?.answers ??
    raw?.data?.questionAnswers ??
    raw?.data?.questionAnswerList ??
    raw?.profile?.questionAnswers ??
    raw?.profile?.questionAnswerList ??
    [];

  const questionAnswers = Array.isArray(questionAnswersRaw) ? questionAnswersRaw : [];
  const photosRaw = Array.isArray(raw?.photos) ? raw.photos : [];
  const photos = photosRaw
    .map((p: any) => ({
      photoId: toExternalId(p?.photoId ?? p?.id) ?? undefined,
      imageUrl: toAbsoluteUri(p?.imageUrl ?? p?.ImageUrl),
      blind: !!p?.blind,
    }))
    .filter((p: any) => !!p.imageUrl);

  if (!photos.length && previewImageUrl) {
    photos.push({ imageUrl: previewImageUrl, blind: false });
  }

  const regionText = String(raw?.region ?? '').trim();
  const regionSido = String(raw?.regionSido ?? raw?.region?.sido ?? '').trim();
  const regionSigungu = String(raw?.regionSigungu ?? raw?.region?.sigungu ?? '').trim();
  const mergedRegion = [regionSido, regionSigungu].filter(Boolean).join(' ').trim();

  return {
    nickname: String(raw?.nickname ?? raw?.nickName ?? previewName ?? '회원'),
    age: Number(raw?.age ?? 0),
    mbti: String(raw?.mbti ?? raw?.MBTI ?? previewMbti ?? ''),
    height:
      Number(
        raw?.height ??
          raw?.profile?.height ??
          raw?.userProfile?.height ??
          0,
      ) || undefined,
    bodyType: String(
      raw?.bodyType ??
        raw?.bodyShape ??
        raw?.physique ??
        raw?.profile?.bodyType ??
        raw?.profile?.bodyShape ??
        raw?.userProfile?.bodyType ??
        '',
    ),
    university: String(
      raw?.university ??
        raw?.universityName ??
        raw?.school ??
        raw?.schoolName ??
        raw?.college ??
        raw?.profile?.university ??
        raw?.profile?.universityName ??
        raw?.profile?.school ??
        raw?.profile?.schoolName ??
        raw?.userProfile?.university ??
        '',
    ),
    region: regionText || mergedRegion,
    smoking: raw?.smoking ?? raw?.smokingHabit,
    drinking: raw?.drinking ?? raw?.drinkingHabit,
    questionAnswers,
    photos,
  };
};

export default function MatchDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const source: MatchSource = route.params?.source ?? 'PROFILE_MATCH';
  const targetProfileId = toExternalId(route.params?.targetProfileId);

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [wallet, setWallet] = useState<CheckTingWalletResponse | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [unlockedPhotoIds, setUnlockedPhotoIds] = useState<string[]>([]);

  const [likeConfirmVisible, setLikeConfirmVisible] = useState(false);
  const [likeSuccessVisible, setLikeSuccessVisible] = useState(false);
  const [likeShortageVisible, setLikeShortageVisible] = useState(false);
  const [messageVisible, setMessageVisible] = useState(false);
  const [messageSuccessVisible, setMessageSuccessVisible] = useState(false);
  const [messageShortageVisible, setMessageShortageVisible] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [selectedGift, setSelectedGiftState] = useState<SelectedGift | null>(null);
  const [likedAlreadySent, setLikedAlreadySent] = useState<boolean>(
    !!route.params?.initialLikedSent,
  );
  const [messagedAlreadySent, setMessagedAlreadySent] = useState<boolean>(
    !!route.params?.initialMessagedSent,
  );
  const [sentMessagePreview, setSentMessagePreview] = useState<string>(
    String(route.params?.initialSentMessage ?? ''),
  );
  const [sentGiftPreview, setSentGiftPreview] = useState<string>(
    String(route.params?.initialSentGiftName ?? ''),
  );
  const [sentGiftVisible, setSentGiftVisible] = useState(false);
  const [sendingLike, setSendingLike] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const handleBackPress = useCallback(() => {
    if (navigation.canGoBack?.()) {
      navigation.goBack();
      return;
    }
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', params: { screen: 'interest' } }],
    });
  }, [navigation]);

  const loadAll = useCallback(async () => {
    if (!targetProfileId) {
      Alert.alert('오류', '상대 프로필 ID를 확인할 수 없어요.');
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      const [walletRes, detailRes] = await Promise.all([
        datingApiService.getTingWalletInfo(),
        source === 'PROFILE_MATCH'
          ? datingApiService.getProfileDetail(targetProfileId)
          : datingApiService.getLoveViewDetail(targetProfileId),
      ]);
      setWallet(walletRes);
      setDetail(
        parseDetail(
          detailRes,
          route.params?.previewName,
          route.params?.previewMbti,
          route.params?.previewImageUrl,
        ),
      );
      const detailAny: any = detailRes;
      const likeSentByApi = Boolean(
        detailAny?.liked?.sent ??
          detailAny?.liked?.isSent ??
          detailAny?.likeSent ??
          detailAny?.isLikeSent ??
          false,
      );
      const messageSentByApi = Boolean(
        detailAny?.messaged?.sent ??
          detailAny?.messaged?.isSent ??
          detailAny?.messageSent ??
          detailAny?.isMessageSent ??
          false,
      );
      const sentMessageByApi = String(
        detailAny?.messaged?.message ??
          detailAny?.message ??
          detailAny?.sentMessage ??
          route.params?.initialSentMessage ??
          '',
      );
      const sentGiftByApi = String(
        detailAny?.messaged?.giftName ??
          detailAny?.giftName ??
          detailAny?.sentGiftName ??
          route.params?.initialSentGiftName ??
          '',
      );

      setLikedAlreadySent(prev => prev || likeSentByApi);
      setMessagedAlreadySent(prev => prev || messageSentByApi);
      setSentMessagePreview(sentMessageByApi);
      setSentGiftPreview(sentGiftByApi);
    } catch (e: any) {
      Alert.alert('오류', '상대 상세 프로필을 불러오지 못했어요.');
      if (__DEV__) {
        console.warn(
          'load match detail failed',
          e?.response?.status,
          e?.message ?? 'unknown error',
        );
      }
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [
    navigation,
    route.params?.previewImageUrl,
    route.params?.previewMbti,
    route.params?.previewName,
    route.params?.initialSentGiftName,
    route.params?.initialSentMessage,
    source,
    targetProfileId,
  ]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
      return undefined;
    }, [loadAll]),
  );

  useFocusEffect(
    useCallback(() => {
      const gift = getSelectedGift();
      if (gift && FEATURE_FLAGS.gifticon) {
        setSelectedGiftState(gift);
        clearSelectedGift();
      } else if (gift) {
        clearSelectedGift();
      }
      return undefined;
    }, []),
  );

  const normalizedQAs = useMemo(() => {
    const rawList = Array.isArray(detail?.questionAnswers) ? detail.questionAnswers : [];
    return rawList
      .map((item: any, idx: number) => {
        const qObj = item?.question;
        const qText =
          typeof qObj === 'string'
            ? qObj
            : (qObj?.question as string) || '';
        const qId =
          toExternalId(
            typeof qObj === 'object' ? qObj?.questionId : item?.questionId,
          ) ?? undefined;
        const qType =
          String(
            (typeof qObj === 'object' ? qObj?.questionType : item?.questionType) ?? '',
          ).toUpperCase();
        const answer = String(
          item?.answer ??
          item?.content ??
          item?.value ??
          item?.answerText ??
          '',
        ).trim();

        return {
          key: `${qId ?? 'q'}-${idx}`,
          qId,
          qType,
          title: cleanQuestionTitle(qText || `질문 ${idx + 1}`),
          answer,
        };
      })
      .filter(v => !!v.title);
  }, [detail?.questionAnswers]);

  const choiceQA: ChoiceQA[] = useMemo(() => {
    const resolved: ChoiceQA[] = [];

    normalizedQAs.forEach(item => {
      const isChoiceType = item.qType.includes('CHOICE');
      const isChoiceById = !!item.qId &&
        ['8', '9', '10', '11', '12', '13', '14', '15'].includes(item.qId);
      if (!isChoiceType && !isChoiceById) return;

      const normTitle = normalizeQuestionKey(item.title);
      const template = CHOICE_QUESTIONS.find(q => {
        if (item.qId && item.qId === q.questionId) return true;
        if (normTitle.includes(normalizeQuestionKey(q.title))) return true;
        return q.keywords.some(k => normTitle.includes(normalizeQuestionKey(k)));
      });
      if (!template) return;

      const byCode = getChoiceSideByCode(item.answer);
      const selected: 'LEFT' | 'RIGHT' | null =
        byCode ??
        (item.answer === template.left ? 'LEFT' : item.answer === template.right ? 'RIGHT' : null);

      resolved.push({
        id: item.key,
        title: item.title,
        left: template.left,
        right: template.right,
        selected,
      });
    });

    return resolved;
  }, [normalizedQAs]);

  const freeTextQAs = useMemo(() => {
    const choiceKeySet = new Set(choiceQA.map(v => v.id));
    return normalizedQAs.filter(v => !choiceKeySet.has(v.key));
  }, [choiceQA, normalizedQAs]);

  const isProfileSource = source === 'PROFILE_MATCH';
  const photos = detail?.photos ?? [];
  const activePhoto = photos[activePhotoIndex];
  const isLockedPhoto =
    isProfileSource &&
    !!activePhoto &&
    activePhoto.blind &&
    !!activePhoto.photoId &&
    !unlockedPhotoIds.includes(activePhoto.photoId);

  const likeCost = 20;
  const messageBaseCost = 40;
  const messageCost =
    messageBaseCost +
    (FEATURE_FLAGS.gifticon ? selectedGift?.price ?? 0 : 0);
  const freeLikeLeft = wallet?.freeLikeNum ?? 0;
  const freeMessageLeft = wallet?.freeMessageNum ?? 0;
  const availableTing = (wallet?.tingNum ?? 0) + (wallet?.eventTingNum ?? 0);

  const handleUnlockPhoto = async () => {
    if (!targetProfileId || !activePhoto?.photoId || !isLockedPhoto) return;
    const photoId = activePhoto.photoId;
    try {
      const res = await datingApiService.unlockExtraPhoto(targetProfileId, photoId);
      setUnlockedPhotoIds(prev => [...prev, photoId]);
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
    if (!targetProfileId) return;
    if (likedAlreadySent) {
      Alert.alert('안내', '이미 호감을 보낸 상대입니다.');
      return;
    }
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
      setLikedAlreadySent(true);
      setLikeConfirmVisible(false);
      setLikeSuccessVisible(true);
    } catch (e: any) {
      setLikeConfirmVisible(false);
      if (isInsufficientTingError(e)) {
        setLikeShortageVisible(true);
        return;
      }
      const msg =
        String(e?.response?.data?.message ?? '').replace(/^'+|'+$/g, '') ||
        '호감 전송에 실패했어요. 잠시 후 다시 시도해 주세요.';
      Alert.alert('안내', msg);
    } finally {
      setSendingLike(false);
    }
  };

  const handleSendMessage = async () => {
    if (!targetProfileId) return;
    if (messagedAlreadySent) {
      setMessageVisible(true);
      return;
    }
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
      setMessagedAlreadySent(true);
      setSentMessagePreview(messageText.trim());
      setSentGiftPreview(
        FEATURE_FLAGS.gifticon ? selectedGift?.title ?? '' : '',
      );
      setMessageText('');
      setSelectedGiftState(null);
      setSelectedGift(null);
      setMessageVisible(false);
      setMessageSuccessVisible(true);
    } catch (e: any) {
      setMessageVisible(false);
      if (isInsufficientTingError(e)) {
        setMessageShortageVisible(true);
        return;
      }
      if (isAlreadyRequestedError(e)) {
        Alert.alert('안내', '이미 요청을 보낸 상대입니다.');
        return;
      }
      const msg =
        String(e?.response?.data?.message ?? '').replace(/^'+|'+$/g, '') ||
        '메시지 전송에 실패했어요. 잠시 후 다시 시도해 주세요.';
      Alert.alert('안내', msg);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleClearSelectedGift = () => {
    setSelectedGiftState(null);
    setSelectedGift(null);
    clearSelectedGift();
  };

  if (loading || !detail) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  const nameLine = `${detail.nickname}${detail.age ? `(${detail.age})` : ''}${detail.mbti ? `${detail.age ? ' ' : ''}${detail.mbti}` : ''}`;
  const heightText = detail.height ? `키 ${detail.height}cm` : '키 정보 없음';
  const bodyTypeText = detail.bodyType ? `체형 ${BODY_TYPE_LABELS[detail.bodyType] || detail.bodyType}` : '체형 정보 없음';
  const fromInterestTab = route.params?.fromInterestTab as 'received' | 'sent' | undefined;
  const interestEntryKind = route.params?.interestEntryKind as
    | 'LIKE'
    | 'MESSAGE'
    | 'HIGH_SCORE'
    | undefined;
  const openedFromSentMessage = fromInterestTab === 'sent' && interestEntryKind === 'MESSAGE';
  const openedFromSentLike = fromInterestTab === 'sent' && interestEntryKind === 'LIKE';
  const hideLikeAction = openedFromSentMessage || openedFromSentLike;
  const isMessageReadOnly = openedFromSentMessage || (!openedFromSentLike && messagedAlreadySent);
  const messageActionIconSource = openedFromSentMessage ? letter2Img : likeableImg;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backBtn}
            activeOpacity={0.85}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backBtnText}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} pointerEvents="none">
            {isProfileSource ? '프로필' : '연애관 프로필'}
          </Text>
        </View>

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
              {(photos.length ? photos : [{ photoId: undefined, imageUrl: route.params?.previewImageUrl ?? '', blind: false }]).map(
                item => (
                  <Image
                    key={`${item.photoId ?? 'preview'}-${item.imageUrl}`}
                    source={{ uri: item.imageUrl }}
                    style={styles.heroImage}
                    blurRadius={
                      isProfileSource && item.blind && !!item.photoId && !unlockedPhotoIds.includes(item.photoId)
                        ? 16
                        : 0
                    }
                  />
                ),
              )}
            </ScrollView>

            <View style={styles.photoDots}>
              {(photos.length ? photos : [1]).map((_, idx) => (
                <View key={idx} style={[styles.dot, idx === activePhotoIndex && styles.dotActive]} />
              ))}
            </View>

            {isLockedPhoto && (
              <View style={styles.lockOverlay} pointerEvents="box-none">
                <TouchableOpacity style={styles.lockCostBadge} onPress={handleUnlockPhoto} activeOpacity={0.9}>
                  <Image source={tingIconImg} style={styles.lockCostIcon} />
                  <Text style={styles.lockCostText}>5</Text>
                </TouchableOpacity>
                <Text style={styles.lockOverlayText} pointerEvents="none">
                  팅을 사용하거나{'\n'}프로필 사진을 추가로 업로드 하시면{'\n'}열람할 수 있습니다.
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
                <Image source={messageActionIconSource} style={[styles.actionIcon, styles.messageActionIcon]} />
              </TouchableOpacity>
              {!hideLikeAction ? (
                <TouchableOpacity
                  style={[styles.iconSquare, styles.likeSquare]}
                  onPress={() => {
                    if (likedAlreadySent) {
                      Alert.alert('안내', '이미 호감을 보낸 상대입니다.');
                      return;
                    }
                    setLikeConfirmVisible(true);
                  }}
                >
                  <Image source={interestImg} style={styles.actionIcon} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <View style={styles.metaGridRow}>
            <Text style={styles.metaTextLeft}>🏫 {detail.university || '학교 정보 없음'}</Text>
            <View style={styles.metaRightCell} />
          </View>
          <View style={styles.metaGridRow}>
            <Text style={styles.metaTextLeft}>📍 {detail.region || '지역 정보 없음'}</Text>
            {isProfileSource ? <Text style={styles.metaTextRight}>{heightText}</Text> : <View style={styles.metaRightCell} />}
          </View>
          <View style={styles.metaGridRow}>
            <Text style={styles.metaTextLeft}>{smokingHabitLabels[detail.smoking ?? SmokingHabit.NON_SMOKER]}</Text>
            {isProfileSource ? <Text style={styles.metaTextRight}>{bodyTypeText}</Text> : <View style={styles.metaRightCell} />}
          </View>
          <View style={styles.metaGridRow}>
            <Text style={styles.metaTextLeft}>{drinkingHabitLabels[detail.drinking ?? DrinkingHabit.NON_DRINKER]}</Text>
            <View style={styles.metaRightCell} />
          </View>
          <Text style={styles.reportText}>신고 횟수: 0</Text>
        </View>

        <View style={styles.qaSection}>
          <Image source={letterImg} style={styles.letterWatermark} />
          {freeTextQAs.map((item, idx) => (
            <View key={`text-${item.key}`}>
              <View style={styles.qaBlock}>
                <Text style={styles.qTitle}>{item.title}</Text>
                <Text style={styles.answer}>{item.answer || '아직 작성된 답변이 없어요.'}</Text>
              </View>
              {idx !== freeTextQAs.length - 1 || choiceQA.length > 0 ? <View style={styles.qaDivider} /> : null}
            </View>
          ))}

          {choiceQA.length > 0 ? (
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
          ) : null}
          {freeTextQAs.length === 0 && choiceQA.length === 0 ? (
            <View style={styles.qaBlock}>
              <Text style={styles.answer}>아직 작성된 질문 답변이 없어요.</Text>
            </View>
          ) : null}
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
            <TouchableOpacity
              style={styles.pinkDoneBtn}
              onPress={() => {
                setLikeSuccessVisible(false);
                navigation.navigate('MainTabs', {
                  screen: 'interest',
                  params: { initialTab: 'sent' },
                });
              }}
            >
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
                if (FEATURE_FLAGS.store) {
                  navigation.navigate('Store');
                }
              }}
            >
              <Text style={styles.pinkDoneText}>
                {FEATURE_FLAGS.store ? '스토어로 이동' : '확인'}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={messageVisible} transparent animationType="fade" onRequestClose={() => setMessageVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setMessageVisible(false)}>
          <Pressable style={styles.messageModalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, styles.messageModalTitle]}>
                {isMessageReadOnly ? `${detail.nickname}님의 메시지` : '메시지 보내기'}
              </Text>
              <TouchableOpacity onPress={() => setMessageVisible(false)}>
                <Text style={[styles.modalClose, styles.messageModalClose]}>✕</Text>
              </TouchableOpacity>
            </View>

            {isMessageReadOnly ? (
              <View style={styles.sentMessageBox}>
                <Text style={styles.sentMessageText}>
                  {sentMessagePreview || '텍스트 란'}
                </Text>
                {FEATURE_FLAGS.gifticon && sentGiftPreview ? (
                  <TouchableOpacity style={styles.sentGiftViewBtn} onPress={() => setSentGiftVisible(true)}>
                    <Text style={styles.sentGiftViewBtnText}>선물 보기</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : (
              <>
                <View style={styles.messageInputWrap}>
                  <TextInput
                    style={styles.messageInput}
                    multiline
                    value={messageText}
                    onChangeText={setMessageText}
                    placeholder="자유롭게 입력해주세요."
                    placeholderTextColor="#B9B9B9"
                  />
                  {!FEATURE_FLAGS.gifticon || !selectedGift ? (
                    <Image source={letter2Img} style={styles.messageLetter} />
                  ) : null}
                  {FEATURE_FLAGS.gifticon && selectedGift ? (
                    <View style={styles.giftTag}>
                      <Text style={styles.giftTagText}>{`선물 - ${selectedGift.title} ${selectedGift.price}`}</Text>
                      <TouchableOpacity
                        style={styles.giftTagXBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={handleClearSelectedGift}
                      >
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
                  {FEATURE_FLAGS.gifticon ? (
                    <TouchableOpacity
                      style={styles.giftBtn}
                      onPress={() =>
                        navigation.navigate('Store', { pickGiftMode: true })
                      }
                    >
                      <Image source={giftImg} style={styles.giftBtnIcon} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {FEATURE_FLAGS.gifticon ? (
        <Modal visible={sentGiftVisible} transparent animationType="fade" onRequestClose={() => setSentGiftVisible(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSentGiftVisible(false)}>
            <Pressable style={styles.modalCardSmall} onPress={() => {}}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{`${detail.nickname}님이 선물을 보냈어요!`}</Text>
                <TouchableOpacity onPress={() => setSentGiftVisible(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.giftLabel}>선물명</Text>
              <View style={styles.giftPreviewBox}>
                <Text style={styles.giftPreviewText}>{sentGiftPreview || '이미지'}</Text>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

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
            <TouchableOpacity
              style={styles.pinkDoneBtn}
              onPress={() => {
                setMessageSuccessVisible(false);
                navigation.navigate('MainTabs', {
                  screen: 'interest',
                  params: { initialTab: 'sent' },
                });
              }}
            >
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
                if (FEATURE_FLAGS.store) {
                  navigation.navigate('Store');
                }
              }}
            >
              <Text style={styles.pinkDoneText}>
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
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    height: 48,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: '#111111',
  },
  backBtn: {
    position: 'absolute',
    left: 8,
    top: 0,
    bottom: 0,
    width: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    elevation: 2,
  },
  backBtnText: { fontSize: 24, fontWeight: '500', color: '#111' },
  scrollContent: { paddingBottom: 24 },

  heroWrap: { width: SCREEN_W, height: 420, backgroundColor: '#FFFFFF' },
  heroImage: { width: SCREEN_W, height: 420, resizeMode: 'cover' },
  photoDots: { position: 'absolute', top: 14, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF88', marginHorizontal: 4 },
  dotActive: { backgroundColor: '#FF5D60' },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockCostBadge: {
    minWidth: 88,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    gap: 8,
  },
  lockCostIcon: { width: 16, height: 16, resizeMode: 'contain' },
  lockCostText: { fontSize: 20, fontWeight: '900', color: '#111' },
  lockOverlayText: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 18,
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },

  infoCard: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E8E8E8' },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 24, fontWeight: '900', color: '#111', flexShrink: 1, marginRight: 10 },
  actionBtns: { flexDirection: 'row', gap: 8 },
  iconSquare: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageSquare: { backgroundColor: '#F5E7B3' },
  likeSquare: { backgroundColor: '#FFB6C1' },
  actionIcon: { width: 19, height: 19, resizeMode: 'contain' },
  messageActionIcon: { width: 30, height: 30 },
  metaGridRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaTextLeft: { flex: 1, fontSize: 12, color: '#111', fontWeight: '700' },
  metaTextRight: { minWidth: 95, textAlign: 'left', fontSize: 12, color: '#111', fontWeight: '700' },
  metaRightCell: { minWidth: 95 },
  reportText: { alignSelf: 'flex-end', marginTop: 2, color: '#333', fontSize: 9 },

  qaSection: { position: 'relative', backgroundColor: '#FFFFFF' },
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
  choiceSelected: { backgroundColor: '#FFCDCD', borderColor: '#FFCDCD' },
  choiceText: { fontSize: 11, fontWeight: '700', color: '#222' },
  vsText: { marginHorizontal: 10, fontSize: 12, fontWeight: '900', color: '#777' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', paddingHorizontal: 16 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16 },
  modalCardSmall: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, maxWidth: 360 },
  messageModalCard: {
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, color: '#101B4D', fontWeight: '900' },
  modalClose: { fontSize: 32, color: '#333' },
  messageModalTitle: { fontSize: 17 },
  messageModalClose: { fontSize: 28 },
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
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#B7B7B7',
    borderRadius: 18,
    minHeight: 122,
    overflow: 'visible',
  },
  messageInput: {
    minHeight: 108,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingRight: 14,
    fontSize: 14,
    color: '#111',
  },
  messageLetter: {
    position: 'absolute',
    width: 69,
    height: 48,
    right: -18,
    bottom: -12,
    transform: [{ rotate: '-18deg' }],
    resizeMode: 'contain',
    opacity: 1,
    zIndex: 2,
  },
  giftTag: {
    height: 28,
    backgroundColor: '#F4C2CC',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  giftTagText: { fontSize: 12, fontWeight: '700', color: '#111', maxWidth: '90%' },
  giftTagXBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftTagX: { fontSize: 30, lineHeight: 22, fontWeight: '900', color: '#111' },
  messageActions: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sentMessageBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFF',
  },
  sentMessageText: { fontSize: 14, lineHeight: 20, color: '#111', fontWeight: '600' },
  sentGiftViewBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    borderRadius: 10,
    backgroundColor: '#F4C2CC',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sentGiftViewBtnText: { fontSize: 12, color: '#111', fontWeight: '700' },
  giftLabel: { marginTop: 10, fontSize: 14, color: '#111', fontWeight: '700' },
  giftPreviewBox: {
    marginTop: 6,
    width: 120,
    height: 120,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CACACA',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  giftPreviewText: { fontSize: 12, color: '#666', fontWeight: '700', textAlign: 'center', paddingHorizontal: 8 },
  sendBtn: {
    width: 158,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#F5B3C2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sendBtnText: { fontSize: 16, fontWeight: '800', color: '#111' },
  giftBtn: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#F5E7B3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftBtnIcon: { width: 34, height: 34, resizeMode: 'contain' },
});
