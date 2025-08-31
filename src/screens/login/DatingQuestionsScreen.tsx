// src/screens/DatingQuestionsScreen.tsx
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

  const [isMeaningOfLoveFocused, setIsMeaningOfLoveFocused] = useState(false);
  const [isSoulFoodFocused, setIsSoulFoodFocused] = useState(false);
  const [isDailyAndHolidayFocused, setIsDailyAndHolidayFocused] =
    useState(false);
  const [isIdealDateFocused, setIsIdealDateFocused] = useState(false);

  const characterLimit = 30;

  useEffect(() => {
    const fetchProfileId = async () => {
      const id = await getProfileId();
      setProfileId(id);
    };
    fetchProfileId();
  }, []);

  const isFormValid = () => {
    return true; // 모든 질문이 선택 사항이므로
  };

  const handleSubmit = async () => {
    if (isLoading || !profileId) {
      Alert.alert('오류', '잠시 후 다시 시도해주세요.');
      return;
    }

    setIsLoading(true);

    // 각 입력의 글자수를 확인하여 포인트 계산
    const completedAnswers = [
      meaningOfLove.trim().length >= characterLimit ? 'meaningOfLove' : null,
      soulFood.trim().length >= characterLimit ? 'soulFood' : null,
      dailyAndHoliday.trim().length >= characterLimit
        ? 'dailyAndHoliday'
        : null,
      idealDate.trim().length >= characterLimit ? 'idealDate' : null,
    ].filter(Boolean);

    const pointsEarned = completedAnswers.length * 15; // 각 완료된 답변당 15포인트

    const questionsData = {
      profileId: profileId,
      optionalAnswers: {
        meaningOfLove:
          meaningOfLove.trim().length >= characterLimit
            ? meaningOfLove.trim()
            : undefined,
        soulFood:
          soulFood.trim().length >= characterLimit
            ? soulFood.trim()
            : undefined,
        dailyAndHoliday:
          dailyAndHoliday.trim().length >= characterLimit
            ? dailyAndHoliday.trim()
            : undefined,
        idealDate:
          idealDate.trim().length >= characterLimit
            ? idealDate.trim()
            : undefined,
      },
      pointsEarned: pointsEarned,
    };

    try {
      const response = await apiClient.post(
        API_ENDPOINTS_LIST.SAVE_PROFILE_RELATIONSHIP,
        questionsData,
      );

      if (response.data.success) {
        const message =
          pointsEarned > 0
            ? `선택 질문을 완료했습니다! ${pointsEarned} 포인트를 획득했습니다.`
            : '선택 질문을 건너뜁니다.';

        Alert.alert('질문 답변 완료', message, [
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

  const renderCharacterCountMessage = (currentLength: number) => {
    const isUnderLimit = currentLength < characterLimit;
    const message = `${characterLimit}자 이상 입력해주세요`;
    return (
      isUnderLimit && (
        <Text style={[styles.characterCount, styles.characterCountError]}>
          {message}
        </Text>
      )
    );
  };

  const renderQuestionInput = (
    question: string,
    value: string,
    onChangeText: (text: string) => void,
    isFocused: boolean,
    onFocus: () => void,
    onBlur: () => void,
  ) => (
    <View style={styles.section}>
      <Text style={styles.questionText}>{question} (선택)</Text>
      <View
        style={[
          styles.answerContainer,
          isFocused ? styles.answerContainerFocused : null,
        ]}
      >
        <TextInput
          style={styles.answerInput}
          placeholder="입력 완료 시 15 포인트 팅 지급!"
          placeholderTextColor="#999"
          value={value}
          onChangeText={onChangeText}
          maxLength={characterLimit}
          textAlignVertical="top"
          onFocus={onFocus}
          onBlur={onBlur}
        />
        <View style={styles.characterCountContainer}>
          <Text style={styles.characterCount}>
            {value.length}/{characterLimit}자
          </Text>
          {renderCharacterCountMessage(value.length)}
        </View>
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
            <Text style={styles.title}>
              선택 질문들
              <Text style={styles.titleSub}> (서술형)</Text>
            </Text>
            <Text style={styles.subtitle}>
              추가 질문을 완료하면 추가 팅을 받을 수 있어요!
            </Text>
          </View>

          {renderQuestionInput(
            '나에게 연애란?',
            meaningOfLove,
            setMeaningOfLove,
            isMeaningOfLoveFocused,
            () => setIsMeaningOfLoveFocused(true),
            () => setIsMeaningOfLoveFocused(false),
          )}

          {renderQuestionInput(
            '나의 소울 푸드는?',
            soulFood,
            setSoulFood,
            isSoulFoodFocused,
            () => setIsSoulFoodFocused(true),
            () => setIsSoulFoodFocused(false),
          )}

          {renderQuestionInput(
            '나의 하루, 그리고 나의 휴일은?',
            dailyAndHoliday,
            setDailyAndHoliday,
            isDailyAndHolidayFocused,
            () => setIsDailyAndHolidayFocused(true),
            () => setIsDailyAndHolidayFocused(false),
          )}

          {renderQuestionInput(
            '하고 싶은 데이트는?',
            idealDate,
            setIdealDate,
            isIdealDateFocused,
            () => setIsIdealDateFocused(true),
            () => setIsIdealDateFocused(false),
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              isFormValid() && !isLoading
                ? styles.submitButtonActive
                : styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
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
    marginBottom: 5,
    textAlign: 'center',
  },
  titleSub: {
    fontSize: 14,
    color: '#666666',
    fontWeight: 'normal',
  },
  subtitle: {
    fontSize: 14,
    color: '#FF6B6B',
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
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 15,
  },
  answerContainerFocused: {
    borderColor: '#FF6B6B',
  },
  answerInput: {
    fontSize: 16,
    color: '#333333',
    minHeight: 50,
    textAlignVertical: 'top',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  characterCountContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 5,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  characterCountError: {
    color: '#FF6B6B',
    marginLeft: 10,
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
