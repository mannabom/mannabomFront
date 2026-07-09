// src/screens/login/TermsDetailScreen.tsx
import React, { useMemo } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfileId } from '../../utils/AuthUtils';
import type { SignupTermType } from './TermsAgreementScreen';

interface TermsDetailScreenProps {
  termType: SignupTermType;
  onClose: () => void;
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

const TERM_STATE_KEY: Record<SignupTermType, keyof TermsState> = {
  privacy: 'privacyCollection',
  operation: 'operationPolicy',
  payment: 'paymentService',
  location: 'locationService',
  marketing: 'marketingConsent',
};

const TERMS_CONTENT: Record<SignupTermType, { title: string; content: string }> = {
  privacy: {
    title: '[필수] 개인정보 수집 및 이용 동의',
    content: `“만나봄”(이하 “회사”)은 원활한 서비스 제공 및 회원 관리를 위해 아래와 같이 개인정보를 수집·이용합니다.

■ 수집 및 이용 목적
회원가입 및 본인 확인
만 19세 이상 여부 확인
개인 맞춤형 매칭 서비스 제공
부정 이용 및 중복 가입 방지
신고 처리 및 고객 문의 응대
서비스 운영, 통계 분석 및 개선

■ 수집 항목
닉네임
성별
생년월일
휴대폰번호
지역정보
프로필 사진
학교 및 자기소개(선택 입력 가능)

■ 보유 및 이용 기간
회원 탈퇴 시까지 보관 및 이용
회원 탈퇴 후 부정 이용 방지 및 분쟁 대응을 위해 관련 정보를 최대 1년간 보관할 수 있습니다.
단, 관련 법령에 따라 보관이 필요한 경우 해당 기간 동안 보관 후 파기합니다.

※ 이용자는 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있으며, 필수 항목에 대한 동의를 거부할 경우 서비스 이용이 제한될 수 있습니다.`,
  },
  marketing: {
    title: '[선택] 마케팅 및 광고 정보 수신 동의',
    content: `회사는 이벤트, 혜택, 신규 기능 안내 등 광고성 정보를 앱 푸시 알림 및 SMS를 통해 발송할 수 있습니다.

■ 활용 목적
이벤트 및 프로모션 안내
할인 쿠폰 및 혜택 제공
신규 서비스 및 기능 안내

■ 수신 방법
앱 푸시 알림
문자메시지(SMS)

※ 본 항목은 선택 동의 사항이며, 동의하지 않으셔도 서비스 이용에는 제한이 없습니다. 수신 동의는 언제든지 철회할 수 있습니다.`,
  },
  location: {
    title: '[필수] 위치정보 이용 동의',
    content: `회사는 회원 간 원활한 매칭 서비스 제공을 위하여 위치정보를 이용할 수 있습니다.

■ 이용 목적
주변 사용자 추천
거리 기반 매칭 서비스 제공
실제 만남 여부 확인을 위한 인증 절차 수행

■ 이용 항목
GPS 기반 위치정보
이용자가 직접 설정한 활동 지역

※ 이용자는 위치정보 제공을 거부할 수 있으나 일부 위치 기반 기능 이용이 제한될 수 있습니다.`,
  },
  payment: {
    title: '[필수] 결제 서비스 이용 동의',
    content: `회사는 회원 간 신뢰도 향상 및 원활한 서비스 제공을 위하여 결제 서비스를 운영할 수 있습니다.

■ 이용 목적
유료 서비스 제공
매칭 성사 후 만남 이행 확인
안전한 서비스 운영

■ 운영 방식
회원은 서비스 이용 과정에서 회사가 제공하는 유료 서비스를 이용할 수 있습니다.
매칭이 성사되고 만남 일정이 확정된 경우 회사는 일정 금액의 선결제를 요청할 수 있습니다.
실제 만남이 정상적으로 진행된 것으로 확인되는 경우 해당 금액은 회사 정책에 따라 환급될 수 있습니다.
만남 여부는 위치정보, 양측 회원의 확인 또는 회사가 정한 인증 절차를 통해 확인될 수 있습니다.
허위 인증, 부정 이용 또는 운영정책 위반이 확인되는 경우 환급이 제한될 수 있습니다.
결제, 취소 및 환급에 관한 세부 사항은 별도의 운영정책에 따릅니다.

※ 이용자는 결제 서비스 이용에 대한 동의를 거부할 수 있으나 결제가 필요한 일부 서비스 이용이 제한될 수 있습니다.`,
  },
  operation: {
    title: '[필수] 운영 정책 및 이용 제한 안내',
    content: `회사는 안전한 서비스 환경 조성을 위해 아래 행위를 제한할 수 있습니다.

■ 제한 가능 행위
타인 사칭
욕설, 비방, 성희롱
불법 촬영물 및 음란물 업로드
광고 및 도배 행위
사기 및 금전 요구 행위
허위 정보 등록
허위 만남 인증 행위
기타 운영 정책 위반 행위

■ 조치 사항
게시물 삭제
채팅 제한
계정 정지
영구 이용 제한
환급 제한 또는 서비스 이용 제한

※ 회사는 운영정책 위반 정도에 따라 단계적으로 조치할 수 있습니다.`,
  },
};

const normalizeTermsState = (raw: Partial<TermsState> & Record<string, unknown>): TermsState => ({
  privacyCollection: Boolean(raw.privacyCollection ?? raw.privacyPolicy),
  operationPolicy: Boolean(raw.operationPolicy ?? raw.serviceTerms),
  paymentService: Boolean(raw.paymentService ?? raw.serviceTerms),
  locationService: Boolean(raw.locationService ?? raw.serviceTerms),
  marketingConsent: Boolean(raw.marketingConsent),
});

const TermsDetailScreen: React.FC<TermsDetailScreenProps> = ({
  termType,
  onClose,
}) => {
  const termsContent = useMemo(() => TERMS_CONTENT[termType], [termType]);

  const handleConfirm = async () => {
    try {
      const id = await getProfileId();
      const key = id ? `${STORAGE_PREFIX}_${id}` : STORAGE_PREFIX;
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
        <Text style={styles.title}>{termsContent.title}</Text>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.contentText}>{termsContent.content}</Text>
        </ScrollView>

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirm}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmText}>확인</Text>
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
  confirmText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TermsDetailScreen;
