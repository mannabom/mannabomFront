import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import apiClient from '../../services/apiClient';
import { getProfileId } from '../../utils/AuthUtils';
import { API_ENDPOINTS_LIST } from '../../config/api';

interface DatingQuestionsScreenProps {
  onQuestionsComplete: () => void;
}

const DatingQuestionsScreen: React.FC<DatingQuestionsScreenProps> = ({
  onQuestionsComplete,
}) => {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [meaningOfLove, setMeaningOfLove] = useState('');
  const [soulFood, setSoulFood] = useState('');
  const [dailyAndHoliday, setDailyAndHoliday] = useState('');
  const [idealDate, setIdealDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const characterLimit = 30;

  useEffect(() => {
    const fetchProfileId = async () => {
      const id = await getProfileId();
      setProfileId(id);
    };
    fetchProfileId();
  }, []);

  const isFormValid = () => {
    // 모든 필드가 선택 질문이므로, 필수 입력 체크는 필요에 따라 조정
    // 현재는 모든 필드가 비어있지 않아야 유효한 것으로 간주
    return (
      meaningOfLove.trim().length > 0 &&
      soulFood.trim().length > 0 &&
      dailyAndHoliday.trim().length > 0 &&
      idealDate.trim().length > 0
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      Alert.alert('알림', '모든 항목을 입력해주세요.');
      return;
    }

    if (isLoading || !profileId) {
      Alert.alert('오류', '잠시 후 다시 시도해주세요.');
      return;
    }

    setIsLoading(true);

    const questionsData = {
      profileId: profileId,
      optionalAnswers: {
        meaningOfLove: meaningOfLove.trim() || undefined,
        soulFood: soulFood.trim() || undefined,
        dailyAndHoliday: dailyAndHoliday.trim() || undefined,
        idealDate: idealDate.trim() || undefined,
      },
    };

    try {
      const response = await apiClient.post(
        API_ENDPOINTS_LIST.SAVE_PROFILE_RELATIONSHIP,
        questionsData,
      );

      if (response.data.success) {
        Alert.alert('질문 답변 완료', '다음 단계로 진행합니다.', [
          { text: '확인', onPress: onQuestionsComplete },
        ]);
      } else {
        Alert.alert(
          '오류',
          response.data.message || '질문 답변 저장 중 문제가 발생했습니다.',
        );
      }
    } catch (error) {
      console.error('연애 질문 설정 API 오류:', error);
      Alert.alert('오류', '네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderQuestionInput = (
    question: string,
    value: string,
    onChangeText: (text: string) => void,
  ) => (
    <View style={styles.section}>
      <Text style={styles.questionText}>{question}</Text>
      <View style={styles.answerContainer}>
        <TextInput
          style={styles.answerInput}
          placeholder="답변을 입력해주세요"
          placeholderTextColor="#999"
          value={value}
          onChangeText={onChangeText}
          maxLength={characterLimit}
        />
        <Text style={styles.characterCount}>
          {value.length}/{characterLimit}자
        </Text>
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
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.title}>선택 질문</Text>
            <Text style={styles.subtitle}>
              추가 질문은 프로필에 노출 정보를 선택할 수 있어요!
            </Text>
          </View>

          {renderQuestionInput(
            '나에게 연애란?',
            meaningOfLove,
            setMeaningOfLove,
          )}

          {renderQuestionInput('나의 소울 푸드는?', soulFood, setSoulFood)}

          {renderQuestionInput(
            '나의 하루, 그리고 나의 휴일은?',
            dailyAndHoliday,
            setDailyAndHoliday,
          )}

          {renderQuestionInput('하고 싶은 데이트는?', idealDate, setIdealDate)}

          {/* 제출 버튼 */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isFormValid() && !isLoading
                ? styles.submitButtonActive
                : styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid() || isLoading}
          >
            <Text
              style={[
                styles.submitButtonText,
                isFormValid() && !isLoading
                  ? styles.submitButtonTextActive
                  : styles.submitButtonTextDisabled,
              ]}
            >
              {isLoading ? '저장 중...' : '다음'}
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
    marginBottom: 40,
  },
  stepNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 30,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 15,
    lineHeight: 22,
  },
  answerContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
  },
  answerInput: {
    fontSize: 16,
    color: '#333333',
    minHeight: 50,
    textAlignVertical: 'top',
    paddingVertical: 10,
  },
  characterCount: {
    fontSize: 12,
    color: '#FF6B6B',
    textAlign: 'right',
    marginTop: 5,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
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

export default DatingQuestionsScreen;
