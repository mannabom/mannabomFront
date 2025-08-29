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
<<<<<<< HEAD
import {
  personalityQuestions,
  Question,
} from '../../constants/personalityQuestions';
import PersonalityQuestion from '../../components/common/PersonalityQuestion';
=======
import { personalityQuestions } from '../../constants/personalityQuestions';
import PersonalityQuestion from '../../components/profile/PersonalityQuestion';
>>>>>>> b0bbedb60fe0d716d24de4fa1a8a747594047fc8

// 'RelationshipChoices' 인터페이스를 여기에 정의하여 타입 오류를 해결합니다.
export interface RelationshipChoices {
  conflictResolution: RelationshipChoice;
  photoSharing: RelationshipChoice;
  relationshipPriority: RelationshipChoice;
  datePlace: RelationshipChoice;
  jealousyAttitude: RelationshipChoice;
  idealDay: RelationshipChoice;
  attraction: RelationshipChoice;
  friendInteraction: RelationshipChoice;
}

interface PersonalityTestScreenProps {
  onTestComplete: () => void;
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
<<<<<<< HEAD
    if (!isAllAnswered() || isLoading || !profileId) {
      Alert.alert('알림', '모든 질문에 답변해주세요.');
      return;
    }
=======
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
>>>>>>> b0bbedb60fe0d716d24de4fa1a8a747594047fc8

    setIsLoading(true);

    const pointsEarned = Object.keys(answers).length * 5;

    const relationshipData = {
      profileId: profileId,
      relationshipChoices: answers as RelationshipChoices,
      pointsEarned: pointsEarned,
    };

    try {
      const response = await apiClient.post(
        API_ENDPOINTS_LIST.SAVE_PROFILE_RELATIONSHIP,
        relationshipData,
      );

      if (response.data.success) {
        Alert.alert(
          '성향 분석 완료',
          `총 ${pointsEarned} 포인트를 획득했습니다! 회원가입이 완료되었습니다.`,
          [{ text: '확인', onPress: onTestComplete }],
        );
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.headerTitle}>이(二)지선다 질문</Text>
          <Text style={styles.headerSubtitle}>
            {`\u25A0 선택한 답변은 색깔로 표시`}
            {`\n`}
            {`\u25A0 저장 버튼 터치 시 입력된 선택 질문들 계산하여 지급할 포인트 팅 계산`}
          </Text>

          {personalityQuestions.map(q => (
            <PersonalityQuestion
              key={q.id}
              question={q}
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
<<<<<<< HEAD
              {isLoading ? '저장 중...' : '저장'}
            </Text>
          </TouchableOpacity>
=======
              <Text style={styles.submitButtonText}>
                {isLoading ? '저장 중...' : '저장'}
              </Text>
            </TouchableOpacity>
          </View>
>>>>>>> b0bbedb60fe0d716d24de4fa1a8a747594047fc8
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
<<<<<<< HEAD
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  submitButton: {
=======

  submitWrapper: {
    alignItems: 'center',
>>>>>>> b0bbedb60fe0d716d24de4fa1a8a747594047fc8
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
