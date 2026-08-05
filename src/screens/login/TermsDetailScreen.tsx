// src/screens/login/TermsDetailScreen.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSignupProfileId } from '../../utils/AuthUtils';
import { signupApiService } from '../../services/SignupApiService';
import type { TermsContentDataDto } from '../../types/SignupAPI';
import {
  SIGNUP_TERMS_STORAGE_PREFIX,
  type SignupTermType,
} from './TermsAgreementScreen';

interface TermsDetailScreenProps {
  termType: SignupTermType;
  onClose: () => void;
}

interface TermsState {
  serviceTerms: boolean;
  privacyPolicy: boolean;
  marketingConsent: boolean;
}

const DEFAULT_STATE: TermsState = {
  serviceTerms: false,
  privacyPolicy: false,
  marketingConsent: false,
};

const TERM_STATE_KEY: Record<SignupTermType, keyof TermsState> = {
  service: 'serviceTerms',
  privacy: 'privacyPolicy',
  marketing: 'marketingConsent',
};

const normalizeTermsState = (raw: Partial<TermsState> & Record<string, unknown>): TermsState => ({
  serviceTerms: Boolean(raw.serviceTerms),
  privacyPolicy: Boolean(raw.privacyPolicy ?? raw.privacyCollection),
  marketingConsent: Boolean(raw.marketingConsent),
});

const TermsDetailScreen: React.FC<TermsDetailScreenProps> = ({
  termType,
  onClose,
}) => {
  const [termsContent, setTermsContent] =
    useState<TermsContentDataDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadTermsContent = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const response = await signupApiService.getTermsContent(termType);
      if (
        !response.success ||
        !response.data ||
        response.data.termType !== termType ||
        !response.data.title?.trim() ||
        !response.data.content?.trim() ||
        !response.data.lastUpdated?.trim() ||
        typeof response.data.required !== 'boolean'
      ) {
        throw new Error(
          response.message || '약관 내용 응답 형식이 올바르지 않습니다.',
        );
      }
      setTermsContent(response.data);
    } catch (error) {
      setTermsContent(null);
      setLoadError(
        error instanceof Error
          ? error.message
          : '약관 내용을 불러오지 못했습니다.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [termType]);

  useEffect(() => {
    void loadTermsContent();
  }, [loadTermsContent]);

  const handleConfirm = async () => {
    if (!termsContent) return;

    try {
      const id = await getSignupProfileId();
      const key = id
        ? `${SIGNUP_TERMS_STORAGE_PREFIX}_${id}`
        : SIGNUP_TERMS_STORAGE_PREFIX;
      const raw = await AsyncStorage.getItem(key);
      const prev = raw ? normalizeTermsState(JSON.parse(raw)) : DEFAULT_STATE;
      const next: TermsState = {
        ...prev,
        [TERM_STATE_KEY[termType]]: true,
      };

      await AsyncStorage.setItem(key, JSON.stringify(next));
    } catch (e) {
      console.error('약관 확인 체크 저장 오류:', e);
    } finally {
      onClose();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>
          {termsContent?.title ?? '약관 상세'}
        </Text>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={styles.statusBox}>
              <ActivityIndicator size="small" color="#FF8FA8" />
              <Text style={styles.statusText}>약관을 불러오는 중입니다.</Text>
            </View>
          ) : loadError ? (
            <View style={styles.statusBox}>
              <Text style={styles.errorText}>{loadError}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => void loadTermsContent()}
                activeOpacity={0.85}
              >
                <Text style={styles.retryText}>다시 시도</Text>
              </TouchableOpacity>
            </View>
          ) : termsContent ? (
            <>
              <Text style={styles.contentText}>{termsContent.content}</Text>
              <Text style={styles.updatedText}>
                최종 수정일: {termsContent.lastUpdated}
              </Text>
            </>
          ) : null}
        </ScrollView>

        <TouchableOpacity
          style={[
            styles.confirmButton,
            isLoading && styles.confirmButtonDisabled,
          ]}
          onPress={termsContent ? handleConfirm : onClose}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmText}>
            {termsContent ? '확인' : '닫기'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

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
    height: '78%',
    borderWidth: 1,
    borderColor: '#8F8F8F',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingTop: 22,
    paddingBottom: 24,
  },
  title: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 20,
    marginBottom: 12,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 18,
  },
  contentText: {
    color: '#111111',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 17,
  },
  updatedText: {
    color: '#777777',
    fontSize: 10,
    marginTop: 24,
  },
  statusBox: {
    flex: 1,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  statusText: {
    color: '#666666',
    fontSize: 12,
    marginTop: 12,
  },
  errorText: {
    color: '#D94A65',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    borderRadius: 8,
    backgroundColor: '#FFE0E7',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryText: {
    color: '#333333',
    fontSize: 12,
    fontWeight: '700',
  },
  confirmButton: {
    alignSelf: 'center',
    marginTop: 12,
    width: 128,
    height: 47,
    borderRadius: 9,
    backgroundColor: '#FFB3C2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TermsDetailScreen;
