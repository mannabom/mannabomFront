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

const BUTTON_PINK = '#FFB6C1';
const ERROR_RED = '#FF6B6B';

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

  const validateEmailFormat = (emailText: string) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const trimmed = emailText.trim();
    return emailRegex.test(trimmed);
  };

  // "학교 이메일" 느낌으로 최소한의 도메인 체크 (필요하면 더 넓혀줄 수 있음)
  const validateUniversityDomain = (emailText: string) => {
    const trimmed = emailText.trim();
    const parts = trimmed.split('@');
    if (parts.length !== 2) return false;

    const domain = parts[1].toLowerCase();
    // 흔한 학교 도메인 케이스들
    return (
      domain.endsWith('ac.kr') ||
      domain.endsWith('edu') ||
      domain.endsWith('edu.kr')
    );
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);

    // 이메일 바뀌면 인증 흐름 흔들릴 수 있으니 초기화
    if (isCodeSent) {
      setIsCodeSent(false);
      setVerificationCode('');
      setCodeError('');
    }

    if (text.trim().length === 0) {
      setEmailError('');
      setIsEmailValid(false);
      return;
    }

    const isFormatOk = validateEmailFormat(text);
    const isUnivOk = validateUniversityDomain(text);

    // ✅ 형식이 아니거나 학교메일 도메인이 아니면 "대학교 메일이 아닙니다."
    if (!isFormatOk || !isUnivOk) {
      setEmailError('*대학교 메일이 아닙니다.');
      setIsEmailValid(false);
    } else {
      setEmailError('');
      setIsEmailValid(true);
    }
  };

  const handleSendVerification = async () => {
    if (!isEmailValid || isLoading || !profileId) {
      Alert.alert('오류', '올바른 학교 이메일을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post(
        API_ENDPOINTS_LIST.EMAIL_VERIFICATION,
        {
          profileId,
          email: email.trim(),
        },
      );

      if (response.data.success && response.data.data.emailSent) {
        setIsCodeSent(true);
        Alert.alert('인증번호 전송', `${email.trim()}로 인증번호를 전송했습니다.`);
      } else {
        Alert.alert(
          '전송 실패',
          response.data.message || '인증번호 전송에 실패했습니다.',
        );
      }
    } catch (error) {
      console.error('❌ 이메일 인증번호 전송 오류:', error);
      Alert.alert(
        '오류',
        '인증번호 전송 중 오류가 발생했습니다. 다시 시도해주세요.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.trim().length === 0 || isLoading || !profileId) {
      setCodeError('*인증번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post(API_ENDPOINTS_LIST.EMAIL_VERIFY, {
        profileId,
        verificationCode: verificationCode.trim(),
      });

      if (response.data.success && response.data.data.verified) {
        setCodeError('');
        Alert.alert('인증 완료', '이메일 인증이 완료되었습니다!', [
          { text: '확인', onPress: onVerificationComplete },
        ]);
      } else {
        setCodeError('*인증번호가 일치하지 않습니다.');
      }
    } catch (error) {
      console.error('❌ 이메일 인증 확인 오류:', error);
      setCodeError('*인증번호가 일치하지 않습니다.');
      Alert.alert(
        '오류',
        '인증번호 확인 중 오류가 발생했습니다. 다시 시도해주세요.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (text: string) => {
    setVerificationCode(text);
    if (codeError) setCodeError('');
  };

  const canSend = isEmailValid && !isLoading;
  const canVerify = verificationCode.trim().length > 0 && !isLoading;

  return (
    <SafeAreaView style={styles.container}>
      {/* ✅ 타이틀: 맨 위 + 연하게 + 왼쪽 */}
      <View style={styles.header}>
        <Text style={styles.title}>만나봄은 학교 인증이 필수입니다</Text>
      </View>

      {/* ✅ 1번/2번 섹션: 가운데로 몰기 */}
      <View style={styles.body}>
        <View style={styles.form}>
          {/* 1 */}
          <View style={styles.section}>
            <View style={styles.stepRow}>
              <Text style={styles.stepText}>학교 이메일을 입력해주세요</Text>
            </View>

            <TextInput
              style={[styles.input, emailError ? styles.inputError : null]}
              placeholder=""
              placeholderTextColor="#999"
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />

            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

            <TouchableOpacity
              style={[
                styles.smallButton,
                canSend ? styles.smallButtonActive : styles.smallButtonDisabled,
              ]}
              onPress={handleSendVerification}
              disabled={!canSend}
            >
              <Text style={styles.smallButtonText}>
                {isLoading
                  ? '전송 중...'
                  : isCodeSent
                  ? '재전송하기'
                  : '인증번호 전송하기'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 2 (사진처럼 보이게: 전송 이후 표시) */}
          {isCodeSent && (
            <View style={styles.section}>
              <View style={styles.stepRow}>
                <Text style={styles.stepText}>인증번호를 입력해주세요</Text>
              </View>

              <TextInput
                style={[styles.input, codeError ? styles.inputError : null]}
                placeholder=""
                placeholderTextColor="#999"
                value={verificationCode}
                onChangeText={handleCodeChange}
                keyboardType="number-pad"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={6}
                editable={!isLoading}
              />

              {codeError ? <Text style={styles.errorText}>{codeError}</Text> : null}

              <TouchableOpacity
                style={[
                  styles.smallButton,
                  canVerify ? styles.smallButtonActive : styles.smallButtonDisabled,
                ]}
                onPress={handleVerifyCode}
                disabled={!canVerify}
              >
                <Text style={styles.smallButtonText}>
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E8E', // ✅ 살짝 연하게
    textAlign: 'left',
  },

  body: {
    flex: 1,
    justifyContent: 'center', // ✅ 전체 폼을 가운데로
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  form: {
    width: '100%',
    maxWidth: 360,
  },

  section: {
    marginBottom: 26,
  },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepNum: {
    color: ERROR_RED,
    fontSize: 14,
    fontWeight: '700',
    marginRight: 6,
  },
  stepText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },

  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: ERROR_RED,
  },

  errorText: {
    color: ERROR_RED,
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
  },

  smallButton: {
    alignSelf: 'center', // ✅ 버튼 가운데
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    minWidth: 160,
    alignItems: 'center',
  },
  smallButtonActive: {
    backgroundColor: BUTTON_PINK, // ✅ #FFB6C1
  },
  smallButtonDisabled: {
    backgroundColor: '#E6E6E6',
  },
  smallButtonText: {
    color: '#111111', // ✅ 사진처럼 검정 글씨
    fontSize: 14,
    fontWeight: '600',
  },
});

export default EmailVerificationScreen;
