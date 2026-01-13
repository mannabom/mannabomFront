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

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS_LIST.NICKNAME_CHECK}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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

      Alert.alert('완료', `${responseData.message || '닉네임이 설정되었습니다.'}`, [
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
          {/* ✅ 라벨: 입력칸 위, 왼쪽 정렬 */}
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

          {/* ✅ 버튼: 서로 안 닿게 + 가로만 살짝 줄임 */}
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
    backgroundColor: '#FFFFFF', // ✅ 배경 흰색
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center', // ✅ 세로 가운데
    alignItems: 'center', // ✅ 가로 가운데
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
  },
  label: {
    width: '100%',
    textAlign: 'left', // ✅ 왼쪽 정렬
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
    color: HELPER_PINK, // ✅ 안내문 분홍
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
    width: '46%', // ✅ 가로만 살짝 줄임(서로 안 닿게)
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionButtonLeft: {
    marginRight: 12, // ✅ 버튼 간격
  },
  actionButtonActive: {
    backgroundColor: BUTTON_PINK, // ✅ 버튼 색
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
