// src/screens/SelfIntroductionScreen.tsx
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

interface SelfIntroductionScreenProps {
  onIntroductionComplete: () => void;
}

const SelfIntroductionScreen: React.FC<SelfIntroductionScreenProps> = ({
  onIntroductionComplete,
}) => {
  const [profileId, setProfileId] = useState<string | null>(null);
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

  useEffect(() => {
    const fetchProfileId = async () => {
      const id = await getProfileId();
      setProfileId(id);
    };
    fetchProfileId();
  }, []);

  const isFormValid = () => {
    return (
      introduction.trim().length >= introductionLimit &&
      charm.trim().length >= charmLimit &&
      ideal.trim().length >= idealLimit
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid() || isLoading || !profileId) {
      Alert.alert('알림', '모든 항목을 올바르게 입력해주세요.');
      return;
    }

    setIsLoading(true);

    const introductionData = {
      profileId: profileId,
      selfIntroduction: introduction.trim(),
      attractivePartnerTrait: charm.trim(),
      desiredPartnerTrait: ideal.trim(),
    };

    try {
      const response = await apiClient.post(
        API_ENDPOINTS_LIST.SAVE_PROFILE_RELATIONSHIP,
        introductionData,
      );

      if (response.data.success) {
        Alert.alert('자기소개 작성 완료', '다음 단계로 진행합니다.', [
          { text: '확인', onPress: onIntroductionComplete },
        ]);
      } else {
        Alert.alert(
          '오류',
          response.data.message || '자기소개 저장 중 문제가 발생했습니다.',
        );
      }
    } catch (error) {
      console.error('자기소개 설정 API 오류:', error);
      Alert.alert('오류', '네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCharacterCountMessage = (
    currentLength: number,
    limit: number,
  ) => {
    const isUnderLimit = currentLength < limit;
    const message = `${currentLength}/${limit}자 이상 입력해주세요`;
    return (
      <Text
        style={[
          styles.characterCount,
          isUnderLimit ? styles.characterCountError : null,
        ]}
      >
        {message}
      </Text>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>자기소개 (필수)</Text>

          <View style={styles.section}>
            <View
              style={[
                styles.inputContainer,
                isIntroFocused ? styles.inputContainerFocused : null,
              ]}
            >
              <TextInput
                style={styles.textArea}
                placeholder="자기소개를 입력해주세요"
                placeholderTextColor="#999"
                value={introduction}
                onChangeText={setIntroduction}
                multiline={true}
                maxLength={introductionLimit}
                textAlignVertical="top"
                onFocus={() => setIsIntroFocused(true)}
                onBlur={() => setIsIntroFocused(false)}
              />
              {renderCharacterCountMessage(
                introduction.length,
                introductionLimit,
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>
              나를 설레게하는 이성의 매력? (필수)
            </Text>
            <View
              style={[
                styles.inputContainer,
                isCharmFocused ? styles.inputContainerFocused : null,
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="매력 포인트를 입력해주세요"
                placeholderTextColor="#999"
                value={charm}
                onChangeText={setCharm}
                maxLength={charmLimit}
                onFocus={() => setIsCharmFocused(true)}
                onBlur={() => setIsCharmFocused(false)}
              />
              {renderCharacterCountMessage(charm.length, charmLimit)}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>
              연인에게 꼭 바라는 한가지는? (필수)
            </Text>
            <View
              style={[
                styles.inputContainer,
                isIdealFocused ? styles.inputContainerFocused : null,
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="바라는 점을 입력해주세요"
                placeholderTextColor="#999"
                value={ideal}
                onChangeText={setIdeal}
                maxLength={idealLimit}
                onFocus={() => setIsIdealFocused(true)}
                onBlur={() => setIsIdealFocused(false)}
              />
              {renderCharacterCountMessage(ideal.length, idealLimit)}
            </View>
          </View>

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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 30,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 15,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    marginBottom: 10,
  },
  inputContainerFocused: {
    borderColor: '#FF6B6B',
  },
  input: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333333',
    minHeight: 50,
  },
  textArea: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333333',
    minHeight: 120,
    maxHeight: 180,
  },
  characterCount: {
    fontSize: 12,
    color: '#999999',
    marginTop: 5,
    textAlign: 'right',
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  characterCountError: {
    color: '#FF6B6B',
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

export default SelfIntroductionScreen;
