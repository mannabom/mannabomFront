// src/screens/login/PersonalityTestScreen.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveRelationshipChoices,
  RelationshipChoicesData,
} from '../../utils/ProfileStorage';

interface PersonalityTestScreenProps {
  onTestComplete: () => void;
}

type Choice = 'LEFT' | 'RIGHT';
type AnswerMap = Record<string, Choice | null>;

const RAW_STORAGE_KEY = 'optional_this_or_that_answers_v1';

const QUESTIONS = [
  {
    id: 'fight',
    title: '연인과 싸웠을 때',
    left: '바로 풀고 싶다',
    right: '시간을 좀 가지고 싶다',
  },
  {
    id: 'photo',
    title: '연인과 함께한 사진',
    left: 'SNS에 공유해도 된다',
    right: 'SNS에 공유하기 싫다',
  },
  {
    id: 'important',
    title: '연애에서 더 중요한 것은',
    left: '편안함',
    right: '설렘',
  },
  {
    id: 'date',
    title: '연인과의 데이트에서',
    left: '실내에서 데이트하기',
    right: '실외에서 데이트하기',
  },
  {
    id: 'jealousy',
    title: '연애에서 적당한 질투가',
    left: '있어야 재미있다',
    right: '쿨한 게 편하다',
  },
  {
    id: 'idealDay',
    title: '연인과의 이상적인 하루는',
    left: '편한 일상 즐기기',
    right: '새로운 경험 해보기',
  },
  {
    id: 'attracted',
    title: '연인에게 주로 끌리는 모습은',
    left: '배려심 넘치는 모습',
    right: '주도적인 모습',
  },
  {
    id: 'friends',
    title: '연인이 내 친구들과',
    left: '어울리며 놀기',
    right: '따로 놀기',
  },
] as const;

const toText = (q: (typeof QUESTIONS)[number], choice: Choice | null) => {
  if (!choice) return '';
  return choice === 'LEFT' ? q.left : q.right;
};

const buildRelationshipChoices = (
  answers: AnswerMap,
): RelationshipChoicesData => {
  const byId = (id: (typeof QUESTIONS)[number]['id']) =>
    QUESTIONS.find(q => q.id === id)!;

  return {
    conflictResolution: toText(byId('fight'), answers.fight),
    photoSharing: toText(byId('photo'), answers.photo),
    relationshipPriority: toText(byId('important'), answers.important),
    datePlace: toText(byId('date'), answers.date),
    jealousyAttitude: toText(byId('jealousy'), answers.jealousy),
    idealDay: toText(byId('idealDay'), answers.idealDay),
    attraction: toText(byId('attracted'), answers.attracted),
    friendInteraction: toText(byId('friends'), answers.friends),
  };
};

const PersonalityTestScreen: React.FC<PersonalityTestScreenProps> = ({
  onTestComplete,
}) => {
  const [answers, setAnswers] = useState<AnswerMap>(() => {
    const init: AnswerMap = {};
    QUESTIONS.forEach(q => (init[q.id] = null));
    return init;
  });

  const [isLoading, setIsLoading] = useState(false);

  const answeredCount = useMemo(() => {
    return Object.values(answers).filter(v => v !== null).length;
  }, [answers]);

  const handleSelect = (id: string, choice: Choice) => {
    setAnswers(prev => ({
      ...prev,
      [id]: prev[id] === choice ? null : choice,
    }));
  };

  const handleSave = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      // 1) 원본 답변 저장
      await AsyncStorage.setItem(RAW_STORAGE_KEY, JSON.stringify(answers));

      // 2) 서버 제출용 형태로 변환해서 저장
      const relationshipChoices = buildRelationshipChoices(answers);
      await saveRelationshipChoices(relationshipChoices);

      // ✅ 성공 팝업 제거: 저장 성공하면 바로 다음
      console.log('[PersonalityTest] saved', {
        answeredCount,
        pointsEarned: answeredCount * 5,
      });
      onTestComplete();
    } catch (e) {
      console.error('성향 테스트 저장 오류:', e);
      Alert.alert('오류', '저장 중 문제가 발생했어요.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderQuestion = (q: (typeof QUESTIONS)[number]) => {
    const selected = answers[q.id];
    const leftSelected = selected === 'LEFT';
    const rightSelected = selected === 'RIGHT';

    return (
      <View key={q.id} style={styles.questionBlock}>
        <Text style={styles.questionTitle}>
          {q.title} <Text style={styles.optionalText}>(선택 시 5P)</Text>
        </Text>

        <View style={styles.choiceRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleSelect(q.id, 'LEFT')}
            style={[
              styles.choiceButton,
              leftSelected
                ? styles.choiceButtonSelected
                : styles.choiceButtonIdle,
            ]}
          >
            <Text
              style={[
                styles.choiceText,
                leftSelected
                  ? styles.choiceTextSelected
                  : styles.choiceTextIdle,
              ]}
              numberOfLines={1}
            >
              {q.left}
            </Text>
          </TouchableOpacity>

          <Text style={styles.vsText}>VS</Text>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleSelect(q.id, 'RIGHT')}
            style={[
              styles.choiceButton,
              rightSelected
                ? styles.choiceButtonSelected
                : styles.choiceButtonIdle,
            ]}
          >
            <Text
              style={[
                styles.choiceText,
                rightSelected
                  ? styles.choiceTextSelected
                  : styles.choiceTextIdle,
              ]}
              numberOfLines={1}
            >
              {q.right}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.page}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {QUESTIONS.map(renderQuestion)}
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSave}
            disabled={isLoading}
            style={[
              styles.saveButton,
              isLoading ? styles.saveButtonDisabled : styles.saveButtonActive,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#333333" />
            ) : (
              <Text style={styles.saveButtonText}>저장</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const PINK = '#FFB6C1';
const BORDER = '#D9D9D9';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  page: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 100,
  },

  questionBlock: { marginBottom: 18 },
  questionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
    marginBottom: 12,
  },
  optionalText: { fontSize: 13, fontWeight: '600', color: '#666' },

  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#666',
    marginHorizontal: 12,
  },

  choiceButton: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  choiceButtonIdle: { backgroundColor: '#FFF', borderColor: BORDER },
  choiceButtonSelected: { backgroundColor: PINK, borderColor: PINK },

  choiceText: { fontSize: 14, fontWeight: '700' },
  choiceTextIdle: { color: '#222' },
  choiceTextSelected: { color: '#222' },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 14,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  saveButton: {
    width: '33%',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonActive: { backgroundColor: PINK },
  saveButtonDisabled: { backgroundColor: '#EAEAEA' },
  saveButtonText: { fontSize: 14, fontWeight: '700', color: '#333' },
});

export default PersonalityTestScreen;
