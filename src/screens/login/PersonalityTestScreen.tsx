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
import { personalityQuestions } from '../../constants/personalityQuestions';
import PersonalityQuestion from '../../components/common/PersonalityQuestion';

interface PersonalityTestScreenProps {
  onTestComplete: () => void;
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
  const [profileId, setProfileId] = useState<string | null>(null);
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
    value: RelationshipChoice,
  ) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const isAllAnswered = () =>
    personalityQuestions.every(
      q => answers.hasOwnProperty(q.id) && answers[q.id] !== undefined,
    );

  const handleSubmit = async () => {
    // if (!isAllAnswered() || isLoading || !profileId) {
    //   Alert.alert('알림', '모든 질문에 답변해주세요.');
    //   return;
    // }
    // setIsLoading(true);
    // const relationshipData = {
    //   profileId: profileId,
    //   // answers의 모든 키가 채워졌으므로 안전하게 타입 변환 가능
    //   relationshipChoices: answers as RelationshipChoices,
    // };
    // try {
    //   const response = await apiClient.post(
    //     API_ENDPOINTS_LIST.SAVE_PROFILE_RELATIONSHIP,
    //     relationshipData,
    //   );
    //   if (response.data.success) {
    //     Alert.alert('성향 분석 완료', '회원가입이 완료되었습니다!', [
    //       { text: '확인', onPress: onTestComplete },
    //     ]);
    //   } else {
    //     Alert.alert(
    //       '오류',
    //       response.data.message || '성향 테스트 저장 중 문제가 발생했습니다.',
    //     );
    //   }
    // } catch (error) {
    //   console.error('성향 테스트 설정 API 오류:', error);
    //   Alert.alert('오류', '네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    // } finally {
    //   setIsLoading(false);
    // }

    onTestComplete();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {personalityQuestions.map((q, i) => (
            <PersonalityQuestion
              key={q.id}
              question={q}
              index={i}
              selected={answers[q.id]}
              onSelect={handleAnswer}
            />
          ))}

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
    color: '#02113C',
    textAlign: 'center',
    lineHeight: 24,
  },

  // 버튼 스타일
  submitButton: {
    marginTop: 30,
    marginBottom: 10,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
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
