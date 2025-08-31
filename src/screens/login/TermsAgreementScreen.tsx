// src/screens/login/TermsAgreementScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import apiClient from '../../services/apiClient';
import { getProfileId } from '../../utils/AuthUtils';
import { API_ENDPOINTS_LIST } from '../../config/api';

interface TermsAgreementScreenProps {
  onAgreementComplete: () => void;
  onViewTermsDetail: (termType: 'service' | 'privacy' | 'marketing') => void;
}

interface TermsState {
  serviceTerms: boolean;
  privacyPolicy: boolean;
  marketingConsent: boolean;
}

const TermsAgreementScreen: React.FC<TermsAgreementScreenProps> = ({
  onAgreementComplete,
  onViewTermsDetail,
}) => {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [termsState, setTermsState] = useState<TermsState>({
    serviceTerms: false,
    privacyPolicy: false,
    marketingConsent: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProfileId = async () => {
      const id = await getProfileId();
      setProfileId(id);
    };
    fetchProfileId();
  }, []);

  // 필수 약관이 모두 동의되었는지 확인
  const isRequiredTermsAgreed = () => {
    return termsState.serviceTerms && termsState.privacyPolicy;
  };

  // 전체 동의 상태 확인
  const isAllAgreed = () => {
    return Object.values(termsState).every(value => value);
  };

  // 개별 약관 동의 토글
  const toggleTerm = (termType: keyof TermsState) => {
    setTermsState(prev => ({
      ...prev,
      [termType]: !prev[termType],
    }));
  };

  // 전체 동의 토글
  const toggleAllTerms = () => {
    const allAgreed = isAllAgreed();
    setTermsState({
      serviceTerms: !allAgreed,
      privacyPolicy: !allAgreed,
      marketingConsent: !allAgreed,
    });
  };

  // 약관 동의 제출
  const handleSubmit = async () => {
    if (!profileId || !isRequiredTermsAgreed() || isLoading) {
      Alert.alert('알림', '필수 약관에 모두 동의해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const requestData = {
        profileId: profileId,
        termsAgreement: {
          serviceTerms: termsState.serviceTerms,
          privacyPolicy: termsState.privacyPolicy,
          marketingConsent: termsState.marketingConsent,
        },
      };

      const response = await apiClient.post(
        API_ENDPOINTS_LIST.TERMS_AGREEMENT,
        requestData,
      );

      if (response.data.success) {
        Alert.alert(
          '동의 완료',
          response.data.message || '약관 동의가 완료되었습니다.',
          [{ text: '확인', onPress: onAgreementComplete }],
        );
      } else {
        Alert.alert(
          '오류',
          response.data.message || '약관 동의 처리에 실패했습니다.',
        );
      }
    } catch (error) {
      console.error('약관 동의 오류:', error);
      Alert.alert('오류', '네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 체크박스 아이콘 렌더링
  const renderCheckbox = (checked: boolean) => (
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && <Text style={styles.checkmark}>✓</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>약관 동의</Text>
          <Text style={styles.subtitle}>
            서비스 이용을 위해 다음에 동의해주세요
          </Text>

          {/* 전체 동의 */}
          <TouchableOpacity
            style={styles.allAgreeContainer}
            onPress={toggleAllTerms}
            activeOpacity={0.7}
          >
            {renderCheckbox(isAllAgreed())}
            <Text style={styles.allAgreeText}>전체 동의</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* 개별 약관들 */}
          <View style={styles.termsList}>
            {/* 서비스 이용약관 (필수) */}
            <View style={styles.termItem}>
              <TouchableOpacity
                style={styles.termCheckContainer}
                onPress={() => toggleTerm('serviceTerms')}
                activeOpacity={0.7}
              >
                {renderCheckbox(termsState.serviceTerms)}
                <View style={styles.termTextContainer}>
                  <Text style={styles.termText}>서비스 이용약관</Text>
                  <Text style={styles.requiredTag}>(필수)</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.viewDetailButton}
                onPress={() => onViewTermsDetail('service')}
              >
                <Text style={styles.viewDetailText}>보기</Text>
              </TouchableOpacity>
            </View>

            {/* 개인정보 처리방침 (필수) */}
            <View style={styles.termItem}>
              <TouchableOpacity
                style={styles.termCheckContainer}
                onPress={() => toggleTerm('privacyPolicy')}
                activeOpacity={0.7}
              >
                {renderCheckbox(termsState.privacyPolicy)}
                <View style={styles.termTextContainer}>
                  <Text style={styles.termText}>개인정보 처리방침</Text>
                  <Text style={styles.requiredTag}>(필수)</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.viewDetailButton}
                onPress={() => onViewTermsDetail('privacy')}
              >
                <Text style={styles.viewDetailText}>보기</Text>
              </TouchableOpacity>
            </View>

            {/* 마케팅 정보 수신 (선택) */}
            <View style={styles.termItem}>
              <TouchableOpacity
                style={styles.termCheckContainer}
                onPress={() => toggleTerm('marketingConsent')}
                activeOpacity={0.7}
              >
                {renderCheckbox(termsState.marketingConsent)}
                <View style={styles.termTextContainer}>
                  <Text style={styles.termText}>마케팅 정보 수신</Text>
                  <Text style={styles.optionalTag}>(선택)</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.viewDetailButton}
                onPress={() => onViewTermsDetail('marketing')}
              >
                <Text style={styles.viewDetailText}>보기</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 동의하고 계속하기 버튼 */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isRequiredTermsAgreed() && !isLoading
                ? styles.submitButtonActive
                : styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isRequiredTermsAgreed() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text
                style={[
                  styles.submitButtonText,
                  isRequiredTermsAgreed()
                    ? styles.submitButtonTextActive
                    : styles.submitButtonTextDisabled,
                ]}
              >
                동의하고 계속하기
              </Text>
            )}
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 40,
  },
  allAgreeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  allAgreeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  termsList: {
    marginBottom: 40,
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  termCheckContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  termTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  termText: {
    fontSize: 16,
    color: '#333333',
  },
  requiredTag: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
    marginLeft: 6,
  },
  optionalTag: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6,
  },
  viewDetailButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
  },
  viewDetailText: {
    fontSize: 14,
    color: '#666666',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonActive: {
    backgroundColor: '#FFB6C1',
  },
  submitButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButtonTextActive: {
    color: '#333333',
  },
  submitButtonTextDisabled: {
    color: '#999999',
  },
});

export default TermsAgreementScreen;
