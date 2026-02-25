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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { datingApiService } from '../../services/DatingApiService';
import { API_BASE_URL } from '../../config/api';
import {
  CheckTingWalletResponse,
  DrinkingHabit,
  MatchQuestionAnswer,
  ProfileMatchDetailResponse,
  SmokingHabit,
} from '../../types/DatingAPI';
import { drinkingHabitLabels, smokingHabitLabels } from '../../utils/DatingUtils';

type DetailData = {
  nickname: string;
  age: number;
  mbti: string;
  university: string;
  region: string;
  smoking?: SmokingHabit;
  drinking?: DrinkingHabit;
  questionAnswers: MatchQuestionAnswer[];
  photos: { photoId: number; imageUrl: string; blind: boolean }[];
};

const messageIcon = require('../../assets/images/likeable.png');
const tingIcon = require('../../assets/images/Ting.png');
const letterImg = require('../../assets/images/letter.png');

const REJECT_REASONS = [
  '관심사가 저랑 맞지 않아요.',
  '감정적으로 끌림이 느껴지지 않았어요.',
  '거리가 너무 멀어요.',
  '흡연 여부나 건강 습관이 저랑 달라요.',
  '가치관이 저랑 달라요.',
  '기타',
];

const toAbsoluteUri = (uri: string | undefined): string => {
  const s = String(uri ?? '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('/')) return `${API_BASE_URL}${s}`;
  return `${API_BASE_URL}/${s}`;
};

const normalizeQuestionTitle = (value: string | undefined): string =>
  String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ');

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
    raw?.profile?.questionAnswers ??
    [];
  const questionAnswers = Array.isArray(questionAnswersRaw) ? questionAnswersRaw : [];

  const photosRaw = Array.isArray(raw?.photos) ? raw.photos : [];
  const photos = photosRaw
    .map((p: any) => ({
      photoId: Number(p?.photoId ?? 0),
      imageUrl: toAbsoluteUri(p?.imageUrl ?? p?.ImageUrl),
      blind: !!p?.blind,
    }))
    .filter((p: any) => !!p.imageUrl);

  if (!photos.length && previewImageUrl) {
    photos.push({ photoId: 0, imageUrl: previewImageUrl, blind: false });
  }

  return {
    nickname: String(raw?.nickname ?? raw?.nickName ?? previewName ?? '회원'),
    age: Number(raw?.age ?? 0),
    mbti: String(raw?.mbti ?? raw?.MBTI ?? previewMbti ?? ''),
    university: String(raw?.university ?? raw?.universityName ?? raw?.school ?? ''),
    region: String(raw?.region ?? ''),
    smoking: raw?.smoking ?? raw?.smokingHabit,
    drinking: raw?.drinking ?? raw?.drinkingHabit,
    questionAnswers,
    photos,
  };
};

const toInt = (v: any): number | undefined => {
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return Math.floor(n);
};

const formatStaySeconds = (seconds?: number): string => {
  if (!seconds || seconds <= 0) return '정보 없음';
  if (seconds < 60) return `${seconds}초`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  if (min < 60) return `${min}분 ${sec}초`;
  const hour = Math.floor(min / 60);
  const remainMin = min % 60;
  return `${hour}시간 ${remainMin}분`;
};

const maskText = (text: string): string => {
  if (!text || text === '정보 없음') return '○초';
  return text.replace(/[0-9]/g, '○');
};

export default function InterestDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const tab: 'received' | 'sent' = route.params?.tab ?? 'received';
  const kind: 'LIKE' | 'MESSAGE' | 'HIGH_SCORE' = route.params?.kind ?? 'LIKE';
  const sourceId: number = route.params?.sourceId ?? 0;
  const profileId: number = route.params?.profileId ?? 0;
  const isLoveView: boolean = !!route.params?.isLoveView;
  const previewName: string = route.params?.nickname ?? '회원';
  const previewImageUrl: string | undefined = route.params?.imageUrl;
  const receivedMessage: string = String(route.params?.message ?? '');
  const giftName: string = String(route.params?.giftName ?? '');
  const sentGift: boolean = !!route.params?.hasGift;
  const isReceived = tab === 'received';

  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<CheckTingWalletResponse | null>(null);
  const [detail, setDetail] = useState<DetailData | null>(null);

  const [staySeconds, setStaySeconds] = useState<number | undefined>(
    toInt(route.params?.staySeconds),
  );
  const [receivedScore, setReceivedScore] = useState<number | undefined>(
    toInt(route.params?.receivedScore),
  );

  const [messageVisible, setMessageVisible] = useState(false);
  const [giftGuideVisible, setGiftGuideVisible] = useState(false);
  const [giftRevealVisible, setGiftRevealVisible] = useState(false);
  const [acceptConfirmVisible, setAcceptConfirmVisible] = useState(false);
  const [rejectConfirmVisible, setRejectConfirmVisible] = useState(false);
  const [rejectReasonVisible, setRejectReasonVisible] = useState(false);
  const [matchedVisible, setMatchedVisible] = useState(false);
  const [shortageVisible, setShortageVisible] = useState(false);
  const [stayVisible, setStayVisible] = useState(false);
  const [scoreVisible, setScoreVisible] = useState(false);

  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [customReason, setCustomReason] = useState('');
  const [unlockedStay, setUnlockedStay] = useState(false);
  const [unlockedScore, setUnlockedScore] = useState(false);
  const [responding, setResponding] = useState(false);

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

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [walletRes, detailRes] = await Promise.all([
        datingApiService.getTingWalletInfo(),
        isLoveView
          ? datingApiService.getLoveViewDetail(profileId)
          : datingApiService.getProfileDetail(profileId),
      ]);

      setWallet(walletRes);
      setDetail(parseDetail(detailRes, previewName, '', previewImageUrl));
      const detailResAny: any = detailRes;

      if (staySeconds == null) {
        const fromApi = toInt(
          detailResAny?.myProfileStaySeconds ??
            detailResAny?.myProfileStayedSeconds ??
            detailResAny?.myProfileViewDurationSec ??
            detailResAny?.staySeconds,
        );
        if (fromApi != null) setStaySeconds(fromApi);
      }

      if (receivedScore == null) {
        const fromApi = toInt(
          detailResAny?.receivedScore ??
            detailResAny?.scoreToMe ??
            detailResAny?.myReceivedScore,
        );
        if (fromApi != null) setReceivedScore(fromApi);
      }
    } catch (e) {
      console.warn('Failed to load interest detail', e);
      Alert.alert('오류', '상세 프로필을 불러오지 못했어요.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [isLoveView, navigation, previewImageUrl, previewName, profileId, receivedScore, staySeconds]);

  useFocusEffect(
    useCallback(() => {
      refresh();
      return undefined;
    }, [refresh]),
  );

  const availableTing = (wallet?.tingNum ?? 0) + (wallet?.eventTingNum ?? 0);
  const stayDisplay = formatStaySeconds(staySeconds);
  const stayMasked = maskText(stayDisplay);
  const scoreDisplay = receivedScore != null ? `${receivedScore}점` : '정보 없음';
  const scoreMasked = receivedScore != null ? '○점' : '○점';
  const messageTitle = isReceived ? `${previewName}님의 메시지` : '내가 보낸 메시지';
  const giftTitle = isReceived ? `${previewName}님이 선물을 보냈어요!` : '내가 보낸 선물';
  const actionLabel = kind === 'MESSAGE' ? '메시지' : '호감';

  const qaItems = useMemo(() => {
    const list = Array.isArray(detail?.questionAnswers) ? detail?.questionAnswers : [];
    return list
      .map((item: any, idx: number) => {
        const qObj = item?.question;
        const qText = typeof qObj === 'string' ? qObj : qObj?.question;
        const answer = String(item?.answer ?? '').trim();
        return {
          id: `${idx}-${qText ?? 'q'}`,
          title: normalizeQuestionTitle(qText || `질문 ${idx + 1}`),
          answer: answer || '아직 작성된 답변이 없어요.',
        };
      })
      .filter(v => !!v.title);
  }, [detail?.questionAnswers]);

  const chargeFiveTing = () => {
    if (availableTing < 5) {
      setShortageVisible(true);
      return false;
    }
    setWallet(prev => {
      if (!prev) return prev;
      const next = { ...prev };
      let remain = 5;
      const fromEvent = Math.min(remain, next.eventTingNum ?? 0);
      next.eventTingNum = Math.max(0, (next.eventTingNum ?? 0) - fromEvent);
      remain -= fromEvent;
      if (remain > 0) {
        next.tingNum = Math.max(0, (next.tingNum ?? 0) - remain);
      }
      return next;
    });
    return true;
  };

  const handleRespond = async (accepted: boolean, rejectReason?: string) => {
    if (responding) return;
    try {
      setResponding(true);
      if (kind === 'MESSAGE') {
        await datingApiService.respondMessage({
          messageRequestId: sourceId,
          accepted,
          rejectReason,
        });
      } else {
        await datingApiService.respondLike({
          likeRequestId: sourceId,
          accepted,
          rejectReason,
        });
      }

      if (accepted) {
        setMatchedVisible(true);
      } else {
        Alert.alert('완료', '거절 처리가 완료되었습니다.', [
          {
            text: '확인',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (e: any) {
      const msg =
        String(e?.response?.data?.message ?? '').replace(/^'+|'+$/g, '') ||
        '처리 중 오류가 발생했습니다.';
      Alert.alert('안내', msg);
    } finally {
      setResponding(false);
    }
  };

  const toggleReason = (reason: string) => {
    setSelectedReasons(prev =>
      prev.includes(reason) ? prev.filter(v => v !== reason) : [...prev, reason],
    );
  };

  const submitReject = async () => {
    if (!selectedReasons.length) {
      Alert.alert('안내', '거절 사유를 선택해 주세요.');
      return;
    }
    if (selectedReasons.includes('기타') && !customReason.trim()) {
      Alert.alert('안내', '기타 사유를 입력해 주세요.');
      return;
    }

    const reasons = selectedReasons
      .map(v => (v === '기타' ? customReason.trim() : v))
      .filter(Boolean);
    await handleRespond(false, reasons.join(', '));
  };

  if (loading || !detail) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  const title = isLoveView ? '연애관 프로필' : '프로필';
  const nameLine = `${detail.nickname}${detail.age ? `(${detail.age})` : ''} ${detail.mbti || ''}`.trim();
  const bottomPad = isReceived ? 120 : 24;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBackPress}>
          <Text style={styles.backBtnText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}>
        {!isLoveView ? (
          <View style={styles.heroWrap}>
            {detail.photos?.[0]?.imageUrl ? (
              <Image source={{ uri: detail.photos[0].imageUrl }} style={styles.heroImage} />
            ) : (
              <View style={styles.heroEmpty}>
                <Text style={styles.heroEmptyText}>사진 없음</Text>
              </View>
            )}
          </View>
        ) : null}

        <View style={styles.infoCard}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{nameLine}</Text>
            <TouchableOpacity style={styles.messageBtn} onPress={() => setMessageVisible(true)}>
              <Image source={messageIcon} style={styles.messageBtnIcon} />
            </TouchableOpacity>
          </View>

          <Text style={styles.meta}>🏫 {detail.university || '학교 정보 없음'}</Text>
          <Text style={styles.meta}>📍 {detail.region || '지역 정보 없음'}</Text>
          <Text style={styles.meta}>
            {smokingHabitLabels[detail.smoking ?? SmokingHabit.NON_SMOKER]}
          </Text>
          <Text style={styles.meta}>
            {drinkingHabitLabels[detail.drinking ?? DrinkingHabit.NON_DRINKER]}
          </Text>
          <Text style={styles.reportText}>신고 횟수: 0</Text>
        </View>

        {isReceived ? (
          <View style={styles.infoButtonsRow}>
            <TouchableOpacity style={styles.infoBtnGreen} onPress={() => setStayVisible(true)}>
              <Text style={styles.infoBtnText}>내 프로필에 머문 시간</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.infoBtnBlue} onPress={() => setScoreVisible(true)}>
              <Text style={styles.infoBtnText}>나에게 매긴 점수</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.qaSection}>
          <Image source={letterImg} style={styles.watermark} />
          {qaItems.map(item => (
            <View key={item.id} style={styles.qaBlock}>
              <Text style={styles.qTitle}>{item.title}</Text>
              <Text style={styles.answer}>{item.answer}</Text>
            </View>
          ))}
          {!qaItems.length ? (
            <View style={styles.qaBlock}>
              <Text style={styles.answer}>아직 작성된 질문 답변이 없어요.</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {isReceived ? (
        <View style={styles.fixedBottomBar}>
          <TouchableOpacity
            style={[styles.bottomBtn, styles.rejectBtn]}
            onPress={() => setRejectConfirmVisible(true)}
            disabled={responding}
          >
            <Text style={styles.bottomBtnText}>거절하기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bottomBtn, styles.acceptBtn]}
            onPress={() => setAcceptConfirmVisible(true)}
            disabled={responding}
          >
            <Text style={styles.bottomBtnText}>수락하기</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Modal visible={messageVisible} transparent animationType="fade" onRequestClose={() => setMessageVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setMessageVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{messageTitle}</Text>
              <TouchableOpacity onPress={() => setMessageVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalBodyText}>{receivedMessage || '텍스트 란'}</Text>
            {sentGift ? (
              <TouchableOpacity style={styles.modalPinkBtn} onPress={() => setGiftGuideVisible(true)}>
                <Text style={styles.modalPinkBtnText}>선물 보기</Text>
              </TouchableOpacity>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={giftGuideVisible} transparent animationType="fade" onRequestClose={() => setGiftGuideVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setGiftGuideVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{giftTitle}</Text>
              <TouchableOpacity onPress={() => setGiftGuideVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalBodyText}>
              선물을 받기 위해선 메시지 수락 후{`\n`}100회 이상 대화해야해요!
            </Text>
            <TouchableOpacity
              style={styles.modalPinkBtn}
              onPress={() => {
                setGiftGuideVisible(false);
                setGiftRevealVisible(true);
              }}
            >
              <Text style={styles.modalPinkBtnText}>선물보기</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={giftRevealVisible} transparent animationType="fade" onRequestClose={() => setGiftRevealVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setGiftRevealVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>선물명</Text>
              <TouchableOpacity onPress={() => setGiftRevealVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.giftPlaceholder}>
              <Text style={styles.giftPlaceholderText}>{giftName || '이미지'}</Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={stayVisible} transparent animationType="fade" onRequestClose={() => setStayVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setStayVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>내 프로필 열람 시간</Text>
              <TouchableOpacity onPress={() => setStayVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalBodyText}>
              이 회원은 당신의 프로필을{`\n`}
              {unlockedStay ? stayDisplay : stayMasked} 동안 둘러봤어요.
            </Text>
            <TouchableOpacity
              style={styles.modalPinkBtn}
              onPress={() => {
                if (unlockedStay) return;
                if (!chargeFiveTing()) return;
                setUnlockedStay(true);
              }}
            >
              <Text style={styles.modalPinkBtnText}>시간 보기</Text>
              <View style={styles.pricePill}>
                <Image source={tingIcon} style={styles.priceIcon} />
                <Text style={styles.priceText}>5</Text>
              </View>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={scoreVisible} transparent animationType="fade" onRequestClose={() => setScoreVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setScoreVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>나에게 준 점수는?</Text>
              <TouchableOpacity onPress={() => setScoreVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalBodyText}>
              이 회원은 당신의 프로필 사진을 보고{`\n`}
              {unlockedScore ? scoreDisplay : scoreMasked}을 주었어요!
            </Text>
            <TouchableOpacity
              style={styles.modalPinkBtn}
              onPress={() => {
                if (unlockedScore) return;
                if (!chargeFiveTing()) return;
                setUnlockedScore(true);
              }}
            >
              <Text style={styles.modalPinkBtnText}>점수 보기</Text>
              <View style={styles.pricePill}>
                <Image source={tingIcon} style={styles.priceIcon} />
                <Text style={styles.priceText}>5</Text>
              </View>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={acceptConfirmVisible} transparent animationType="fade" onRequestClose={() => setAcceptConfirmVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setAcceptConfirmVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{`${previewName}님의 ${actionLabel}을\n정말 수락할까요?`}</Text>
              <TouchableOpacity onPress={() => setAcceptConfirmVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalBodyText}>수락하시면 채팅방이 생성돼요!</Text>
            <View style={styles.confirmRow}>
              <TouchableOpacity style={styles.grayBtn} onPress={() => setAcceptConfirmVisible(false)}>
                <Text style={styles.grayBtnText}>보류하기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPinkBtn}
                onPress={async () => {
                  setAcceptConfirmVisible(false);
                  await handleRespond(true);
                }}
              >
                <Text style={styles.modalPinkBtnText}>수락하기</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={rejectConfirmVisible} transparent animationType="fade" onRequestClose={() => setRejectConfirmVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setRejectConfirmVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{`${previewName}님의 ${actionLabel}을\n정말 거절할까요?`}</Text>
              <TouchableOpacity onPress={() => setRejectConfirmVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalBodyText}>거절하시면 다시 이어질 수 없어요.</Text>
            <View style={styles.confirmRow}>
              <TouchableOpacity style={styles.grayBtn} onPress={() => setRejectConfirmVisible(false)}>
                <Text style={styles.grayBtnText}>보류하기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPinkBtn}
                onPress={() => {
                  setRejectConfirmVisible(false);
                  setRejectReasonVisible(true);
                }}
              >
                <Text style={styles.modalPinkBtnText}>거절하기</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={rejectReasonVisible} transparent animationType="fade" onRequestClose={() => setRejectReasonVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setRejectReasonVisible(false)}>
          <Pressable style={styles.modalCardLarge} onPress={() => {}}>
            <Text style={styles.rejectTitle}>수락하지 않은 이유를 알려주세요</Text>
            {REJECT_REASONS.map(reason => {
              const checked = selectedReasons.includes(reason);
              return (
                <Pressable key={reason} style={styles.rejectRow} onPress={() => toggleReason(reason)}>
                  <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                    {checked ? <Text style={styles.checkMark}>✓</Text> : null}
                  </View>
                  <Text style={styles.rejectText}>{reason}</Text>
                </Pressable>
              );
            })}

            {selectedReasons.includes('기타') ? (
              <TextInput
                value={customReason}
                onChangeText={setCustomReason}
                placeholder="자유롭게 입력해주세요."
                style={styles.reasonInput}
                placeholderTextColor="#9CA3AF"
              />
            ) : null}

            <TouchableOpacity style={styles.finishBtn} onPress={submitReject} disabled={responding}>
              <Text style={styles.finishBtnText}>완료</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={matchedVisible} transparent animationType="fade" onRequestClose={() => setMatchedVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setMatchedVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>매칭 완료</Text>
              <TouchableOpacity onPress={() => setMatchedVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalBodyText}>
              관심 수락 완료!{`\n`}이제 대화를 시작할 수 있어요.
            </Text>
            <TouchableOpacity
              style={styles.modalPinkBtn}
              onPress={() => {
                setMatchedVisible(false);
                navigation.navigate('MainTabs', { screen: 'chat' });
              }}
            >
              <Text style={styles.modalPinkBtnText}>채팅방으로 이동</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={shortageVisible} transparent animationType="fade" onRequestClose={() => setShortageVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShortageVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>팅 부족</Text>
              <TouchableOpacity onPress={() => setShortageVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalBodyText}>팅이 부족하여 진행할 수 없습니다.</Text>
            <TouchableOpacity
              style={styles.modalPinkBtn}
              onPress={() => {
                setShortageVisible(false);
                navigation.navigate('Store');
              }}
            >
              <Text style={styles.modalPinkBtnText}>스토어 이동</Text>
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
    height: 46,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    left: 8,
    top: 0,
    bottom: 0,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: { fontSize: 22, color: '#111' },
  headerTitle: { textAlign: 'center', fontSize: 16, fontWeight: '900', color: '#101B4D' },
  scrollContent: { backgroundColor: '#FFFFFF' },
  heroWrap: { width: '100%', aspectRatio: 0.85, backgroundColor: '#F4F4F4' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroEmptyText: { color: '#888', fontWeight: '700' },
  infoCard: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 34, fontWeight: '900', color: '#111', flexShrink: 1, marginRight: 8 },
  messageBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F6E6B4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBtnIcon: { width: 26, height: 26, resizeMode: 'contain' },
  meta: { marginTop: 4, fontSize: 14, color: '#111', fontWeight: '700' },
  reportText: { alignSelf: 'flex-end', color: '#444', fontSize: 11, marginTop: 2 },
  infoButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  infoBtnGreen: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#D9E8E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBtnBlue: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#DDE6F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBtnText: { fontSize: 18, fontWeight: '900', color: '#111' },
  qaSection: { position: 'relative', backgroundColor: '#FFFFFF' },
  watermark: {
    position: 'absolute',
    width: 180,
    height: 180,
    right: 16,
    top: 100,
    opacity: 0.18,
    resizeMode: 'contain',
  },
  qaBlock: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
  },
  qTitle: { fontSize: 20, fontWeight: '900', color: '#111', marginBottom: 8 },
  answer: { fontSize: 16, lineHeight: 24, color: '#222', fontWeight: '500' },
  fixedBottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: 'row',
    gap: 10,
  },
  bottomBtn: {
    flex: 1,
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: { backgroundColor: '#EDEDED', borderWidth: 1, borderColor: '#CFCFCF' },
  acceptBtn: { backgroundColor: '#F6B4C2', borderWidth: 1, borderColor: '#E7A2B1' },
  bottomBtnText: { fontSize: 17, fontWeight: '900', color: '#333' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalCard: { width: '100%', maxWidth: 360, borderRadius: 16, backgroundColor: '#FFFFFF', padding: 14 },
  modalCardLarge: { width: '100%', maxWidth: 360, borderRadius: 16, backgroundColor: '#FFFFFF', padding: 14 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  modalTitle: { fontSize: 17, fontWeight: '900', color: '#101B4D', flex: 1 },
  modalClose: { fontSize: 30, color: '#333', lineHeight: 28 },
  modalBodyText: { marginTop: 10, fontSize: 16, lineHeight: 23, color: '#111', fontWeight: '600' },
  modalPinkBtn: {
    marginTop: 14,
    alignSelf: 'center',
    minWidth: 120,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F5B0BF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalPinkBtnText: { fontSize: 18, fontWeight: '800', color: '#111' },
  pricePill: {
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 3,
  },
  priceIcon: { width: 14, height: 14, resizeMode: 'contain' },
  priceText: { fontSize: 14, fontWeight: '900', color: '#333' },
  giftPlaceholder: {
    marginTop: 12,
    width: 120,
    height: 120,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftPlaceholderText: { color: '#6B7280', fontWeight: '700' },
  confirmRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  grayBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grayBtnText: { fontSize: 16, fontWeight: '800', color: '#333' },
  rejectTitle: { fontSize: 18, fontWeight: '900', color: '#101B4D', marginBottom: 12 },
  rejectRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: '#9CA3AF',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#93C5FD', borderColor: '#60A5FA' },
  checkMark: { color: '#FFF', fontWeight: '900', fontSize: 12 },
  rejectText: { fontSize: 16, color: '#111', fontWeight: '600' },
  reasonInput: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 10,
    color: '#111',
  },
  finishBtn: {
    marginTop: 14,
    alignSelf: 'center',
    width: 120,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F5B0BF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishBtnText: { fontSize: 16, fontWeight: '800', color: '#111' },
});
