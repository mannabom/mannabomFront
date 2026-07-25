import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import {
  DrinkingHabit,
  MatchQuestionAnswer,
  MatchSource,
  SmokingHabit,
} from '../../types/DatingAPI';
import { API_BASE_URL } from '../../config/api';
import { datingApiService } from '../../services/DatingApiService';
import { drinkingHabitLabels, smokingHabitLabels } from '../../utils/DatingUtils';
import { toExternalId } from '../../utils/IdUtils';

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
  photos: { photoId: string; imageUrl: string; blind: boolean }[];
};

type ChoiceQA = {
  id: string;
  title: string;
  left: string;
  right: string;
  selected: 'LEFT' | 'RIGHT' | null;
};

const BODY_TYPE_LABELS: Record<string, string> = {
  SLIM: '마름',
  AVERAGE: '보통',
  CHUBBY: '통통',
};

const CHOICE_QUESTIONS = [
  { id: 'fight', title: '애인과 싸웠을 때', left: '바로 풀고 싶다', right: '시간을 좀 가지고 싶다', questionId: '8', keywords: ['싸웠을', '다퉜', '갈등'] },
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
  SOLVE_IMMEDIATELY: 'LEFT',
  CALM_AFTER_TIME: 'RIGHT',
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

const toAbsoluteUri = (uri: string | undefined): string => {
  const s = (uri ?? '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('/')) return `${API_BASE_URL}${s}`;
  return `${API_BASE_URL}/${s}`;
};

const cleanQuestionTitle = (value: string | undefined): string => {
  let s = String(value ?? '').trim();
  while (s) {
    const next = s
      .replace(/\s*[\(\[\{（【]\s*[^)\]\}）】]*\s*[\)\]\}）】]\s*$/u, '')
      .trim();
    if (next === s) break;
    s = next;
  }
  return s;
};

const normalizeQuestionKey = (value: string | undefined): string =>
  String(value ?? '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '');

const getChoiceSideByCode = (answer: string | undefined): 'LEFT' | 'RIGHT' | undefined =>
  CHOICE_CODE_TO_SIDE[
    String(answer ?? '')
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, '_')
  ];

const parseDetail = (
  raw: any,
  previewName?: string,
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

  const photosRaw = Array.isArray(raw?.photos) ? raw.photos : [];
  const photos = photosRaw
    .map((p: any, index: number) => ({
      photoId: toExternalId(p?.photoId) ?? `photo-${index}`,
      imageUrl: toAbsoluteUri(p?.imageUrl ?? p?.ImageUrl ?? p?.photoUrl),
      blind: Boolean(p?.blind),
    }))
    .filter((p: any) => p.imageUrl);

  if (!photos.length && previewImageUrl) {
    photos.push({
      photoId: 'preview',
      imageUrl: toAbsoluteUri(previewImageUrl),
      blind: false,
    });
  }

  const regionText = String(raw?.region ?? '').trim();
  const mergedRegion = [raw?.region?.sido ?? raw?.regionSido, raw?.region?.sigungu ?? raw?.regionSigungu]
    .filter(Boolean)
    .join(' ')
    .trim();

  return {
    nickname: String(raw?.nickname ?? raw?.nickName ?? previewName ?? '회원'),
    age: Number(raw?.age ?? 0),
    mbti: String(raw?.mbti ?? raw?.MBTI ?? ''),
    height: Number(raw?.height ?? raw?.profile?.height ?? 0) || undefined,
    bodyType: String(raw?.bodyType ?? raw?.bodyShape ?? raw?.profile?.bodyType ?? ''),
    university: String(raw?.university ?? raw?.universityName ?? raw?.school ?? raw?.profile?.university ?? ''),
    region: regionText || mergedRegion,
    smoking: raw?.smoking ?? raw?.smokingHabit,
    drinking: raw?.drinking ?? raw?.drinkingHabit,
    questionAnswers: Array.isArray(questionAnswersRaw) ? questionAnswersRaw : [],
    photos,
  };
};

const ChatProfileDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const source: MatchSource = route.params?.source ?? 'PROFILE_MATCH';
  const targetProfileId = toExternalId(route.params?.targetProfileId);
  const isProfileSource = source === 'PROFILE_MATCH';

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<DetailData | null>(null);

  const loadDetail = useCallback(async () => {
    if (!targetProfileId) {
      setDetail(parseDetail({}, route.params?.previewName, route.params?.previewImageUrl));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const raw =
        source === 'PROFILE_MATCH'
          ? await datingApiService.getProfileDetail(targetProfileId)
          : await datingApiService.getLoveViewDetail(targetProfileId);
      setDetail(parseDetail(raw, route.params?.previewName, route.params?.previewImageUrl));
    } catch (error) {
      if (__DEV__) console.warn('Failed to load chat profile detail', error);
      setDetail(parseDetail({}, route.params?.previewName, route.params?.previewImageUrl));
    } finally {
      setLoading(false);
    }
  }, [route.params?.previewImageUrl, route.params?.previewName, source, targetProfileId]);

  useFocusEffect(
    useCallback(() => {
      loadDetail();
      return undefined;
    }, [loadDetail]),
  );

  const normalizedQAs = useMemo(() => {
    const rawList = Array.isArray(detail?.questionAnswers) ? detail.questionAnswers : [];
    return rawList
      .map((item: any, idx: number) => {
        const qObj = item?.question;
        const qText = typeof qObj === 'string' ? qObj : qObj?.question ?? '';
        const qId = toExternalId(
          typeof qObj === 'object' ? qObj?.questionId : item?.questionId,
        );
        const qType = String(
          (typeof qObj === 'object' ? qObj?.questionType : item?.questionType) ?? '',
        ).toUpperCase();
        const answer = String(
          item?.answer ?? item?.content ?? item?.value ?? item?.answerText ?? '',
        ).trim();

        return {
          key: `${qId ?? 'q'}-${idx}`,
          qId,
          qType,
          title: cleanQuestionTitle(qText || `질문 ${idx + 1}`),
          answer,
        };
      })
      .filter(item => item.title);
  }, [detail?.questionAnswers]);

  const choiceQA = useMemo(() => {
    const resolved: ChoiceQA[] = [];

    normalizedQAs.forEach(item => {
      const isChoiceType = item.qType.includes('CHOICE');
      const isChoiceById = CHOICE_QUESTIONS.some(
        question => question.questionId === item.qId,
      );
      if (!isChoiceType && !isChoiceById) return;

      const normTitle = normalizeQuestionKey(item.title);
      const template = CHOICE_QUESTIONS.find(q => {
        if (item.qId && item.qId === q.questionId) return true;
        if (normTitle.includes(normalizeQuestionKey(q.title))) return true;
        return q.keywords.some(keyword => normTitle.includes(normalizeQuestionKey(keyword)));
      });
      if (!template) return;

      const byCode = getChoiceSideByCode(item.answer);
      const selected =
        byCode ??
        (item.answer === template.left ? 'LEFT' : item.answer === template.right ? 'RIGHT' : null);

      resolved.push({
        id: item.key,
        title: template.title,
        left: template.left,
        right: template.right,
        selected,
      });
    });

    return resolved;
  }, [normalizedQAs]);

  const freeTextQAs = useMemo(() => {
    const choiceKeys = new Set(choiceQA.map(item => item.id));
    return normalizedQAs.filter(item => !choiceKeys.has(item.key));
  }, [choiceQA, normalizedQAs]);

  if (loading || !detail) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  const nameLine = `${detail.nickname}${detail.age ? `(${detail.age})` : ''}${detail.mbti ? `${detail.age ? ' ' : ''}${detail.mbti}` : ''}`;
  const heightText = detail.height ? `키 ${detail.height}cm` : '키 정보 없음';
  const bodyText = detail.bodyType ? `체형 ${BODY_TYPE_LABELS[detail.bodyType] || detail.bodyType}` : '체형 정보 없음';
  const mainPhoto = detail.photos[0]?.imageUrl;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={styles.backText}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isProfileSource ? '프로필' : '연애관 프로필'}</Text>
        </View>

        {isProfileSource && (
          <View style={styles.heroWrap}>
            {mainPhoto ? (
              <Image source={{ uri: mainPhoto }} style={styles.heroImage} />
            ) : (
              <View style={styles.heroPlaceholder}>
                <Text style={styles.heroPlaceholderText}>프로필 사진</Text>
              </View>
            )}
          </View>
        )}

        <View style={[styles.infoCard, !isProfileSource && styles.loveInfoCard]}>
          <Text style={styles.name}>{nameLine}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>🏫 {detail.university || '학교 정보 없음'}</Text>
            {isProfileSource && <Text style={styles.metaRight}>{heightText}</Text>}
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>📍 {detail.region || '지역 정보 없음'}</Text>
            {isProfileSource && <Text style={styles.metaRight}>{bodyText}</Text>}
          </View>
          <Text style={styles.metaText}>{smokingHabitLabels[detail.smoking ?? SmokingHabit.NON_SMOKER]}</Text>
          <Text style={styles.metaText}>{drinkingHabitLabels[detail.drinking ?? DrinkingHabit.NON_DRINKER]}</Text>
          <Text style={styles.reportText}>신고 횟수: 0</Text>
        </View>

        <View style={styles.qaSection}>
          {freeTextQAs.length ? (
            freeTextQAs.map(item => (
              <View key={item.key} style={styles.qaBlock}>
                <Text style={styles.qTitle}>{item.title}</Text>
                <Text style={styles.answer}>{item.answer || '아직 작성된 답변이 없어요.'}</Text>
              </View>
            ))
          ) : (
            <View style={styles.qaBlock}>
              <Text style={styles.qTitle}>자기소개</Text>
              <Text style={styles.answer}>아직 작성된 답변이 없어요.</Text>
            </View>
          )}
        </View>

        {choiceQA.length > 0 && (
          <View style={styles.choiceSection}>
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
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingBottom: 32 },
  header: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 10,
  },
  backText: { color: '#111111', fontSize: 24, fontWeight: '900' },
  headerTitle: { color: '#001A44', fontSize: 15, fontWeight: '900' },
  heroWrap: { width: '100%', height: 360, backgroundColor: '#F1F1F1' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroPlaceholderText: { color: '#999999', fontSize: 16, fontWeight: '800' },
  infoCard: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
  },
  loveInfoCard: { paddingTop: 10 },
  name: { color: '#111111', fontSize: 18, fontWeight: '900', marginBottom: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaText: { color: '#111111', fontSize: 13, fontWeight: '700', lineHeight: 21 },
  metaRight: { color: '#111111', fontSize: 13, fontWeight: '700' },
  reportText: { color: '#666666', fontSize: 11, textAlign: 'right', marginTop: 4 },
  qaSection: { backgroundColor: '#FFFFFF' },
  qaBlock: {
    paddingHorizontal: 20,
    paddingVertical: 22,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  qTitle: { color: '#111111', fontSize: 15, fontWeight: '900', marginBottom: 12 },
  answer: { color: '#111111', fontSize: 13, lineHeight: 21, fontWeight: '500' },
  choiceSection: { paddingHorizontal: 18, paddingTop: 18 },
  choiceBlock: { marginBottom: 16 },
  choiceTitle: { color: '#111111', fontSize: 14, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  choiceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  choiceBtn: {
    flex: 1,
    minHeight: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  choiceIdle: { backgroundColor: '#FFFFFF', borderColor: '#D8D8D8' },
  choiceSelected: { backgroundColor: '#FFD3DA', borderColor: '#FFB5C2' },
  choiceText: { color: '#111111', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  vsText: { color: '#111111', fontSize: 11, fontWeight: '900' },
});

export default ChatProfileDetailScreen;
