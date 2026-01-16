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

type NicknameCheckResponseDto = {
  success: boolean;
  data?: {
    available: boolean;
  };
  message?: string;
};

const BUTTON_PINK = '#FFB6C1';
const HELPER_PINK = '#FF6B9A';

const NicknameScreen: React.FC<NicknameScreenProps> = ({
  onNicknameComplete,
}) => {
  const [nickname, setNickname] = useState('');
  const [isNicknameValid, setIsNicknameValid] = useState(false);
  const [nicknameError, setNicknameError] = useState('');
  const [isDuplicateChecked, setIsDuplicateChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateNickname = (text: string) => {
    // 2-14자, 한글/영문/숫자 허용
    const nicknameRegex = /^[가-힣a-zA-Z0-9]{2,14}$/;
    return nicknameRegex.test(text);
  };

  const handleNicknameChange = (text: string) => {
    setNickname(text);
    setIsDuplicateChecked(false);

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

      const url = `${API_BASE_URL}${API_ENDPOINTS_LIST.NICKNAME_CHECK}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname }),
      });

      // 네트워크/서버 에러(4xx/5xx)만 여기서 걸러줌
      const responseData = (await response.json()) as NicknameCheckResponseDto;

      if (!response.ok) {
        throw new Error(
          responseData?.message || '중복 검사 중 오류가 발생했습니다.',
        );
      }

      // ✅ 백엔드 스펙: data.available 로 중복 여부 판단
      const available = responseData?.data?.available;

      // available이 확실히 있을 때
      if (available === true) {
        Alert.alert('확인', responseData.message || '사용 가능한 닉네임입니다!');
        setNicknameError('');
        setIsDuplicateChecked(true);
        return;
      }

      if (available === false) {
        Alert.alert('중복', responseData.message || '이미 사용 중인 닉네임입니다.');
        setNicknameError(responseData.message || '*이미 사용 중인 닉네임입니다.');
        // ✅ 유효성(regex)은 그대로 두고, 중복 체크만 실패 처리
        setIsDuplicateChecked(false);
        return;
      }

      // ✅ 혹시 백엔드가 available을 안 주고 message만 준다면(예외 케이스) fallback
      const msg = (responseData?.message || '').trim();
      if (msg.includes('이미') || msg.includes('중복')) {
        Alert.alert('중복', msg || '이미 사용 중인 닉네임입니다.');
        setNicknameError(msg || '*이미 사용 중인 닉네임입니다.');
        setIsDuplicateChecked(false);
        return;
      }

      if (msg.includes('사용 가능')) {
        Alert.alert('확인', msg || '사용 가능한 닉네임입니다!');
        setNicknameError('');
        setIsDuplicateChecked(true);
        return;
      }

      // 여기까지 오면 응답 형태가 예상과 다름
      throw new Error('중복 검사 응답 형식이 예상과 다릅니다.');
    } catch (error) {
      console.error('닉네임 중복 검사 오류:', error);
      const msg =
        error instanceof Error ? error.message : '중복 검사 중 오류가 발생했습니다.';
      Alert.alert('오류', msg);
      setIsDuplicateChecked(false);
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

      const profileId = await getProfileId();
      if (!profileId) {
        throw new Error('프로필 ID가 없습니다. 다시 로그인해주세요.');
      }

      const requestData: SetNicknameRequestDto = {
        profileId,
        nickname,
      };

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS_LIST.SET_NICKNAME}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
        },
      );

      const responseData: SetNicknameResponseDto = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.message || '닉네임 설정 중 오류가 발생했습니다.',
        );
      }

      Alert.alert('완료', responseData.message || '닉네임이 설정되었습니다.', [
        {
          text: '확인',
          onPress: () => {
            console.log('닉네임 설정 완료:', nickname);
            onNicknameComplete();
          },
        },
      ]);
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

  const isCheckButtonEnabled = isNicknameValid && !isLoading;
  const isCompleteButtonEnabled =
    isNicknameValid && isDuplicateChecked && !isLoading;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centerWrap}>
        <View style={styles.card}>
          <Text style={styles.label}>사용하실 닉네임을 입력해주세요</Text>

          <TextInput
            style={[styles.input, nicknameError ? styles.inputError : null]}
            placeholder=""
            placeholderTextColor="#999"
            value={nickname}
            onChangeText={handleNicknameChange}
            maxLength={14}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />

          {nicknameError ? (
            <Text style={styles.errorText}>{nicknameError}</Text>
          ) : isDuplicateChecked ? (
            <Text style={styles.successText}>✓ 사용 가능한 닉네임입니다</Text>
          ) : (
            <Text style={styles.helperText}>
              *닉네임은 한글 또는 영어, 2~14자 사이어야합니다.
            </Text>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.actionButtonLeft,
                isCheckButtonEnabled
                  ? styles.actionButtonActive
                  : styles.actionButtonDisabled,
              ]}
              onPress={handleCheckDuplicate}
              disabled={!isCheckButtonEnabled}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#333333" />
              ) : (
                <Text style={styles.actionButtonText}>중복 확인</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                isCompleteButtonEnabled
                  ? styles.actionButtonActive
                  : styles.actionButtonDisabled,
              ]}
              onPress={handleComplete}
              disabled={!isCompleteButtonEnabled}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#333333" />
              ) : (
                <Text style={styles.actionButtonText}>설정하기</Text>
              )}
            </TouchableOpacity>
          </View>
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
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
  },
  label: {
    width: '100%',
    textAlign: 'left',
    fontSize: 16,
    color: '#666666',
    marginBottom: 14,
    fontWeight: '500',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: HELPER_PINK,
  },
  helperText: {
    width: '100%',
    color: HELPER_PINK,
    fontSize: 12,
    marginTop: 10,
    textAlign: 'left',
  },
  errorText: {
    width: '100%',
    color: HELPER_PINK,
    fontSize: 12,
    marginTop: 10,
    textAlign: 'left',
  },
  successText: {
    width: '100%',
    color: '#2DBE9D',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'left',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 16,
    justifyContent: 'center',
  },
  actionButton: {
    width: '46%',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionButtonLeft: {
    marginRight: 12,
  },
  actionButtonActive: {
    backgroundColor: BUTTON_PINK,
  },
  actionButtonDisabled: {
    backgroundColor: '#F2D1D8',
  },
  actionButtonText: {
    color: '#333333',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NicknameScreen;
