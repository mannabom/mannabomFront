import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
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
import { useNavigation, useRoute } from '@react-navigation/native';
import BottomNavigationBar from '../../components/common/BottomNavigationBar';

const vipBadgeImg = require('../../assets/images/VIP.png');
const subBadgeImg = require('../../assets/images/SUB.png');
const tingIconImg = require('../../assets/images/Ting.png');
const eventTingIconImg = require('../../assets/images/Eventting.png');
const petalImg = require('../../assets/images/petal.png');
const freeProfileImg = require('../../assets/images/freeprofile.png');
const paidProfileImg = require('../../assets/images/paidprofile.png');

type ChoiceQA = {
  id: string;
  title: string;
  left: string;
  right: string;
  selected: 'LEFT' | 'RIGHT' | null;
};

type LoveCard = {
  profileId: number;
  nickname: string;
  requiredQA: { question: string; answer: string }[];
  openQA: { question: string; answer: string }[];
  choiceQA: ChoiceQA[];
};

const FALLBACK_CHOICE_QA: ChoiceQA[] = [
  { id: 'fight', title: '연인과 싸웠을 때', left: '바로 풀고 싶다', right: '시간을 좀 가지고 싶다', selected: null },
  { id: 'photo', title: '연인과 함께한 사진', left: 'SNS에 공유해도 된다', right: 'SNS에 공유하기 싫다', selected: null },
  { id: 'important', title: '연애에서 더 중요한 것은', left: '편안함', right: '설렘', selected: null },
  { id: 'date', title: '연인과의 데이트에서', left: '실내에서 데이트하기', right: '실외에서 데이트하기', selected: null },
  { id: 'jealousy', title: '연애에서 적당한 질투가', left: '있어야 재미있다', right: '쿨한 게 편하다', selected: null },
  { id: 'idealDay', title: '연인과의 이상적인 하루는', left: '편한 일상 즐기기', right: '새로운 경험 해보기', selected: null },
  { id: 'attracted', title: '연인에게 주로 끌리는 모습은', left: '배려심 넘치는 모습', right: '주도적인 모습', selected: null },
  { id: 'friends', title: '연인이 내 친구들과', left: '어울리며 놀기', right: '따로 놀기', selected: null },
];

export default function LoveCodePreviewScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const isVip: boolean = route.params?.isVip ?? false;
  const isSubscribed: boolean = route.params?.isSubscribed ?? false;
  const tingBalance: number = route.params?.tingBalance ?? 0;
  const eventTingBalance: number = route.params?.eventTingBalance ?? 0;
  const freeLoveViewNum: number = route.params?.freeLoveViewNum ?? 0;
  const additionalProfileNum: number = route.params?.additionalProfileNum ?? 0;

  const singleFallbackCard: LoveCard = useMemo(
    () => ({
      profileId: 0,
      nickname: route.params?.nickname ?? '닉네임',
      requiredQA: [
        { question: '자기소개', answer: route.params?.intro ?? '자기소개가 없어요.' },
        { question: '연인에게 바라는 한 가지는?', answer: route.params?.want ?? '응답이 없어요.' },
        { question: '나를 설레게 하는 이성의 매력?', answer: route.params?.charm ?? '응답이 없어요.' },
      ],
      openQA: Array.isArray(route.params?.openQA)
        ? route.params.openQA
        : [
            { question: '나에게 연애란 어떤 의미인가요?', answer: '아직 작성된 답변이 없어요.' },
            { question: '나의 소울 푸드?', answer: '아직 작성된 답변이 없어요.' },
            { question: '나의 하루 그리고 나의 휴일은?', answer: '아직 작성된 답변이 없어요.' },
            { question: '하고 싶은 데이트는?', answer: '아직 작성된 답변이 없어요.' },
          ],
      choiceQA: Array.isArray(route.params?.choiceQA) ? route.params.choiceQA : FALLBACK_CHOICE_QA,
    }),
    [route.params],
  );

  const initialCards: LoveCard[] =
    Array.isArray(route.params?.loveCards) && route.params.loveCards.length
      ? route.params.loveCards
      : [singleFallbackCard];

  const [cards] = useState<LoveCard[]>(initialCards);
  const [index, setIndex] = useState<number>(
    Math.max(0, Math.min(route.params?.startIndex ?? 0, Math.max(0, initialCards.length - 1))),
  );
  const [navDirection, setNavDirection] = useState<1 | -1>(1);
  const [counterInfoVisible, setCounterInfoVisible] = useState(false);
  const [metaAnchor, setMetaAnchor] = useState({ x: 18, y: 120, width: 120, height: 28 });
  const metaRowRef = React.useRef<View>(null);
  const slideX = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const firstPaint = useRef(true);

  const current = useMemo(
    () => (cards.length ? cards[Math.min(index, cards.length - 1)] : singleFallbackCard),
    [cards, index, singleFallbackCard],
  );

  const canGoPrev = index > 0;
  const canGoNext = index < cards.length - 1;

  useEffect(() => {
    if (firstPaint.current) {
      firstPaint.current = false;
      return;
    }
    slideX.setValue(navDirection > 0 ? 24 : -24);
    fade.setValue(0.2);
    Animated.parallel([
      Animated.timing(slideX, {
        toValue: 0,
        duration: 210,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 210,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, navDirection, fade, slideX]);

  const goPrev = () => {
    if (!canGoPrev) return;
    setNavDirection(-1);
    setIndex(i => Math.max(0, i - 1));
  };

  const goNext = () => {
    if (!canGoNext) {
      Alert.alert('안내', '다음 연애코드가 아직 없어요.');
      return;
    }
    setNavDirection(1);
    setIndex(i => i + 1);
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

  const intro = current.requiredQA.find(item => item.question === '자기소개')?.answer ?? '자기소개가 없어요.';
  const want =
    current.requiredQA.find(item => item.question === '연인에게 바라는 한 가지는?')?.answer ??
    '응답이 없어요.';
  const charm =
    current.requiredQA.find(item => item.question === '나를 설레게 하는 이성의 매력?')?.answer ??
    '응답이 없어요.';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <Image source={petalImg} style={[styles.petal, styles.petalLeft]} />
      <Image source={petalImg} style={[styles.petal, styles.petalRight]} />

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

      <View style={styles.contentLayer}>
        <View style={styles.metaWrap}>
          <View ref={metaRowRef} collapsable={false}>
            <TouchableOpacity style={styles.metaRow} activeOpacity={0.85} onPress={openCounterInfo}>
              <Image source={freeProfileImg} style={styles.metaIconLarge} />
              <Text style={styles.metaTextLarge}>{freeLoveViewNum}</Text>
              <Image source={paidProfileImg} style={styles.metaIconLarge} />
              <Text style={[styles.metaTextLarge, { color: '#E76A8C' }]}>{additionalProfileNum}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.contentWrap}>
          <Pressable style={[styles.sideBtn, !canGoPrev && styles.sideBtnDisabled]} onPress={goPrev}>
            <Text style={[styles.sideArrow, !canGoPrev && styles.sideArrowDisabled]}>{'‹'}</Text>
          </Pressable>

          <Animated.View style={{ flex: 1, opacity: fade, transform: [{ translateX: slideX }] }}>
            <ScrollView style={styles.card} contentContainerStyle={styles.cardContent} showsVerticalScrollIndicator>
              <Text style={styles.title}>{current.nickname}님의 연애코드</Text>

              <View style={styles.qaBlock}>
                <Text style={styles.qTitle}>자기소개</Text>
                <Text style={styles.answer}>{intro}</Text>
              </View>

              <View style={styles.qaBlock}>
                <Text style={styles.qTitle}>연인에게 바라는 한 가지는?</Text>
                <Text style={styles.answer}>{want}</Text>
              </View>

              <View style={styles.qaBlock}>
                <Text style={styles.qTitle}>나를 설레게 하는 이성의 매력?</Text>
                <Text style={styles.answer}>{charm}</Text>
              </View>

              {current.openQA.map(item => (
                <View key={item.question} style={styles.qaBlock}>
                  <Text style={styles.qTitle}>{item.question}</Text>
                  <Text style={styles.answer}>{item.answer || '응답이 없어요.'}</Text>
                </View>
              ))}

              <Text style={styles.dotDivider}>• • •</Text>

              {(current.choiceQA.length ? current.choiceQA : FALLBACK_CHOICE_QA).map(q => {
                const leftSelected = q.selected === 'LEFT';
                const rightSelected = q.selected === 'RIGHT';

                return (
                  <View key={q.id} style={styles.questionBlock}>
                    <Text style={styles.choiceTitle}>{q.title}</Text>
                    <View style={styles.choiceRow}>
                      <View
                        style={[
                          styles.choiceButton,
                          leftSelected ? styles.choiceButtonSelected : styles.choiceButtonIdle,
                        ]}
                      >
                        <Text
                          style={[
                            styles.choiceText,
                            leftSelected ? styles.choiceTextSelected : styles.choiceTextIdle,
                          ]}
                          numberOfLines={1}
                        >
                          {q.left}
                        </Text>
                      </View>

                      <Text style={styles.vsText}>VS</Text>

                      <View
                        style={[
                          styles.choiceButton,
                          rightSelected ? styles.choiceButtonSelected : styles.choiceButtonIdle,
                        ]}
                      >
                        <Text
                          style={[
                            styles.choiceText,
                            rightSelected ? styles.choiceTextSelected : styles.choiceTextIdle,
                          ]}
                          numberOfLines={1}
                        >
                          {q.right}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </Animated.View>

          <Pressable style={[styles.sideBtn, !canGoNext && styles.sideBtnDisabled]} onPress={goNext}>
            <Text style={[styles.sideArrow, !canGoNext && styles.sideArrowDisabled]}>{'›'}</Text>
          </Pressable>
        </View>

        <TouchableOpacity
          style={styles.nextBtn}
          activeOpacity={0.9}
          onPress={() => {
            if (!current?.profileId) return;
            navigation.navigate('MatchDetail', {
              source: 'LOVE_VIEW_MATCH',
              targetProfileId: current.profileId,
              previewName: current.nickname,
            });
          }}
        >
          <Text style={styles.nextBtnText}>프로필 보기</Text>
        </TouchableOpacity>
      </View>

      <BottomNavigationBar
        activeTab="dating"
        onTabPress={tabKey => navigation.navigate('MainTabs', { screen: tabKey } as any)}
      />

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

const PINK = '#F5BBC8';
const BORDER = '#DADADA';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    paddingHorizontal: 12,
    paddingTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
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

  contentLayer: { flex: 1, zIndex: 2 },
  metaWrap: { width: '100%', marginTop: 8 },
  metaRow: {
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

  contentWrap: { flex: 1, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center' },
  sideBtn: { width: 18, alignItems: 'center' },
  sideBtnDisabled: { opacity: 0.35 },
  sideArrow: { fontSize: 26, color: '#111' },
  sideArrowDisabled: { color: '#999' },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
  },
  cardContent: { paddingHorizontal: 12, paddingVertical: 16 },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111',
    marginBottom: 24,
    textAlign: 'center',
  },
  qaBlock: { marginBottom: 24 },
  qTitle: { fontSize: 16, fontWeight: '900', color: '#111', marginBottom: 10 },
  answer: { fontSize: 13, color: '#444', lineHeight: 22, fontWeight: '600' },
  dotDivider: {
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 10,
    color: '#F198AF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 3,
  },

  questionBlock: { marginBottom: 12 },
  choiceTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111',
    textAlign: 'center',
    marginBottom: 8,
  },
  choiceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  vsText: { fontSize: 13, fontWeight: '800', color: '#666', marginHorizontal: 10 },
  choiceButton: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 34,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceButtonIdle: { backgroundColor: '#FFF', borderColor: BORDER },
  choiceButtonSelected: { backgroundColor: PINK, borderColor: '#E8AAB8' },
  choiceText: { fontSize: 11, fontWeight: '700' },
  choiceTextIdle: { color: '#222' },
  choiceTextSelected: { color: '#222' },

  nextBtn: {
    marginTop: 8,
    marginBottom: 10,
    alignSelf: 'center',
    width: 112,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F8C5D2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: { fontSize: 16, color: '#111', fontWeight: '800' },

  petal: { position: 'absolute', width: 34, height: 34, opacity: 0.9, zIndex: 0 },
  petalLeft: { left: 14, bottom: 20, transform: [{ rotate: '-18deg' }] },
  petalRight: { right: 16, top: '44%', transform: [{ rotate: '18deg' }] },

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
