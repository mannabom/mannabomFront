// src/screens/login/DatingQuestionsScreen.tsx
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

const FOOTER_HEIGHT = 92;
const PINK = '#FFB6C1';

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
    isLast?: boolean,
  ) => (
    <View style={[styles.section, isLast ? styles.sectionLast : null]}>
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
          multiline
          textAlignVertical="top"
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </View>

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
          keyboardShouldPersistTaps="handled"
        >
          {/* ✅ 남는 세로 공간을 적당히 분산해서 “꽉 찬 느낌” */}
          <View style={styles.form}>
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
              true,
            )}
          </View>
        </ScrollView>

        {/* ✅ 다음 버튼: 하단 고정 */}
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
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },

  // ✅ 핵심: flexGrow + footer 높이만큼 paddingBottom
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: FOOTER_HEIGHT + 12,
  },

  // ✅ 남는 세로 공간을 적당히 분배
  form: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },

  section: {
    marginBottom: 18, // 너무 벌어지지 않게 조절 (space-between이 남는 공간 분산)
  },
  sectionLast: {
    marginBottom: 0,
  },

  // ✅ 타이포 살짝 키워서 꽉 찬 느낌
  questionText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 10,
    lineHeight: 24,
  },
  optionalText: {
    color: '#BDBDBD',
    fontWeight: '400',
  },

  // ✅ 입력 박스 자체 높이를 키워서 “내용이 있어 보이게”
  answerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 84,
  },
  answerContainerFocused: {
    borderColor: PINK,
  },
  answerInput: {
    fontSize: 16,
    color: '#333333',
    minHeight: 56,
    paddingVertical: 0,
    paddingHorizontal: 0,
    lineHeight: 22,
  },

  hintText: {
    marginTop: 10,
    marginLeft: 2,
    fontSize: 12,
    color: '#FF6B6B',
    textAlign: 'left',
  },

  // ✅ footer 하단 고정
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    height: FOOTER_HEIGHT,
    justifyContent: 'center',
  },

  submitButton: {
    alignSelf: 'center',
    width: '33%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonActive: {
    backgroundColor: PINK,
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
