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
import apiClient from '../services/apiClient';
import { getProfileId } from '../utils/AuthUtils';
import { API_ENDPOINTS_LIST } from '../config/api';

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
      introduction.trim().length > 0 &&
      charm.trim().length > 0 &&
      ideal.trim().length > 0
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid() || isLoading || !profileId) {
      Alert.alert('알림', '모든 항목을 입력해주세요.');
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
      // API 엔드포인트는 ProfileSetupScreen과 동일할 수 있습니다.
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>자기소개 (필수)</Text>

          {/* 자기소개 입력 */}
          <View style={styles.section}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="자기소개를 입력해주세요"
                placeholderTextColor="#999"
                value={introduction}
                onChangeText={setIntroduction}
                multiline={true}
                maxLength={introductionLimit}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>
                {introduction.length}/{introductionLimit}자 이상 입력해주세요
              </Text>
            </View>
          </View>

          {/* 매력 포인트 입력 */}
          <View style={styles.section}>
            <Text style={styles.label}>
              나를 설레게하는 이성의 매력? (필수)
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="매력 포인트를 입력해주세요"
                placeholderTextColor="#999"
                value={charm}
                onChangeText={setCharm}
                maxLength={charmLimit}
              />
              <Text style={styles.characterCount}>
                {charm.length}/{charmLimit}자 이상 입력해주세요
              </Text>
            </View>
          </View>

          {/* 이상형 입력 */}
          <View style={styles.section}>
            <Text style={styles.label}>
              연인에게 꼭 바라는 한가지는? (필수)
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="바라는 점을 입력해주세요"
                placeholderTextColor="#999"
                value={ideal}
                onChangeText={setIdeal}
                maxLength={idealLimit}
              />
              <Text style={styles.characterCount}>
                {ideal.length}/{idealLimit}자 이상 입력해주세요
              </Text>
            </View>
          </View>

          {/* 제출 버튼 */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isFormValid()
                ? styles.submitButtonActive
                : styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid() || isLoading}
          >
            <Text
              style={[
                styles.submitButtonText,
                isFormValid()
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
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    minHeight: 50,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    minHeight: 120,
    maxHeight: 180,
  },
  characterCount: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 5,
    textAlign: 'right',
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
