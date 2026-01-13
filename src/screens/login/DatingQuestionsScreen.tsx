// src/screens/DatingQuestionsScreen.tsx
import React, { useState } from 'react';
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
import {
  saveOptionalAnswers,
  OptionalAnswersData,
} from '../../utils/ProfileStorage';

interface DatingQuestionsScreenProps {
  onQuestionsComplete: () => void;
}

const DatingQuestionsScreen: React.FC<DatingQuestionsScreenProps> = ({
  onQuestionsComplete,
}) => {
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

  const handleSubmit = async () => {
    if (isLoading) {
      Alert.alert('오류', '잠시 후 다시 시도해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      // 30자 이상 작성한 것만 저장 + 포인트 계산
      const completedAnswers = [
        meaningOfLove.trim().length >= characterLimit ? 'meaningOfLove' : null,
        soulFood.trim().length >= characterLimit ? 'soulFood' : null,
        dailyAndHoliday.trim().length >= characterLimit
          ? 'dailyAndHoliday'
          : null,
        idealDate.trim().length >= characterLimit ? 'idealDate' : null,
      ].filter(Boolean);

      const pointsEarned = completedAnswers.length * 15;

      const questionsData: OptionalAnswersData = {
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
      };

      await saveOptionalAnswers(questionsData);

      const message =
        pointsEarned > 0
          ? `선택 질문을 완료했습니다! ${pointsEarned} 포인트를 획득했습니다.`
          : '선택 질문을 건너뜁니다.';

      Alert.alert('질문 답변 완료', message, [
        { text: '확인', onPress: onQuestionsComplete },
      ]);
    } catch (error) {
      console.error('선택 질문 저장 오류:', error);
      Alert.alert('오류', '질문 답변 저장 중 문제가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderMinCharsHint = (value: string) => {
    const under = value.trim().length < characterLimit;
    return under ? (
      <Text style={styles.hintText}>{characterLimit}자 이상 입력해주세요</Text>
    ) : null;
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
      <Text style={styles.questionText}>
        {question}
        <Text style={styles.optionalText}> (선택)</Text>
      </Text>

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
          // ✅ 30자 이상도 입력 가능하게 (maxLength 제거)
          multiline
          textAlignVertical="top"
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </View>

      {/* ✅ “30자 이상…”은 박스 밖 + 왼쪽 아래 + 핑크 */}
      {renderMinCharsHint(value)}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.page}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
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
        </ScrollView>

        {/* ✅ 다음 버튼: 아래 고정 + 가로 1/3 + 가운데 */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              !isLoading ? styles.submitButtonActive : styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.submitButtonText,
                !isLoading
                  ? styles.submitButtonTextActive
                  : styles.submitButtonTextDisabled,
              ]}
            >
              {isLoading ? '저장 중...' : '다음'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  page: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    // ✅ 버튼이 아래 고정이라 스크롤 내용이 버튼에 가리지 않게 여유
    paddingBottom: 120,
  },

  section: {
    marginBottom: 34, // ✅ 질문끼리 거리 좀 줌
  },

  questionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 12,
    lineHeight: 22,
  },
  optionalText: {
    color: '#BDBDBD', // ✅ (선택) 연한 회색
    fontWeight: '400',
  },

  answerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  answerContainerFocused: {
    borderColor: '#FFB6C1',
  },
  answerInput: {
    fontSize: 15,
    color: '#333333',
    minHeight: 44,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },

  hintText: {
    marginTop: 8,
    marginLeft: 2,
    fontSize: 12,
    color: '#FF6B6B', // ✅ 핑크 경고 문구
    textAlign: 'left', // ✅ 왼쪽 하단
  },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
  },

  submitButton: {
    alignSelf: 'center',
    width: '33%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonActive: {
    backgroundColor: '#FFB6C1',
  },
  submitButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  submitButtonTextActive: {
    color: '#333333',
  },
  submitButtonTextDisabled: {
    color: '#999999',
  },
});

export default DatingQuestionsScreen;
