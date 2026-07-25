// src/screens/login/TermsAgreementScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../services/apiClient';
import { API_ENDPOINTS_LIST } from '../../config/api';
import { getSignupProfileId } from '../../utils/AuthUtils';

export type SignupTermType =
  | 'privacy'
  | 'operation'
  | 'payment'
  | 'location'
  | 'marketing';

interface TermsAgreementScreenProps {
  onAgreementComplete: () => void;
  onViewTermsDetail: (termType: SignupTermType) => void;
  onCancel?: () => void;
}

interface TermsState {
  privacyCollection: boolean;
  operationPolicy: boolean;
  paymentService: boolean;
  locationService: boolean;
  marketingConsent: boolean;
}

const STORAGE_PREFIX = 'signup_terms_state_v2';

const DEFAULT_STATE: TermsState = {
  privacyCollection: false,
  operationPolicy: false,
  paymentService: false,
  locationService: false,
  marketingConsent: false,
};

const TERMS: Array<{
  key: keyof TermsState;
  label: string;
  required: boolean;
  termType: SignupTermType;
}> = [
  {
    key: 'privacyCollection',
    label: '개인정보 수집 및 이용',
    required: true,
    termType: 'privacy',
  },
  {
    key: 'operationPolicy',
    label: '운영 정책 및 이용 제한 안내',
    required: true,
    termType: 'operation',
  },
  {
    key: 'paymentService',
    label: '결제 서비스 이용',
    required: true,
    termType: 'payment',
  },
  {
    key: 'locationService',
    label: '위치정보 이용',
    required: true,
    termType: 'location',
  },
  {
    key: 'marketingConsent',
    label: '마케팅 및 광고 정보 수신',
    required: false,
    termType: 'marketing',
  },
];

const normalizeTermsState = (raw: Partial<TermsState> & Record<string, unknown>): TermsState => ({
  privacyCollection: Boolean(raw.privacyCollection ?? raw.privacyPolicy),
  operationPolicy: Boolean(raw.operationPolicy ?? raw.serviceTerms),
  paymentService: Boolean(raw.paymentService ?? raw.serviceTerms),
  locationService: Boolean(raw.locationService ?? raw.serviceTerms),
  marketingConsent: Boolean(raw.marketingConsent),
});

const TermsAgreementScreen: React.FC<TermsAgreementScreenProps> = ({
  onAgreementComplete,
  onViewTermsDetail,
  onCancel,
}) => {
  const [signupProfileId, setSignupProfileId] = useState<string | null>(null);
  const [termsState, setTermsState] = useState<TermsState>(DEFAULT_STATE);
  const [isLoading, setIsLoading] = useState(false);

  const storageKey = useMemo(
    () =>
      signupProfileId
        ? `${STORAGE_PREFIX}_${signupProfileId}`
        : STORAGE_PREFIX,
    [signupProfileId],
  );

  useEffect(() => {
    const init = async () => {
      const id = await getSignupProfileId();
      const key = id ? `${STORAGE_PREFIX}_${id}` : STORAGE_PREFIX;
      setSignupProfileId(id);

      try {
        const raw = await AsyncStorage.getItem(key);
        if (!raw) {
          setTermsState(DEFAULT_STATE);
          return;
        }

        setTermsState(normalizeTermsState(JSON.parse(raw)));
      } catch (e) {
        console.error('약관 상태 로드 오류:', e);
        setTermsState(DEFAULT_STATE);
      }
    };

    init();
  }, []);

  const persist = async (next: TermsState) => {
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(next));
    } catch (e) {
      console.error('약관 상태 저장 오류:', e);
    }
  };

  const isRequiredAgreed = useMemo(
    () =>
      termsState.privacyCollection &&
      termsState.operationPolicy &&
      termsState.paymentService &&
      termsState.locationService,
    [termsState],
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
      const next: TermsState = {
        privacyCollection: !all,
        operationPolicy: !all,
        paymentService: !all,
        locationService: !all,
        marketingConsent: !all,
      };
      persist(next);
      return next;
    });
  };

  const openDetail = (termType: SignupTermType) => {
    persist(termsState);
    onViewTermsDetail(termType);
  };

  const handleSubmit = async () => {
    if (!signupProfileId || !isRequiredAgreed || isLoading) {
      Alert.alert('알림', '필수 약관에 모두 동의해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const requestData = {
        profileId: signupProfileId,
        termsAgreement: {
          serviceTerms:
            termsState.operationPolicy &&
            termsState.paymentService &&
            termsState.locationService,
          privacyPolicy: termsState.privacyCollection,
          marketingConsent: termsState.marketingConsent,
        },
      };

      const response = await apiClient.post(
        API_ENDPOINTS_LIST.TERMS_AGREEMENT,
        requestData,
      );

      if (response.data.success) {
        onAgreementComplete();
        return;
      }

      Alert.alert(
        '오류',
        response.data.message || '약관 동의 처리에 실패했습니다.',
      );
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
    item: (typeof TERMS)[number],
  ) => (
    <View key={item.key} style={styles.termRow}>
      <TouchableOpacity
        style={styles.checkboxTap}
        onPress={() => toggleTerm(item.key)}
        activeOpacity={0.75}
      >
        {renderCheckbox(termsState[item.key])}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.termTextButton}
        onPress={() => openDetail(item.termType)}
        activeOpacity={0.75}
      >
        <Text style={styles.termText}>
          {item.label}
          <Text style={styles.termRequiredText}>
            {item.required ? '(필수)' : '(선택)'}
          </Text>
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>약관 동의</Text>
        <Text style={styles.subtitle}>
          서비스 이용을 위해 아래 항목에 동의해주세요.
        </Text>

        <View style={styles.termsBox}>
          {TERMS.map(renderTermRow)}
        </View>

        <Text style={styles.helpText}>
          각 항목을 누르면 자세히 볼 수 있어요.
        </Text>

        <TouchableOpacity
          style={styles.allAgreeRow}
          onPress={toggleAll}
          activeOpacity={0.75}
        >
          {renderCheckbox(isAllAgreed)}
          <Text style={styles.allAgreeText}>전체 동의</Text>
        </TouchableOpacity>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.bottomButton, styles.cancelButton]}
            onPress={onCancel}
            activeOpacity={0.85}
          >
            <Text style={styles.bottomButtonText}>취소하기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.bottomButton,
              styles.continueButton,
              (!isRequiredAgreed || isLoading) && styles.disabledButton,
            ]}
            onPress={handleSubmit}
            disabled={!isRequiredAgreed || isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#111111" />
            ) : (
              <Text style={styles.bottomButtonText}>계속하기</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const BORDER = '#8F8F8F';
const PINK = '#FFB3C2';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  card: {
    width: '100%',
    maxWidth: 342,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 26,
    paddingBottom: 28,
  },
  title: {
    color: '#111111',
    fontSize: 27,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 14,
  },
  subtitle: {
    color: '#777777',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 14,
  },
  termsBox: {
    borderWidth: 1,
    borderColor: '#BEBEBE',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  termRow: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxTap: {
    paddingRight: 6,
    paddingVertical: 6,
  },
  termTextButton: {
    flex: 1,
    minHeight: 30,
    justifyContent: 'center',
  },
  termText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '600',
  },
  termRequiredText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '600',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#9D9D9D',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    borderColor: '#777777',
  },
  checkmark: {
    color: '#111111',
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '700',
  },
  helpText: {
    marginTop: 7,
    color: '#777777',
    fontSize: 10,
    textAlign: 'center',
  },
  allAgreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 26,
    marginLeft: 4,
  },
  allAgreeText: {
    marginLeft: 10,
    color: '#111111',
    fontSize: 17,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 28,
    paddingHorizontal: 8,
  },
  bottomButton: {
    width: 112,
    height: 45,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: PINK,
  },
  continueButton: {
    backgroundColor: PINK,
  },
  disabledButton: {
    opacity: 0.45,
  },
  bottomButtonText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TermsAgreementScreen;
