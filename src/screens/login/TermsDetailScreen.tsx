// src/screens/login/TermsDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
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

const TermsDetailScreen: React.FC<TermsDetailScreenProps> = ({
  termType,
  onClose,
}) => {
  const [termsContent, setTermsContent] = useState<TermsContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTermsContent();
  }, [termType]);

  const fetchTermsContent = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(
        `${API_ENDPOINTS_LIST.TERMS_CONTENT}/${termType}`,
      );

      if (response.data.success) {
        setTermsContent(response.data.data);
      } else {
        Alert.alert('오류', '약관 내용을 불러올 수 없습니다.');
        onClose();
      }
    } catch (error) {
      console.error('약관 내용 조회 오류:', error);
      Alert.alert('오류', '네트워크 오류가 발생했습니다.');
      onClose();
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
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>약관 내용을 불러올 수 없습니다.</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>닫기</Text>
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
          <Text style={styles.backButtonText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>약관 상세</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* 약관 제목 및 정보 */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{termsContent.title}</Text>
            <View style={styles.infoContainer}>
              <Text style={styles.requiredBadge}>
                {termsContent.required ? '필수' : '선택'}
              </Text>
              <Text style={styles.lastUpdated}>
                최종 수정일: {formatDate(termsContent.lastUpdated)}
              </Text>
            </View>
          </View>

          {/* 약관 내용 */}
          <View style={styles.contentSection}>
            <Text style={styles.contentText}>{termsContent.content}</Text>
          </View>
        </View>
      </ScrollView>

      {/* 하단 닫기 버튼 */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity style={styles.confirmButton} onPress={onClose}>
          <Text style={styles.confirmButtonText}>확인</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  placeholder: {
    width: 50, // 뒤로 버튼과 동일한 너비로 중앙 정렬
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
    lineHeight: 28,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  requiredBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999999',
  },
  contentSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
  },
  contentText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 22,
  },
  bottomButtonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  confirmButton: {
    backgroundColor: '#FFB6C1',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
});

export default TermsDetailScreen;
