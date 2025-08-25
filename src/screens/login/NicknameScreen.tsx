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
} from 'react-native';

interface NicknameScreenProps {
  onNicknameComplete: () => void;
}

const NicknameScreen: React.FC<NicknameScreenProps> = ({
  onNicknameComplete,
}) => {
  const [nickname, setNickname] = useState('');
  const [isNicknameValid, setIsNicknameValid] = useState(false);
  const [nicknameError, setNicknameError] = useState('');

  const validateNickname = (text: string) => {
    // 닉네임 검증 로직: 2-14자, 한글/영문/숫자 허용
    const nicknameRegex = /^[가-힣a-zA-Z0-9]{2,14}$/;
    return nicknameRegex.test(text);
  };

  const handleNicknameChange = (text: string) => {
    setNickname(text);

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

    // 실제로는 닉네임 중복 검사 API 호출
    try {
      // 임시 중복 검사 로직
      const isDuplicate = Math.random() > 0.7; // 30% 확률로 중복

      if (isDuplicate) {
        Alert.alert('중복', '이미 사용 중인 닉네임입니다.');
        setNicknameError('*이미 사용 중인 닉네임입니다.');
        setIsNicknameValid(false);
      } else {
        Alert.alert('확인', '사용 가능한 닉네임입니다!');
      }
    } catch (error) {
      Alert.alert('오류', '중복 검사 중 오류가 발생했습니다.');
    }
  };

  const handleComplete = () => {
    if (!isNicknameValid) {
      Alert.alert('오류', '닉네임을 확인해주세요.');
      return;
    }

    Alert.alert(
      '닉네임 설정 완료',
      `"${nickname}" 닉네임으로 설정하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: () => {
            // 닉네임 저장 로직
            console.log('닉네임 설정:', nickname);
            onNicknameComplete();
          },
        },
      ],
    );
  };

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
            />
            <View style={styles.inputActions}>
              <TouchableOpacity
                style={[
                  styles.duplicateButton,
                  isNicknameValid
                    ? styles.duplicateButtonActive
                    : styles.duplicateButtonDisabled,
                ]}
                onPress={handleCheckDuplicate}
                disabled={!isNicknameValid}
              >
                <Text
                  style={[
                    styles.duplicateButtonText,
                    isNicknameValid
                      ? styles.duplicateButtonTextActive
                      : styles.duplicateButtonTextDisabled,
                  ]}
                >
                  중복 확인
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {nicknameError ? (
            <Text style={styles.errorText}>{nicknameError}</Text>
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
              isNicknameValid
                ? styles.completeButtonActive
                : styles.completeButtonDisabled,
            ]}
            onPress={handleComplete}
            disabled={!isNicknameValid}
          >
            <Text
              style={[
                styles.completeButtonText,
                isNicknameValid
                  ? styles.completeButtonTextActive
                  : styles.completeButtonTextDisabled,
              ]}
            >
              설정하기
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
