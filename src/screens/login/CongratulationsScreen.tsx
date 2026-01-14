// src/screens/login/CongratulationsScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { API_BASE_URL, API_ENDPOINTS_LIST } from '../../config/api';
import { getProfileId, saveAuthTokens } from '../../utils/AuthUtils';
import {
  SignupCompleteRequestDto,
  SignupCompleteResponseDto,
} from '../../types/NicknameAPI';
import { getCombinedProfileData } from '../../utils/ProfileStorage';

interface CongratulationsScreenProps {
  onComplete: (userData: any) => void;
}

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = Math.min(420, SCREEN_W - 48);

type ConfettiShape =
  | {
      type: 'circle';
      size: number;
      color: string;
      top: number;
      left: number;
      rotate?: string;
      opacity?: number;
    }
  | {
      type: 'square';
      size: number;
      color: string;
      top: number;
      left: number;
      rotate?: string;
      opacity?: number;
    }
  | {
      type: 'triangle';
      size: number;
      color: string;
      top: number;
      left: number;
      rotate?: string;
      opacity?: number;
    };

const COLORS = [
  '#FFD93D',
  '#4D96FF',
  '#FF9F43',
  '#A55EEA',
  '#26C0C7',
  '#6BCF7F',
  '#FD5E53',
  '#FF6B9D',
] as const;

// fetch 응답 안전 파서(로그용)
const readResponseBody = async (res: Response) => {
  const text = await res.text();
  try {
    return { text, json: text ? JSON.parse(text) : null };
  } catch {
    return { text, json: null };
  }
};

const CongratulationsScreen: React.FC<CongratulationsScreenProps> = ({
  onComplete,
}) => {
  const [isPreparing, setIsPreparing] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [initialPoints, setInitialPoints] = useState<number>(0);
  const [pendingUserData, setPendingUserData] = useState<any | null>(null);

  const [cardSize, setCardSize] = useState<{ w: number; h: number }>({
    w: CARD_W,
    h: 360,
  });

  // ✅ 카드 안에만 컨페티(숫자 좌표라 TS 에러도 깔끔하게 회피)
  const confetti = useMemo<ConfettiShape[]>(() => {
    const w = Math.max(1, cardSize.w);
    const h = Math.max(1, cardSize.h);

    const makeRand = (seed: number) => {
      // 간단한 deterministic pseudo-random
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    const shapes: ConfettiShape[] = [];
    for (let i = 0; i < 18; i++) {
      const r1 = makeRand(i * 13.37);
      const r2 = makeRand(i * 91.17);
      const r3 = makeRand(i * 7.77);

      const typePick = i % 3;
      const type = typePick === 0 ? 'circle' : typePick === 1 ? 'square' : 'triangle';

      const size = 6 + Math.floor(r3 * 8); // 6~13
      const left = Math.floor(r1 * (w - 16)) + 8;
      const top = Math.floor(r2 * (h - 16)) + 8;

      const color = COLORS[i % COLORS.length];
      const rotate = `${Math.floor(makeRand(i * 33.3) * 120 - 60)}deg`;
      const opacity = 0.82 + makeRand(i * 3.14) * 0.15;

      shapes.push({
        type: type as any,
        size,
        color,
        left,
        top,
        rotate,
        opacity,
      });
    }
    return shapes;
  }, [cardSize]);

  const renderConfetti = (shape: ConfettiShape, idx: number) => {
    const common: any = {
      position: 'absolute',
      top: shape.top,
      left: shape.left,
      opacity: shape.opacity ?? 0.9,
      transform: shape.rotate ? [{ rotate: shape.rotate }] : undefined,
      zIndex: 0,
    };

    if (shape.type === 'circle') {
      return (
        <View
          key={idx}
          style={[
            common,
            {
              width: shape.size,
              height: shape.size,
              borderRadius: shape.size / 2,
              backgroundColor: shape.color,
            },
          ]}
        />
      );
    }

    if (shape.type === 'triangle') {
      return (
        <View
          key={idx}
          style={[
            common,
            {
              width: 0,
              height: 0,
              borderLeftWidth: shape.size / 2,
              borderRightWidth: shape.size / 2,
              borderBottomWidth: shape.size,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: shape.color,
              backgroundColor: 'transparent',
            },
          ]}
        />
      );
    }

    return (
      <View
        key={idx}
        style={[
          common,
          {
            width: shape.size,
            height: shape.size,
            backgroundColor: shape.color,
          },
        ]}
      />
    );
  };

  /**
   * ✅ 핵심:
   * 1) 로컬에 저장된 프로필/연애관 데이터를 모아서
   * 2) /api/signup/profile-relationship 로 먼저 서버에 저장
   * 3) 성공하면 /api/signup/complete 호출
   */
  const prepareSignupResult = async () => {
    try {
      setIsPreparing(true);

      const profileId = await getProfileId();
      console.log('🎉 [prepareSignupResult] profileId:', profileId);

      if (!profileId) {
        throw new Error('프로필 ID가 없습니다. 다시 로그인해주세요.');
      }

      // 1) 로컬 데이터 합치기
      const combined = await getCombinedProfileData(profileId);
      console.log('🔗 [prepareSignupResult] combined profile data:', combined);

      if (!combined) {
        throw new Error(
          '로컬에 저장된 프로필 데이터가 부족해요. (신체/자기소개/연애관 저장 여부 확인 필요)',
        );
      }

      // 2) 서버에 profile-relationship 저장 (가입 단계 완료 처리용)
      const prUrl = `${API_BASE_URL}${API_ENDPOINTS_LIST.SAVE_PROFILE_RELATIONSHIP}`;
      console.log('🌐 [prepareSignupResult] POST profile-relationship:', prUrl);

      const prRes = await fetch(prUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(combined),
      });

      const prBody = await readResponseBody(prRes);
      console.log('✅ [profile-relationship] status:', prRes.status);
      console.log('📄 [profile-relationship] body(text):', prBody.text);
      console.log('📦 [profile-relationship] body(json):', prBody.json);

      // 백엔드가 success 필드를 쓰는 경우까지 같이 커버
      if (!prRes.ok || (prBody.json && prBody.json.success === false)) {
        const msg =
          prBody.json?.message ||
          `프로필 저장 실패 (status ${prRes.status})`;
        throw new Error(msg);
      }

      // 3) 이제 complete 호출
      const completeUrl = `${API_BASE_URL}${API_ENDPOINTS_LIST.SIGNUP_COMPLETE}`;
      const requestData: SignupCompleteRequestDto = { profileId };

      console.log('🌐 [prepareSignupResult] POST signup complete:', completeUrl);
      console.log('📝 [signup complete] request:', requestData);

      const res = await fetch(completeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const body = await readResponseBody(res);
      console.log('✅ [signup complete] status:', res.status);
      console.log('📄 [signup complete] body(text):', body.text);
      console.log('📦 [signup complete] body(json):', body.json);

      const responseData = body.json as SignupCompleteResponseDto | null;

      if (!res.ok || !responseData?.data) {
        const msg =
          responseData?.message ||
          body.text ||
          '회원가입 완료 중 오류가 발생했습니다.';
        throw new Error(msg);
      }

      setInitialPoints(responseData.data.initialPoints);

      const userData = {
        userId: responseData.data.userId,
        accessToken: responseData.data.accessToken,
        refreshToken: responseData.data.refreshToken,
        initialPoints: responseData.data.initialPoints,
      };
      setPendingUserData(userData);
    } catch (error) {
      console.error('❌ 회원가입 준비 오류(prepareSignupResult):', error);

      const msg =
        error instanceof Error ? error.message : '오류가 발생했습니다.';

      Alert.alert('오류', msg, [{ text: '다시 시도', onPress: prepareSignupResult }]);
    } finally {
      setIsPreparing(false);
    }
  };

  useEffect(() => {
    prepareSignupResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirm = async () => {
    if (!pendingUserData || isCompleting) return;

    setIsCompleting(true);
    try {
      console.log('🔐 [handleConfirm] saveAuthTokens start');
      await saveAuthTokens(pendingUserData.accessToken, pendingUserData.refreshToken);
      console.log('✅ [handleConfirm] tokens saved, navigating...');
      onComplete(pendingUserData);
    } catch (e) {
      console.error('❌ 토큰 저장 오류:', e);
      Alert.alert('오류', '로그인 정보 저장 중 문제가 발생했어요.');
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centerWrap}>
        <View
          style={styles.card}
          onLayout={e => {
            const { width, height } = e.nativeEvent.layout;
            // 무한 setState 방지
            if (
              Math.abs(width - cardSize.w) > 1 ||
              Math.abs(height - cardSize.h) > 1
            ) {
              setCardSize({ w: width, h: height });
            }
          }}
        >
          <View style={styles.confettiLayer} pointerEvents="none">
            {confetti.map(renderConfetti)}
          </View>

          <Text style={styles.title}>축하합니다!</Text>

          <View style={styles.pointBlock}>
            <Text style={styles.pointBrand}>포인트팅</Text>
            <Text style={styles.pointAmount}>
              {isPreparing ? '...' : `${initialPoints}P 지급!`}
            </Text>
          </View>

          <View style={styles.bullets}>
            <View style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>지급 시점: 지금 즉시 사용 가능</Text>
            </View>
            <View style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>사용기간: 유효기간 30일</Text>
            </View>
            <View style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>유의사항: 유효기간 경과 시 소멸</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.confirmButton,
              (isPreparing || !pendingUserData || isCompleting) && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirm}
            disabled={isPreparing || !pendingUserData || isCompleting}
            activeOpacity={0.85}
          >
            {isPreparing || isCompleting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmButtonText}>확인</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  card: {
    width: CARD_W,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },

  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },

  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#222222',
    textAlign: 'center',
    marginBottom: 12,
    zIndex: 1,
  },

  pointBlock: {
    alignItems: 'center',
    marginBottom: 14,
    zIndex: 1,
  },
  pointBrand: {
    fontSize: 24,
    fontWeight: '900',
    color: '#222222',
    marginBottom: 4,
  },
  pointAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#222222',
  },

  bullets: {
    alignSelf: 'stretch',
    marginTop: 6,
    marginBottom: 16,
    zIndex: 1,
  },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  bulletDot: { marginRight: 8, fontSize: 14, color: '#333333', marginTop: 2 },
  bulletText: { flex: 1, fontSize: 13, color: '#333333', lineHeight: 18, fontWeight: '500' },

  confirmButton: {
    marginTop: 4,
    backgroundColor: '#4ECDC4',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  confirmButtonDisabled: { opacity: 0.6 },
  confirmButtonText: { fontSize: 15, fontWeight: '900', color: '#FFFFFF' },
});

export default CongratulationsScreen;
