// src/screens/SelfIntroductionScreen.tsx
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  saveSelfIntroduction,
  SelfIntroductionData,
} from '../../utils/ProfileStorage';

interface SelfIntroductionScreenProps {
  onIntroductionComplete: () => void;
}

const SelfIntroductionScreen: React.FC<SelfIntroductionScreenProps> = ({
  onIntroductionComplete,
}) => {
  const [introduction, setIntroduction] = useState('');
  const [charm, setCharm] = useState('');
  const [ideal, setIdeal] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [isIntroFocused, setIsIntroFocused] = useState(false);
  const [isCharmFocused, setIsCharmFocused] = useState(false);
  const [isIdealFocused, setIsIdealFocused] = useState(false);

  const introductionLimit = 100;
  const charmLimit = 30;
  const idealLimit = 30;

  const isFormValid = () => {
    return (
      introduction.trim().length >= introductionLimit &&
      charm.trim().length >= charmLimit &&
      ideal.trim().length >= idealLimit
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid() || isLoading) {
      Alert.alert('알림', '모든 항목을 올바르게 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const introductionData: SelfIntroductionData = {
        selfIntroduction: introduction.trim(),
        attractivePartnerTrait: charm.trim(),
        desiredPartnerTrait: ideal.trim(),
      };

      await saveSelfIntroduction(introductionData);

      Alert.alert('자기소개 작성 완료', '다음 단계로 진행합니다.', [
        { text: '확인', onPress: onIntroductionComplete },
      ]);
    } catch (error) {
      console.error('자기소개 저장 오류:', error);
      Alert.alert('오류', '자기소개 저장 중 문제가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ “빈칸 밖”에 핑크색 안내문 (100자 넘어도 입력 가능하도록 maxLength 제거)
  const renderMinLengthHint = (currentLength: number, limit: number) => {
    const isOk = currentLength >= limit;
    return (
      <Text style={[styles.hintText, !isOk ? styles.hintTextPink : null]}>
        {limit}자 이상 입력해주세요
      </Text>
    );
  };

  const submitEnabled = isFormValid() && !isLoading;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={styles.screen}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ✅ 세로 공간을 적당히 사용해서 아래 빈 공간 과하게 안 남게 */}
            <View style={styles.form}>
              {/* 1) 자기소개 */}
              <View style={styles.section}>
                <Text style={styles.label}>자기소개 (필수)</Text>

                <View
                  style={[
                    styles.inputBox,
                    isIntroFocused ? styles.inputBoxFocused : null,
                  ]}
                >
                  <TextInput
                    style={styles.textArea}
                    placeholder="자기소개를 입력해주세요"
                    placeholderTextColor="#999"
                    value={introduction}
                    onChangeText={setIntroduction}
                    multiline
                    textAlignVertical="top"
                    onFocus={() => setIsIntroFocused(true)}
                    onBlur={() => setIsIntroFocused(false)}
                    // ✅ 100자 넘어도 입력 가능
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                </View>

                {renderMinLengthHint(introduction.trim().length, introductionLimit)}
              </View>

              {/* 2) 매력 */}
              <View style={styles.section}>
                <Text style={styles.label}>나를 설레게하는 이성의 매력? (필수)</Text>

                <View
                  style={[
                    styles.inputBox,
                    isCharmFocused ? styles.inputBoxFocused : null,
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="매력 포인트를 입력해주세요"
                    placeholderTextColor="#999"
                    value={charm}
                    onChangeText={setCharm}
                    onFocus={() => setIsCharmFocused(true)}
                    onBlur={() => setIsCharmFocused(false)}
                    // ✅ 30자 넘어도 입력 가능
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                </View>

                {renderMinLengthHint(charm.trim().length, charmLimit)}
              </View>

              {/* 3) 한 가지 */}
              <View style={[styles.section, styles.sectionLast]}>
                <Text style={styles.label}>연인에게 꼭 바라는 한가지는? (필수)</Text>

                <View
                  style={[
                    styles.inputBox,
                    isIdealFocused ? styles.inputBoxFocused : null,
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="바라는 점을 입력해주세요"
                    placeholderTextColor="#999"
                    value={ideal}
                    onChangeText={setIdeal}
                    onFocus={() => setIsIdealFocused(true)}
                    onBlur={() => setIsIdealFocused(false)}
                    // ✅ 30자 넘어도 입력 가능
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                </View>

                {renderMinLengthHint(ideal.trim().length, idealLimit)}
              </View>
            </View>
          </ScrollView>

          {/* ✅ “다음” 버튼 하단 고정 + 가로 1/3 + 가운데 정렬 */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                submitEnabled ? styles.submitButtonActive : styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!submitEnabled}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.submitButtonText,
                  submitEnabled ? styles.submitButtonTextActive : styles.submitButtonTextDisabled,
                ]}
              >
                {isLoading ? '저장 중...' : '다음'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const FOOTER_HEIGHT = 92;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screen: {
    flex: 1,
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: FOOTER_HEIGHT + 12, // ✅ 버튼에 가리지 않게
  },

  // ✅ 세로 공간을 적당히 쓰도록 3개 섹션을 분산
  form: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },

  section: {
    marginBottom: 22,
  },
  sectionLast: {
    marginBottom: 0,
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 10,
    textAlign: 'left',
  },

  inputBox: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  inputBoxFocused: {
    borderColor: '#FFB6C1',
  },

  input: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#333333',
    minHeight: 48,
  },

  textArea: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#333333',
    minHeight: 120,
    maxHeight: 180,
  },

  // ✅ “빈칸 밖” 핑크 문구
  hintText: {
    marginTop: 10,
    fontSize: 12,
    color: '#C0C0C0',
    textAlign: 'left',
  },
  hintTextPink: {
    color: '#FFB6C1',
    fontWeight: '600',
  },

  // ✅ 하단 고정 버튼
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingBottom: 18,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
  },

  submitButton: {
    width: '33.33%',
    alignSelf: 'center',
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
    fontSize: 14,
    fontWeight: '700',
  },
  submitButtonTextActive: {
    color: '#FFFFFF',
  },
  submitButtonTextDisabled: {
    color: '#999999',
  },
});

export default SelfIntroductionScreen;
