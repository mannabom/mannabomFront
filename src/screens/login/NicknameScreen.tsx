// src/screens/NicknameScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
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
  data?: { available: boolean };
  message?: string;
};

const BUTTON_PINK = '#FFB6C1';
const HELPER_PINK = '#FF6B9A';
const SUCCESS_GREEN = '#2DBE9D';

const NicknameScreen: React.FC<NicknameScreenProps> = ({ onNicknameComplete }) => {
  const [nickname, setNickname] = useState('');
  const [isNicknameValid, setIsNicknameValid] = useState(false);

  const [nicknameError, setNicknameError] = useState('');
  const [nicknameSuccess, setNicknameSuccess] = useState('');

  const [isDuplicateChecked, setIsDuplicateChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ 한글/영어만 + 2~14자
  const validateNickname = (text: string) => {
    const nicknameRegex = /^[가-힣a-zA-Z]{2,14}$/;
    return nicknameRegex.test(text);
  };

  const handleNicknameChange = (text: string) => {
    setNickname(text);

    // ✅ 중복확인 이후 값 변경 시: 다시 비활성화
    if (isDuplicateChecked) setIsDuplicateChecked(false);

    // 상태 메시지 리셋
    if (nicknameError) setNicknameError('');
    if (nicknameSuccess) setNicknameSuccess('');

    const trimmed = text.trim();

    if (trimmed.length === 0) {
      setIsNicknameValid(false);
      return;
    }

    if (!validateNickname(trimmed)) {
      setNicknameError('*닉네임은 한글 또는 영어 2~14자만 가능합니다.');
      setIsNicknameValid(false);
      return;
    }

    setIsNicknameValid(true);
  };

  const handleCheckDuplicate = async () => {
    if (!isNicknameValid || isLoading) return;

    setIsLoading(true);
    setNicknameError('');
    setNicknameSuccess('');
    setIsDuplicateChecked(false);

    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS_LIST.NICKNAME_CHECK}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });

      const responseData = (await response.json()) as NicknameCheckResponseDto;

      // 서버/네트워크 에러
      if (!response.ok) {
        setNicknameError(
          responseData?.message || '*중복 확인 중 오류가 발생했습니다.',
        );
        return;
      }

      const available = responseData?.data?.available;

      if (available === true) {
        setIsDuplicateChecked(true);
        setNicknameSuccess('✓ 사용 가능한 닉네임입니다');
        setNicknameError('');
        return;
      }

      if (available === false) {
        // ✅ 중복이면 모달 X, 아래 문구로만
        setIsDuplicateChecked(false);
        setNicknameSuccess('');
        setNicknameError('이미 사용중인 닉네임입니다');
        return;
      }

      // 응답 형태가 예상과 다르면
      setNicknameError('*중복 확인 응답 형식이 예상과 다릅니다.');
    } catch (error) {
      console.error('닉네임 중복 검사 오류:', error);
      setNicknameError('*중복 확인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!isNicknameValid || !isDuplicateChecked || isLoading) return;

    setIsLoading(true);
    setNicknameError('');
    setNicknameSuccess('');

    try {
      const profileId = await getProfileId();
      if (!profileId) {
        setNicknameError('*프로필 ID가 없습니다. 다시 로그인해주세요.');
        return;
      }

      const requestData: SetNicknameRequestDto = {
        profileId,
        nickname: nickname.trim(),
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
        setNicknameError(
          responseData?.message || '*닉네임 설정 중 오류가 발생했습니다.',
        );
        // 설정 실패면 중복확인 다시 하게 막는 게 안전함
        setIsDuplicateChecked(false);
        return;
      }

      // ✅ 설정 완료 모달 제거 → 바로 다음 단계
      onNicknameComplete();
    } catch (error) {
      console.error('닉네임 설정 오류:', error);
      setNicknameError('*닉네임 설정 중 오류가 발생했습니다.');
      setIsDuplicateChecked(false);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ 유효성 통과 전에는 둘 다 비활성화
  const isCheckButtonEnabled = isNicknameValid && !isLoading;
  // ✅ 설정하기는 중복확인 성공 후에만 활성화
  const isCompleteButtonEnabled = isNicknameValid && isDuplicateChecked && !isLoading;

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
          ) : nicknameSuccess ? (
            <Text style={styles.successText}>{nicknameSuccess}</Text>
          ) : (
            <Text style={styles.helperText}>
              *닉네임은 한글 또는 영어, 2~14자 사이여야합니다.
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: { width: '100%', maxWidth: 360 },
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
  inputError: { borderColor: HELPER_PINK },
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
    color: SUCCESS_GREEN,
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
  actionButtonLeft: { marginRight: 12 },
  actionButtonActive: { backgroundColor: BUTTON_PINK },
  actionButtonDisabled: { backgroundColor: '#F2D1D8' },
  actionButtonText: { color: '#333333', fontSize: 14, fontWeight: '600' },
});

export default NicknameScreen;
