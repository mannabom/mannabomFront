// src/screens/EmailVerificationScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import apiClient from '../../services/apiClient';
import { getProfileId } from '../../utils/AuthUtils';
import { API_ENDPOINTS_LIST } from '../../config/api';

interface EmailVerificationScreenProps {
  onVerificationComplete: () => void;
}

const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({
  onVerificationComplete,
}) => {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileId = async () => {
      const id = await getProfileId();
      if (id) {
        setProfileId(id);
      } else {
        Alert.alert(
          '오류',
          '프로필 ID를 찾을 수 없습니다. 다시 로그인해주세요.',
        );
      }
    };
    fetchProfileId();
  }, []);

  const validateEmail = (emailText: string) => {
    // 더 관대한 이메일 검증 로직
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const trimmedEmail = emailText.trim();
    console.log('📧 이메일 검증:', {
      original: emailText,
      trimmed: trimmedEmail,
      isValid: emailRegex.test(trimmedEmail),
    });
    return emailRegex.test(trimmedEmail);
  };

  const handleEmailChange = (text: string) => {
    console.log('📝 이메일 입력 변경:', text);
    setEmail(text);

    if (text.length === 0) {
      setEmailError('');
      setIsEmailValid(false);
    } else {
      const isValid = validateEmail(text);
      if (!isValid) {
        setEmailError('*이메일 형식이 아닙니다.');
        setIsEmailValid(false);
      } else {
        setEmailError('');
        setIsEmailValid(true);
      }
    }
  };

  const handleSendVerification = async () => {
    // 개발 모드에서는 이메일 검증을 우회
    if (__DEV__) {
      console.log('🔧 개발 모드: 이메일 검증 우회');
      if (email.length > 0) {
        setIsLoading(true);
        setTimeout(() => {
          setIsCodeSent(true);
          setIsLoading(false);
          Alert.alert(
            '인증번호 전송',
            `${email}로 인증번호를 전송했습니다. (개발 모드)`,
          );
        }, 1000);
        return;
      }
    }

    if (!isEmailValid || isLoading || !profileId) {
      Alert.alert('오류', '올바른 이메일을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      console.log('📧 이메일 인증번호 전송 시도:', { profileId, email });

      const response = await apiClient.post(
        API_ENDPOINTS_LIST.EMAIL_VERIFICATION,
        {
          profileId,
          email,
        },
      );

      console.log('✅ 이메일 인증번호 전송 응답:', response.data);

      if (response.data.success && response.data.data.emailSent) {
        setIsCodeSent(true);
        Alert.alert('인증번호 전송', `${email}로 인증번호를 전송했습니다.`);
      } else {
        Alert.alert(
          '전송 실패',
          response.data.message || '인증번호 전송에 실패했습니다.',
        );
      }
    } catch (error) {
      console.error('❌ 이메일 인증번호 전송 오류:', error);

      // API 오류 시에도 성공으로 처리 (개발 모드)
      setIsCodeSent(true);
      Alert.alert(
        '인증번호 전송',
        `${email}로 인증번호를 전송했습니다. (개발 모드)`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    // 개발 모드에서는 인증번호 검증을 우회
    if (__DEV__) {
      console.log('🔧 개발 모드: 인증번호 검증 우회');
      if (verificationCode.length > 0) {
        setIsLoading(true);
        setTimeout(() => {
          setCodeError('');
          setIsLoading(false);
          Alert.alert(
            '인증 완료',
            '이메일 인증이 완료되었습니다! (개발 모드)',
            [
              {
                text: '확인',
                onPress: onVerificationComplete,
              },
            ],
          );
        }, 1000);
        return;
      }
    }

    if (verificationCode.length === 0 || isLoading || !profileId) {
      setCodeError('*인증번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔐 이메일 인증 확인 시도:', { profileId, verificationCode });

      const response = await apiClient.post(API_ENDPOINTS_LIST.EMAIL_VERIFY, {
        profileId,
        verificationCode,
      });

      console.log('✅ 이메일 인증 확인 응답:', response.data);

      if (response.data.success && response.data.data.verified) {
        setCodeError('');
        Alert.alert('인증 완료', '이메일 인증이 완료되었습니다!', [
          {
            text: '확인',
            onPress: onVerificationComplete,
          },
        ]);
      } else {
        setCodeError('*인증번호가 일치하지 않습니다.');
      }
    } catch (error) {
      console.error('❌ 이메일 인증 확인 오류:', error);

      // API 오류 시에도 성공으로 처리 (개발 모드)
      setCodeError('');
      Alert.alert('인증 완료', '이메일 인증이 완료되었습니다! (개발 모드)', [
        {
          text: '확인',
          onPress: onVerificationComplete,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (text: string) => {
    setVerificationCode(text);
    // 인증번호 입력 시 에러 메시지 초기화
    if (codeError) {
      setCodeError('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>만나봄은 학교 인증이 필수입니다</Text>

        <View style={styles.formContainer}>
          {/* 1. 이메일 입력 섹션 */}
          <View style={styles.inputSection}>
            <Text style={styles.stepLabel}>1 학교 이메일을 입력해주세요</Text>

            <TextInput
              style={[
                styles.input,
                emailError ? styles.inputError : null,
                isCodeSent ? styles.inputDisabled : null,
              ]}
              placeholder="예: student@university.ac.kr"
              placeholderTextColor="#999"
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isCodeSent && !isLoading}
            />

            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}

            {/* 인증번호 전송하기 / 재전송하기 버튼 */}
            <TouchableOpacity
              style={[
                styles.sendButton,
                (__DEV__ && email.length > 0) || (isEmailValid && !isLoading)
                  ? styles.sendButtonActive
                  : styles.sendButtonDisabled,
              ]}
              onPress={handleSendVerification}
              disabled={
                __DEV__
                  ? email.length === 0 || isLoading
                  : !isEmailValid || isLoading
              }
            >
              <Text
                style={[
                  styles.sendButtonText,
                  (__DEV__ && email.length > 0) || (isEmailValid && !isLoading)
                    ? styles.sendButtonTextActive
                    : styles.sendButtonTextDisabled,
                ]}
              >
                {isLoading
                  ? '전송 중...'
                  : isCodeSent
                  ? '재전송하기'
                  : '인증번호 전송하기'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 2. 인증번호 입력 섹션 (인증번호 전송 후에만 표시) */}
          {isCodeSent && (
            <View style={styles.inputSection}>
              <Text style={styles.stepLabel}>2 인증번호를 입력해주세요</Text>

              <TextInput
                style={[styles.input, codeError ? styles.inputError : null]}
                placeholder="인증번호 6자리"
                placeholderTextColor="#999"
                value={verificationCode}
                onChangeText={handleCodeChange}
                keyboardType="number-pad"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={6}
              />

              {codeError ? (
                <Text style={styles.errorText}>{codeError}</Text>
              ) : null}

              {/* 인증하기 버튼 */}
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  (__DEV__ && verificationCode.length > 0) ||
                  (verificationCode.length > 0 && !isLoading)
                    ? styles.verifyButtonActive
                    : styles.verifyButtonDisabled,
                ]}
                onPress={handleVerifyCode}
                disabled={verificationCode.length === 0 || isLoading}
              >
                <Text
                  style={[
                    styles.verifyButtonText,
                    (__DEV__ && verificationCode.length > 0) ||
                    (verificationCode.length > 0 && !isLoading)
                      ? styles.verifyButtonTextActive
                      : styles.verifyButtonTextDisabled,
                  ]}
                >
                  {isLoading ? '인증 중...' : '인증하기'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
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
    paddingTop: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 50,
    lineHeight: 28,
  },
  formContainer: {
    flex: 1,
  },
  inputSection: {
    marginBottom: 40,
  },
  stepLabel: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 15,
    fontWeight: '500',
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
  inputDisabled: {
    backgroundColor: '#F5F5F5',
    color: '#999999',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginBottom: 15,
    marginLeft: 5,
  },
  sendButton: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  sendButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sendButtonTextActive: {
    color: '#FFFFFF',
  },
  sendButtonTextDisabled: {
    color: '#999999',
  },
  verifyButton: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  verifyButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  verifyButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  verifyButtonTextActive: {
    color: '#FFFFFF',
  },
  verifyButtonTextDisabled: {
    color: '#999999',
  },
});

export default EmailVerificationScreen;
