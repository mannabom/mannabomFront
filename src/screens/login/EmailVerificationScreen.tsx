// src/screens/EmailVerificationScreen.tsx
import React, { useEffect, useState } from 'react';
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
const SUCCESS_GREEN = '#2DBE9D';
const INFO_GRAY = '#666666';

const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({
  onVerificationComplete,
}) => {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');

  const [emailInfo, setEmailInfo] = useState(''); // ✅ 전송 안내 문구
  const [codeInfo, setCodeInfo] = useState(''); // ✅ 인증 완료 문구(필요시)

  const [isLoading, setIsLoading] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileId = async () => {
      const id = await getProfileId();
      if (id) setProfileId(id);
      else {
        Alert.alert('오류', '프로필 ID를 찾을 수 없습니다. 다시 로그인해주세요.');
      }
    };
    fetchProfileId();
  }, []);

  const validateEmailFormat = (emailText: string) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(emailText.trim());
  };

  const validateUniversityDomain = (emailText: string) => {
    const trimmed = emailText.trim();
    const parts = trimmed.split('@');
    if (parts.length !== 2) return false;

    const domain = parts[1].toLowerCase();
    return (
      domain.endsWith('ac.kr') ||
      domain.endsWith('edu') ||
      domain.endsWith('edu.kr')
    );
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    setEmailInfo('');
    setCodeInfo('');

    // 이메일 바뀌면 인증 흐름 리셋
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
      // ❗️전송 성공/완료 모달만 제거 요청이라, 에러 Alert은 유지
      Alert.alert('오류', '올바른 학교 이메일을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setEmailInfo('');
    try {
      const response = await apiClient.post(API_ENDPOINTS_LIST.EMAIL_VERIFICATION, {
        profileId,
        email: email.trim(),
      });

      if (response.data?.success && response.data?.data?.emailSent) {
        setIsCodeSent(true);
        setEmailInfo('인증번호를 전송했습니다. 메일함을 확인해주세요.');
      } else {
        Alert.alert('전송 실패', response.data?.message || '인증번호 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ 이메일 인증번호 전송 오류:', error);
      Alert.alert('오류', '인증번호 전송 중 오류가 발생했습니다. 다시 시도해주세요.');
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
    setCodeInfo('');
    try {
      const response = await apiClient.post(API_ENDPOINTS_LIST.EMAIL_VERIFY, {
        profileId,
        verificationCode: verificationCode.trim(),
      });

      if (response.data?.success && response.data?.data?.verified) {
        setCodeError('');
        setCodeInfo('인증이 완료되었습니다.');
        // ✅ 인증완료 모달 제거 → 바로 다음 단계로
        onVerificationComplete();
      } else {
        setCodeError('*인증번호가 일치하지 않습니다.');
      }
    } catch (error) {
      console.error('❌ 이메일 인증 확인 오류:', error);
      setCodeError('*인증번호가 일치하지 않습니다.');
      Alert.alert('오류', '인증번호 확인 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (text: string) => {
    setVerificationCode(text);
    if (codeError) setCodeError('');
    if (codeInfo) setCodeInfo('');
  };

  const canSend = isEmailValid && !isLoading;
  const canVerify = verificationCode.trim().length > 0 && !isLoading;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>만나봄은 학교 인증이 필수입니다</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.form}>
          {/* 1) 이메일 입력 */}
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
            {!emailError && emailInfo ? (
              <Text style={styles.infoText}>{emailInfo}</Text>
            ) : null}

            <TouchableOpacity
              style={[
                styles.smallButton,
                canSend ? styles.smallButtonActive : styles.smallButtonDisabled,
              ]}
              onPress={handleSendVerification}
              disabled={!canSend}
            >
              <Text style={styles.smallButtonText}>
                {isLoading ? '전송 중...' : isCodeSent ? '재전송하기' : '인증번호 전송하기'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 2) 인증번호 입력 (전송 이후 표시) */}
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
              {!codeError && codeInfo ? (
                <Text style={styles.successText}>{codeInfo}</Text>
              ) : null}

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

  header: { paddingHorizontal: 24, paddingTop: 16 },
  title: { fontSize: 16, fontWeight: '500', color: '#8E8E8E', textAlign: 'left' },

  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  form: { width: '100%', maxWidth: 360 },

  section: { marginBottom: 26 },

  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  stepText: { fontSize: 14, color: '#333333', fontWeight: '500' },

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
  inputError: { borderColor: ERROR_RED },

  errorText: { color: ERROR_RED, fontSize: 12, marginTop: 8, marginLeft: 4 },
  infoText: { color: INFO_GRAY, fontSize: 12, marginTop: 8, marginLeft: 4 },
  successText: { color: SUCCESS_GREEN, fontSize: 12, marginTop: 8, marginLeft: 4 },

  smallButton: {
    alignSelf: 'center',
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    minWidth: 160,
    alignItems: 'center',
  },
  smallButtonActive: { backgroundColor: BUTTON_PINK },
  smallButtonDisabled: { backgroundColor: '#E6E6E6' },
  smallButtonText: { color: '#111111', fontSize: 14, fontWeight: '600' },
});

export default EmailVerificationScreen;
