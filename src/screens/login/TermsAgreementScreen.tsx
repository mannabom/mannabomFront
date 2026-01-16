// src/screens/login/TermsAgreementScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const BORDER = '#E7E7E7';

const DEFAULT_STATE: TermsState = {
  serviceTerms: false,
  privacyPolicy: false,
  marketingConsent: false,
};

const TermsAgreementScreen: React.FC<TermsAgreementScreenProps> = ({
  onAgreementComplete,
  onViewTermsDetail,
}) => {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [termsState, setTermsState] = useState<TermsState>(DEFAULT_STATE);
  const [isLoading, setIsLoading] = useState(false);

  const storageKey = useMemo(() => {
    return profileId ? `signup_terms_state_v1_${profileId}` : null;
  }, [profileId]);

  useEffect(() => {
    const init = async () => {
      const id = await getProfileId();
      setProfileId(id);

      if (!id) {
        setTermsState(DEFAULT_STATE);
        return;
      }

      try {
        const key = `signup_terms_state_v1_${id}`;
        const raw = await AsyncStorage.getItem(key);

        if (!raw) {
          setTermsState(DEFAULT_STATE);
          return;
        }

        const parsed = JSON.parse(raw) as Partial<TermsState>;
        setTermsState({
          serviceTerms: !!parsed.serviceTerms,
          privacyPolicy: !!parsed.privacyPolicy,
          marketingConsent: !!parsed.marketingConsent,
        });
      } catch (e) {
        console.error('약관 상태 로드 오류:', e);
        setTermsState(DEFAULT_STATE);
      }
    };
    init();
  }, []);

  const persist = async (next: TermsState) => {
    if (!storageKey) return;
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(next));
    } catch (e) {
      console.error('약관 상태 저장 오류:', e);
    }
  };

  const isRequiredAgreed = useMemo(
    () => termsState.serviceTerms && termsState.privacyPolicy,
    [termsState.serviceTerms, termsState.privacyPolicy],
  );

  const isAllAgreed = useMemo(
    () => Object.values(termsState).every(Boolean),
    [termsState],
  );

  const toggleTerm = (key: keyof TermsState) => {
    setTermsState(prev => {
      const next = { ...prev, [key]: !prev[key] };
      persist(next);
      return next;
    });
  };

  const toggleAll = () => {
    setTermsState(prev => {
      const all = Object.values(prev).every(Boolean);
      const next = {
        serviceTerms: !all,
        privacyPolicy: !all,
        marketingConsent: !all,
      };
      persist(next);
      return next;
    });
  };

  const openDetail = (termType: 'service' | 'privacy' | 'marketing') => {
    persist(termsState);
    onViewTermsDetail(termType);
  };

  const handleSubmit = async () => {
    if (!profileId || !isRequiredAgreed || isLoading) {
      Alert.alert('알림', '필수 약관에 모두 동의해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const requestData = {
        profileId,
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
        // ✅ 성공 팝업 제거: 동의 성공하면 바로 다음
        onAgreementComplete();
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

  const renderCheckbox = (checked: boolean) => (
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && <Text style={styles.checkmark}>✓</Text>}
    </View>
  );

  const renderTermRow = (
    key: keyof TermsState,
    label: string,
    tag: '(필수)' | '(선택)',
    tagStyle: any,
    termType: 'service' | 'privacy' | 'marketing',
  ) => {
    return (
      <View style={styles.termRow}>
        <TouchableOpacity
          onPress={() => toggleTerm(key)}
          activeOpacity={0.75}
          style={styles.checkboxHit}
        >
          {renderCheckbox(termsState[key])}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.termLinkArea}
          onPress={() => openDetail(termType)}
          activeOpacity={0.75}
        >
          <View style={styles.termTextLine}>
            <Text style={styles.termText}>{label}</Text>
            <Text style={tagStyle}> {tag}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.card}>
          <Text style={styles.title}>약관 동의</Text>
          <Text style={styles.subtitle}>
            서비스 이용을 위해 다음에 동의해주세요
          </Text>

          <TouchableOpacity
            style={styles.allAgreeRow}
            onPress={toggleAll}
            activeOpacity={0.75}
          >
            {renderCheckbox(isAllAgreed)}
            <Text style={styles.allAgreeText}>전체 동의</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {renderTermRow(
            'serviceTerms',
            '서비스 이용약관',
            '(필수)',
            styles.requiredTag,
            'service',
          )}
          {renderTermRow(
            'privacyPolicy',
            '개인정보 처리방침',
            '(필수)',
            styles.requiredTag,
            'privacy',
          )}
          {renderTermRow(
            'marketingConsent',
            '마케팅 정보 수신',
            '(선택)',
            styles.optionalTag,
            'marketing',
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              isRequiredAgreed && !isLoading
                ? styles.submitButtonActive
                : styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isRequiredAgreed || isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text
                style={[
                  styles.submitButtonText,
                  isRequiredAgreed
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#222222',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 18,
  },
  allAgreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  allAgreeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#222',
    marginLeft: 12,
  },
  divider: { height: 1, backgroundColor: '#EFEFEF', marginVertical: 12 },

  termRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  checkboxHit: { paddingRight: 10, paddingVertical: 6 },

  termLinkArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingLeft: 6,
  },
  termTextLine: { flexDirection: 'row', alignItems: 'center' },
  termText: { fontSize: 15, color: '#222', fontWeight: '600' },

  requiredTag: { fontSize: 13, color: '#FF6B6B', fontWeight: '700' },
  optionalTag: { fontSize: 13, color: '#999', fontWeight: '600' },

  chevron: { fontSize: 22, fontWeight: '700', color: '#999', paddingLeft: 10 },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#DADADA',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FFFFFF',
    borderColor: '#222222',
  },
  checkmark: { color: '#222', fontSize: 14, fontWeight: '900' },

  submitButton: {
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonActive: { backgroundColor: '#FFB6C1' },
  submitButtonDisabled: { backgroundColor: '#E0E0E0' },
  submitButtonText: { fontSize: 15, fontWeight: '800' },
  submitButtonTextActive: { color: '#222' },
  submitButtonTextDisabled: { color: '#999' },
});

export default TermsAgreementScreen;
