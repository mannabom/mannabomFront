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

  const handleSubmit = async () => {
    // 저장 API를 사용할 때는 아래 주석을 풀고 사용하세요.
    // if (isLoading || !profileId) {
    //   Alert.alert('알림', '프로필 정보를 확인해주세요.');
    //   return;
    // }
    // setIsLoading(true);
    // const relationshipData = {
    //   profileId,
    //   relationshipChoices: answers as RelationshipChoices, // 일부만 있어도 서버가 허용한다면 OK
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

          <View style={styles.submitWrapper}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                isLoading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isLoading} // 로딩중에만 비활성화
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? '저장 중...' : '저장'}
              </Text>
            </TouchableOpacity>
          </View>
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

  submitWrapper: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 10,
  },

  submitButton: {
    width: 125,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#FFB6C1',
    opacity: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitButtonDisabled: {
    opacity: 0.6,
  },

  submitButtonText: {
    fontFamily: 'ABeeZee',
    fontWeight: '400',
    fontStyle: 'normal',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.23,
    color: '#02113C',
  },
});

export default PersonalityTestScreen;
