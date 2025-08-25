// src/screens/PersonalityTestScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import apiClient from '../../services/apiClient';
import { getProfileId } from '../../utils/AuthUtils';
import { API_ENDPOINTS_LIST } from '../../config/api';
import { RelationshipChoice } from '../../types/Profile';

interface PersonalityTestScreenProps {
  onTestComplete: () => void;
}

interface Question {
  id: keyof RelationshipChoices;
  question: string;
  options: [string, string];
  choiceEnum: [RelationshipChoice, RelationshipChoice];
}

interface RelationshipChoices {
  conflictResolution: RelationshipChoice;
  photoSharing: RelationshipChoice;
  relationshipPriority: RelationshipChoice;
  datePlace: RelationshipChoice;
  jealousyAttitude: RelationshipChoice;
  idealDay: RelationshipChoice;
  attraction: RelationshipChoice;
  friendInteraction: RelationshipChoice;
}

const PersonalityTestScreen: React.FC<PersonalityTestScreenProps> = ({
  onTestComplete,
}) => {
  const questions: Question[] = [
    {
      id: 'conflictResolution',
      question: '갈등 해결 방식',
      options: ['바로 풀고 싶다', '시간을 갖고 싶다'],
      choiceEnum: [
        RelationshipChoice.IMMEDIATE_RESOLVE,
        RelationshipChoice.TAKE_TIME,
      ],
    },
    {
      id: 'photoSharing',
      question: '연인과 함께한 사진 공유',
      options: ['SNS에 공유 OK', '둘만의 추억으로'],
      choiceEnum: [
        RelationshipChoice.SNS_SHARE_OK,
        RelationshipChoice.PRIVATE_MEMORY,
      ],
    },
    {
      id: 'relationshipPriority',
      question: '연애에서 중요한 것',
      options: ['편안함', '설렘'],
      choiceEnum: [RelationshipChoice.COMFORT, RelationshipChoice.EXCITEMENT],
    },
    {
      id: 'datePlace',
      question: '연인과의 데이트 장소',
      options: ['실내', '실외'],
      choiceEnum: [RelationshipChoice.INDOOR, RelationshipChoice.OUTDOOR],
    },
    {
      id: 'jealousyAttitude',
      question: '질투에 대한 태도',
      options: ['적당한 질투가 재미있다', '질투 없이 쿨한 게 편하다'],
      choiceEnum: [
        RelationshipChoice.MODERATE_JEALOUSY,
        RelationshipChoice.COOL_ATTITUDE,
      ],
    },
    {
      id: 'idealDay',
      question: '이상적인 하루',
      options: ['같이 있는 편안한 일상', '새로운 경험을 찾아가는 하루'],
      choiceEnum: [
        RelationshipChoice.COMFORTABLE_DAILY,
        RelationshipChoice.NEW_EXPERIENCE,
      ],
    },
    {
      id: 'attraction',
      question: '연인에게 끌리는 점',
      options: ['상대의 배려', '상대의 자기 주관'],
      choiceEnum: [
        RelationshipChoice.CONSIDERATION,
        RelationshipChoice.STRONG_OPINION,
      ],
    },
    {
      id: 'friendInteraction',
      question: '친구와의 관계',
      options: ['자연스럽게 잘 어울렸으면', '따로 노는 게 편하다'],
      choiceEnum: [
        RelationshipChoice.MIX_WELL,
        RelationshipChoice.SEPARATE_CIRCLE,
      ],
    },
  ];

  const [profileId, setProfileId] = useState<string | null>(null);
  // answers 상태 타입을 RelationshipChoices로 변경
  const [answers, setAnswers] = useState<Partial<RelationshipChoices>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProfileId = async () => {
      const id = await getProfileId();
      setProfileId(id);
    };
    fetchProfileId();
  }, []);

  const handleAnswer = (
    questionId: keyof RelationshipChoices,
    optionIndex: number,
  ) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: questions.find(q => q.id === questionId)!.choiceEnum[
        optionIndex
      ],
    }));
  };

  const isAllAnswered = () => {
    // answers 객체가 RelationshipChoices의 모든 키를 가지고 있는지 확인
    const allKeys = questions.map(q => q.id);
    return allKeys.every(
      key => answers.hasOwnProperty(key) && answers[key] !== undefined,
    );
  };

  const handleSubmit = async () => {
    if (!isAllAnswered() || isLoading || !profileId) {
      Alert.alert('알림', '모든 질문에 답변해주세요.');
      return;
    }

    setIsLoading(true);

    const relationshipData = {
      profileId: profileId,
      // answers의 모든 키가 채워졌으므로 안전하게 타입 변환 가능
      relationshipChoices: answers as RelationshipChoices,
    };

    try {
      const response = await apiClient.post(
        API_ENDPOINTS_LIST.SAVE_PROFILE_RELATIONSHIP,
        relationshipData,
      );

      if (response.data.success) {
        Alert.alert('성향 분석 완료', '회원가입이 완료되었습니다!', [
          { text: '확인', onPress: onTestComplete },
        ]);
      } else {
        Alert.alert(
          '오류',
          response.data.message || '성향 테스트 저장 중 문제가 발생했습니다.',
        );
      }
    } catch (error) {
      console.error('성향 테스트 설정 API 오류:', error);
      Alert.alert('오류', '네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderQuestion = (question: Question, index: number) => (
    <View key={question.id} style={styles.questionContainer}>
      <Text style={styles.questionNumber}>{index + 1}</Text>
      <Text style={styles.questionText}>{question.question}</Text>

      <View style={styles.optionsContainer}>
        {question.options.map((option, optionIndex) => (
          <TouchableOpacity
            key={optionIndex}
            style={[
              styles.optionButton,
              answers[question.id] === question.choiceEnum[optionIndex]
                ? styles.optionButtonSelected
                : styles.optionButtonDefault,
            ]}
            onPress={() => handleAnswer(question.id, optionIndex)}
          >
            <Text
              style={[
                styles.optionText,
                answers[question.id] === question.choiceEnum[optionIndex]
                  ? styles.optionTextSelected
                  : styles.optionTextDefault,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.stepNumber}>4</Text>
            <Text style={styles.title}>연애관 필수 질문</Text>
          </View>

          {questions.map((question, index) => renderQuestion(question, index))}

          {/* 제출 버튼 */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isAllAnswered() && !isLoading
                ? styles.submitButtonActive
                : styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isAllAnswered() || isLoading}
          >
            <Text
              style={[
                styles.submitButtonText,
                isAllAnswered() && !isLoading
                  ? styles.submitButtonTextActive
                  : styles.submitButtonTextDisabled,
              ]}
            >
              {isLoading ? '저장 중...' : '회원가입 완료'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  stepNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    lineHeight: 24,
  },
  questionContainer: {
    marginBottom: 25,
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 15,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 10,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionButtonDefault: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E0E0',
  },
  optionButtonSelected: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  optionTextDefault: {
    color: '#666666',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  submitButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  submitButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonTextActive: {
    color: '#FFFFFF',
  },
  submitButtonTextDisabled: {
    color: '#999999',
  },
});

export default PersonalityTestScreen;
