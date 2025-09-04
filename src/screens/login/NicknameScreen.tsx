// src/screens/NicknameScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { API_BASE_URL, API_ENDPOINTS_LIST } from '../../config/api';
import { getProfileId } from '../../utils/AuthUtils';
import {
  SetNicknameRequestDto,
  SetNicknameResponseDto,
} from '../../types/NicknameAPI';

interface NicknameScreenProps {
  onNicknameComplete: () => void;
}

const NicknameScreen: React.FC<NicknameScreenProps> = ({
  onNicknameComplete,
}) => {
  const [nickname, setNickname] = useState('');
  const [isNicknameValid, setIsNicknameValid] = useState(false);
  const [nicknameError, setNicknameError] = useState('');
  const [isDuplicateChecked, setIsDuplicateChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateNickname = (text: string) => {
    // 닉네임 검증 로직: 2-14자, 한글/영문/숫자 허용
    const nicknameRegex = /^[가-힣a-zA-Z0-9]{2,14}$/;
    return nicknameRegex.test(text);
  };

  const handleNicknameChange = (text: string) => {
    setNickname(text);
    setIsDuplicateChecked(false); // 닉네임이 변경되면 중복 확인 초기화

    if (text.length === 0) {
      setNicknameError('');
      setIsNicknameValid(false);
    } else if (text.length < 2) {
      setNicknameError('*닉네임은 2글자 이상 입력해주세요.');
      setIsNicknameValid(false);
    } else if (text.length > 14) {
      setNicknameError('*닉네임은 14자 이하로 입력해주세요.');
      setIsNicknameValid(false);
    } else if (!validateNickname(text)) {
      setNicknameError('*닉네임은 한글, 영문, 숫자만 사용가능합니다.');
      setIsNicknameValid(false);
    } else {
      setNicknameError('');
      setIsNicknameValid(true);
    }
  };

  const handleCheckDuplicate = async () => {
    if (!isNicknameValid) {
      Alert.alert('오류', '올바른 닉네임을 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);

      // 닉네임 중복 검사 API 호출
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS_LIST.NICKNAME_CHECK}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ nickname }),
        },
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.message || '중복 검사 중 오류가 발생했습니다.',
        );
      }

      if (responseData.isDuplicate) {
        Alert.alert('중복', '이미 사용 중인 닉네임입니다.');
        setNicknameError('*이미 사용 중인 닉네임입니다.');
        setIsNicknameValid(false);
        setIsDuplicateChecked(false);
      } else {
        Alert.alert('확인', '사용 가능한 닉네임입니다!');
        setIsDuplicateChecked(true);
      }
    } catch (error) {
      console.error('닉네임 중복 검사 오류:', error);
      Alert.alert('오류', '중복 검사 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!isNicknameValid || !isDuplicateChecked) {
      Alert.alert('오류', '닉네임 중복 확인을 완료해주세요.');
      return;
    }

    try {
      setIsLoading(true);

      // 저장된 profileId 가져오기
      const profileId = await getProfileId();
      if (!profileId) {
        throw new Error('프로필 ID가 없습니다. 다시 로그인해주세요.');
      }

      // 닉네임 설정 API 호출
      const requestData: SetNicknameRequestDto = {
        profileId,
        nickname,
      };

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS_LIST.SET_NICKNAME}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        },
      );

      const responseData: SetNicknameResponseDto = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.message || '닉네임 설정 중 오류가 발생했습니다.',
        );
      }

      Alert.alert(
        '완료',
        `${responseData.message || '닉네임이 설정되었습니다.'}`,
        [
          {
            text: '확인',
            onPress: () => {
              console.log('닉네임 설정 완료:', nickname);
              onNicknameComplete();
            },
          },
        ],
      );
    } catch (error) {
      console.error('닉네임 설정 오류:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : '닉네임 설정 중 오류가 발생했습니다.';
      Alert.alert('오류', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isCompleteButtonEnabled =
    isNicknameValid && isDuplicateChecked && !isLoading;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.inputSection}>
          <Text style={styles.label}>사용하실 닉네임을 입력해주세요</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, nicknameError ? styles.inputError : null]}
              placeholder="닉네임 입력"
              placeholderTextColor="#999"
              value={nickname}
              onChangeText={handleNicknameChange}
              maxLength={14}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            <View style={styles.inputActions}>
              <TouchableOpacity
                style={[
                  styles.duplicateButton,
                  isNicknameValid && !isLoading
                    ? styles.duplicateButtonActive
                    : styles.duplicateButtonDisabled,
                ]}
                onPress={handleCheckDuplicate}
                disabled={!isNicknameValid || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text
                    style={[
                      styles.duplicateButtonText,
                      isNicknameValid && !isLoading
                        ? styles.duplicateButtonTextActive
                        : styles.duplicateButtonTextDisabled,
                    ]}
                  >
                    중복 확인
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {nicknameError ? (
            <Text style={styles.errorText}>{nicknameError}</Text>
          ) : isDuplicateChecked ? (
            <Text style={styles.successText}>✓ 사용 가능한 닉네임입니다</Text>
          ) : (
            <Text style={styles.helperText}>
              *닉네임은 한글 또는 영어, 2~14자 사이어야 합니다.
            </Text>
          )}
        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[
              styles.completeButton,
              isCompleteButtonEnabled
                ? styles.completeButtonActive
                : styles.completeButtonDisabled,
            ]}
            onPress={handleComplete}
            disabled={!isCompleteButtonEnabled}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text
                style={[
                  styles.completeButtonText,
                  isCompleteButtonEnabled
                    ? styles.completeButtonTextActive
                    : styles.completeButtonTextDisabled,
                ]}
              >
                설정하기
              </Text>
            )}
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
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 100,
  },
  inputSection: {
    flex: 1,
  },
  label: {
    fontSize: 18,
    color: '#333333',
    marginBottom: 30,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    marginBottom: 10,
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  inputActions: {
    alignItems: 'flex-end',
  },
  duplicateButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  duplicateButtonActive: {
    backgroundColor: '#87CEEB',
  },
  duplicateButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  duplicateButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  duplicateButtonTextActive: {
    color: '#FFFFFF',
  },
  duplicateButtonTextDisabled: {
    color: '#999999',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  successText: {
    color: '#4ECDC4',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  helperText: {
    color: '#666666',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  actionContainer: {
    paddingBottom: 40,
  },
  completeButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  completeButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  completeButtonTextActive: {
    color: '#FFFFFF',
  },
  completeButtonTextDisabled: {
    color: '#999999',
  },
});

export default NicknameScreen;
