// src/screens/login/TermsDetailScreen.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../services/apiClient';
import { API_ENDPOINTS_LIST } from '../../config/api';

interface TermsDetailScreenProps {
  termType: 'service' | 'privacy' | 'marketing';
  onClose: () => void;
}

interface TermsContent {
  termType: string;
  title: string;
  content: string;
  lastUpdated: string;
  required: boolean;
}

interface TermsState {
  serviceTerms: boolean;
  privacyPolicy: boolean;
  marketingConsent: boolean;
}

const STORAGE_KEY = 'signup_terms_state_v1';

const TermsDetailScreen: React.FC<TermsDetailScreenProps> = ({
  termType,
  onClose,
}) => {
  const [termsContent, setTermsContent] = useState<TermsContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTermsContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termType]);

  const stateKey = useMemo<keyof TermsState>(() => {
    if (termType === 'service') return 'serviceTerms';
    if (termType === 'privacy') return 'privacyPolicy';
    return 'marketingConsent';
  }, [termType]);

  // ✅ 임시 약관(서버 실패 시) - 지금 내용은 “샘플” 수준이라 운영용으로는 부적합(아래 설명 참고)
  const getTemporaryTermsContent = (type: string): TermsContent => {
    const contents = {
      service: {
        termType: 'service',
        title: '서비스 이용약관',
        content: `※ 샘플 약관(운영용 아님)
제1조(목적) ...`,
        lastUpdated: '2025-01-01',
        required: true,
      },
      privacy: {
        termType: 'privacy',
        title: '개인정보 처리방침',
        content: `※ 샘플 방침(운영용 아님)
제1조(처리목적) ...`,
        lastUpdated: '2025-01-01',
        required: true,
      },
      marketing: {
        termType: 'marketing',
        title: '마케팅 정보 수신 동의',
        content: `※ 샘플 동의서(운영용 아님)
제1조(동의) ...`,
        lastUpdated: '2025-01-01',
        required: false,
      },
    } as const;

    return contents[type as keyof typeof contents] || contents.service;
  };

  const fetchTermsContent = async () => {
    try {
      setIsLoading(true);

      const endpoint = API_ENDPOINTS_LIST.TERMS_CONTENT.replace(
        '{termType}',
        termType,
      );

      const response = await apiClient.get(endpoint);

      if (response.data.success) {
        setTermsContent(response.data.data);
      } else {
        setTermsContent(getTemporaryTermsContent(termType));
      }
    } catch (error) {
      console.error('약관 내용 조회 오류:', error);
      setTermsContent(getTemporaryTermsContent(termType));
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // ✅ 확인 누르면: 해당 약관 체크 true로 저장하고 닫기
  const handleConfirm = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const prev: TermsState = raw
        ? JSON.parse(raw)
        : { serviceTerms: false, privacyPolicy: false, marketingConsent: false };

      const next: TermsState = {
        ...prev,
        [stateKey]: true,
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error('약관 확인 체크 저장 오류:', e);
      // 저장 실패해도 화면은 닫아주기(UX 우선)
    } finally {
      onClose();
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>약관 내용을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!termsContent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>약관 내용을 불러올 수 없습니다.</Text>
          <TouchableOpacity style={styles.confirmButton} onPress={onClose}>
            <Text style={styles.confirmButtonText}>닫기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>약관 상세</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>{termsContent.title}</Text>
            <View style={styles.infoRow}>
              <Text
                style={[
                  styles.badge,
                  !termsContent.required && styles.badgeOptional,
                ]}
              >
                {termsContent.required ? '필수' : '선택'}
              </Text>
              <Text style={styles.lastUpdated}>
                최종 수정일: {formatDate(termsContent.lastUpdated)}
              </Text>
            </View>
          </View>

          <View style={styles.contentBox}>
            <Text style={styles.contentText}>{termsContent.content}</Text>
          </View>
        </View>
      </ScrollView>

      {/* ✅ 확인 누르면 체크 저장 + 닫기 */}
      <View style={styles.bottom}>
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>확인</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const BORDER = '#E7E7E7';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backButton: { padding: 6 },
  backButtonText: { fontSize: 20, fontWeight: '800', color: '#222222' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#222222' },
  headerRightSpacer: { width: 32 },

  scrollView: { flex: 1 },
  content: { padding: 18 },

  titleSection: { marginBottom: 14 },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#222222',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeOptional: { backgroundColor: '#888888' },
  lastUpdated: { fontSize: 12, color: '#999999' },

  contentBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 14,
  },
  contentText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 22,
  },

  bottom: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  confirmButton: {
    backgroundColor: '#FFB6C1',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#222222',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});

export default TermsDetailScreen;
