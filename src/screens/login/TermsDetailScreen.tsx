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

  // 임시 약관 데이터 (API 에러 시 사용)
  const getTemporaryTermsContent = (type: string): TermsContent => {
    const contents = {
      service: {
        termType: 'service',
        title: '서비스 이용약관',
        content: `제1조 (목적)
이 약관은 회사가 제공하는 서비스의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (정의)
1. "서비스"란 회사가 제공하는 모든 서비스를 의미합니다.
2. "이용자"란 이 약관에 따라 회사의 서비스를 받는 회원 및 비회원을 말합니다.
3. "회원"이란 회사의 서비스에 접속하여 이 약관에 따라 회사와 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 고객을 말합니다.

제3조 (약관의 효력 및 변경)
1. 이 약관은 서비스를 이용하고자 하는 모든 이용자에게 그 효력이 발생합니다.
2. 회사는 필요하다고 인정되는 경우 이 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지사항을 통해 공지합니다.

제4조 (서비스의 제공)
회사는 이용자에게 아래와 같은 서비스를 제공합니다.
1. 소셜 매칭 서비스
2. 프로필 관리 서비스
3. 커뮤니케이션 서비스
4. 기타 회사가 정하는 서비스

제5조 (회원가입)
1. 이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로서 회원가입을 신청합니다.
2. 회사는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각호에 해당하지 않는 한 회원으로 등록합니다.`,
        lastUpdated: '2025-01-01',
        required: true,
      },
      privacy: {
        termType: 'privacy',
        title: '개인정보 처리방침',
        content: `제1조 (개인정보의 처리목적)
회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.

1. 회원 가입 및 관리
회원 가입 의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지 목적으로 개인정보를 처리합니다.

2. 서비스 제공
매칭 서비스 제공, 콘텐츠 제공, 맞춤 서비스 제공, 본인인증을 목적으로 개인정보를 처리합니다.

제2조 (개인정보의 처리 및 보유기간)
1. 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
2. 회원탈퇴 시까지 보유하며, 탈퇴 시 즉시 파기합니다.

제3조 (처리하는 개인정보의 항목)
회사는 다음의 개인정보 항목을 처리하고 있습니다.
1. 필수항목: 이메일, 닉네임, 생년월일, 성별
2. 선택항목: 프로필 사진, 자기소개, 관심사

제4조 (개인정보의 제3자 제공)
회사는 정보주체의 개인정보를 제1조(개인정보의 처리목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보보호법 제17조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.`,
        lastUpdated: '2025-01-01',
        required: true,
      },
      marketing: {
        termType: 'marketing',
        title: '마케팅 정보 수신 동의',
        content: `제1조 (마케팅 정보 수신 동의)
회사는 이용자의 동의를 받아 마케팅 정보를 제공합니다. 마케팅 정보 수신에 동의하지 않으셔도 서비스 이용에는 제한이 없습니다.

제2조 (수집하는 정보)
마케팅 정보 발송을 위해 다음 정보를 수집합니다:
1. 이메일 주소 (필수)
2. 휴대폰 번호 (선택)
3. 서비스 이용 패턴 (자동 수집)

제3조 (마케팅 정보의 내용)
다음과 같은 마케팅 정보를 제공합니다:
1. 새로운 서비스 및 기능 안내
2. 이벤트 및 프로모션 정보
3. 맞춤형 콘텐츠 추천
4. 할인 혜택 및 쿠폰 정보
5. 서비스 이용 팁 및 가이드

제4조 (발송 방법 및 빈도)
1. 발송 방법: 이메일, SMS, 푸시 알림, 앱 내 메시지
2. 발송 빈도: 주 1-2회 (중요한 정보의 경우 수시 발송 가능)

제5조 (수신 거부)
1. 이용자는 언제든지 마케팅 정보 수신을 거부할 수 있습니다.
2. 수신 거부 방법: 앱 설정, 이메일 내 수신거부 링크, 고객센터 문의
3. 수신 거부 시에도 서비스 이용에는 제한이 없습니다.

제6조 (개인정보의 보유 및 이용기간)
마케팅 정보 수신 동의 철회 시까지 보유하며, 동의 철회 시 관련 정보를 즉시 파기합니다.`,
        lastUpdated: '2025-01-01',
        required: false,
      },
    };

    return contents[type as keyof typeof contents] || contents.service;
  };

  const fetchTermsContent = async () => {
    try {
      setIsLoading(true);

      // API 엔드포인트 올바르게 구성
      const endpoint = API_ENDPOINTS_LIST.TERMS_CONTENT.replace(
        '{termType}',
        termType,
      );

      console.log('약관 내용 요청 URL:', endpoint);

      // 인증 없이 요청 (회원가입 과정이므로)
      const response = await apiClient.get(endpoint);

      console.log('약관 내용 응답:', response.data);

      if (response.data.success) {
        setTermsContent(response.data.data);
      } else {
        console.log('API 응답 실패, 임시 데이터 사용');
        setTermsContent(getTemporaryTermsContent(termType));
      }
    } catch (error) {
      console.error('약관 내용 조회 오류:', error);

      // 에러 상세 정보 로깅
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        console.error('에러 응답:', axiosError.response?.data);
        console.error('에러 상태:', axiosError.response?.status);
      }

      // 에러 발생 시 임시 데이터 사용 (사용자에게는 에러 노출하지 않음)
      console.log('에러 발생으로 임시 약관 데이터 사용');
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
              <Text
                style={[
                  styles.requiredBadge,
                  !termsContent.required && styles.optionalBadge,
                ]}
              >
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
  optionalBadge: {
    backgroundColor: '#666666',
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
