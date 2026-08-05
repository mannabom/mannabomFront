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
import { API_ENDPOINTS_LIST } from '../../config/api';
import {
  clearSignupSession,
  getSignupProfileId,
  saveAuthenticatedSession,
} from '../../utils/AuthUtils';
import {
  SignupCompleteRequestDto,
  SignupCompleteResponseDto,
} from '../../types/NicknameAPI';
import {
  getCombinedProfileData,
  clearAllProfileData,
} from '../../utils/ProfileStorage';
import { requireExternalId } from '../../utils/IdUtils';
import signupApiClient from '../../services/signupApiClient';
import { signupApiService } from '../../services/SignupApiService';

interface CongratulationsScreenProps {
  onComplete: (userData: any) => void;
}

interface PendingUserData {
  signupProfileId: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  initialPoints: number;
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

const requireNonEmptyString = (value: unknown, fieldName: string): string => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${fieldName}이(가) 없는 잘못된 서버 응답입니다.`);
  }
  return value.trim();
};

const requireInitialPoints = (value: unknown): number => {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new Error('초기 포인트가 없는 잘못된 서버 응답입니다.');
  }
  return value;
};

const CongratulationsScreen: React.FC<CongratulationsScreenProps> = ({
  onComplete,
}) => {
  const [isPreparing, setIsPreparing] = useState(true);
  const [initialPoints, setInitialPoints] = useState<number>(0);
  const [pendingUserData, setPendingUserData] =
    useState<PendingUserData | null>(null);

  const [cardSize, setCardSize] = useState<{ w: number; h: number }>({
    w: CARD_W,
    h: 360,
  });

  const confetti = useMemo<ConfettiShape[]>(() => {
    const w = Math.max(1, cardSize.w);
    const h = Math.max(1, cardSize.h);

    const makeRand = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    const shapes: ConfettiShape[] = [];
    for (let i = 0; i < 18; i++) {
      const r1 = makeRand(i * 13.37);
      const r2 = makeRand(i * 91.17);
      const r3 = makeRand(i * 7.77);

      const typePick = i % 3;
      const type =
        typePick === 0 ? 'circle' : typePick === 1 ? 'square' : 'triangle';

      const size = 6 + Math.floor(r3 * 8);
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

  async function persistCompletedSignup(
    completedUserData: PendingUserData,
  ): Promise<void> {
    await saveAuthenticatedSession(
      completedUserData.accessToken,
      completedUserData.refreshToken,
      completedUserData.userId,
    );

    setInitialPoints(completedUserData.initialPoints);
    setPendingUserData(completedUserData);

    const cleanupResults = await Promise.allSettled([
      clearAllProfileData(completedUserData.signupProfileId),
      clearSignupSession(),
    ]);
    const failedCleanup = cleanupResults.find(
      result => result.status === 'rejected',
    );
    if (failedCleanup?.status === 'rejected') {
      if (__DEV__) {
        console.warn(
          '❌ 가입 임시 데이터 정리 실패(로그인 세션은 저장됨):',
          failedCleanup.reason,
        );
      }
    }
  }

  function showSessionSaveError(completedUserData: PendingUserData): void {
    Alert.alert(
      '로그인 정보 저장 실패',
      '회원가입은 완료되었지만 로그인 정보를 기기에 저장하지 못했습니다. 완료 API를 다시 호출하지 않고 저장만 다시 시도합니다.',
      [
        {
          text: '저장 다시 시도',
          onPress: () => {
            void retrySessionSave(completedUserData);
          },
        },
      ],
    );
  }

  async function retrySessionSave(
    completedUserData: PendingUserData,
  ): Promise<void> {
    try {
      setIsPreparing(true);
      await persistCompletedSignup(completedUserData);
    } catch (error) {
      if (__DEV__) {
        console.warn('❌ 완료된 회원가입의 로그인 정보 재저장 실패:', error);
      }
      showSessionSaveError(completedUserData);
    } finally {
      setIsPreparing(false);
    }
  }

  const prepareSignupResult = async () => {
    let completedUserData: PendingUserData | null = null;

    try {
      setIsPreparing(true);

      const signupProfileId = await getSignupProfileId();
      if (__DEV__) {
        console.log(
          '🎉 [prepareSignupResult] signupProfileId:',
          signupProfileId ? 'YES' : 'NO',
        );
      }

      if (!signupProfileId) {
        throw new Error('가입 진행 ID가 없습니다. 다시 로그인해주세요.');
      }

      const combined = await getCombinedProfileData(signupProfileId);
      if (__DEV__) console.log('🔗 [prepareSignupResult] combined profile data ready:', !!combined);

      if (!combined) {
        throw new Error(
          '로컬에 저장된 프로필 데이터가 부족해요. (신체/자기소개/연애관 저장 여부 확인 필요)',
        );
      }

      const profileResponse = await signupApiClient.post(
        API_ENDPOINTS_LIST.SAVE_PROFILE_RELATIONSHIP,
        combined,
      );
      if (profileResponse.data?.success === false) {
        throw new Error(
          profileResponse.data?.message || '프로필 저장에 실패했습니다.',
        );
      }

      const requestData: SignupCompleteRequestDto = {
        profileId: signupProfileId,
      };

      if (__DEV__) console.log('📝 [signup complete] request profileId:', requestData.profileId ? 'YES' : 'NO');

      const responseData: SignupCompleteResponseDto =
        await signupApiService.completeSignup(requestData);

      if (
        responseData?.success !== true ||
        !responseData.data
      ) {
        const msg =
          responseData?.message ||
          '회원가입 완료 중 오류가 발생했습니다.';
        throw new Error(msg);
      }

      completedUserData = {
        signupProfileId,
        userId: requireExternalId(
          responseData.data.userId,
          '회원가입 완료 사용자 ID',
        ),
        accessToken: requireNonEmptyString(
          responseData.data.accessToken,
          '액세스 토큰',
        ),
        refreshToken: requireNonEmptyString(
          responseData.data.refreshToken,
          '리프레시 토큰',
        ),
        initialPoints: requireInitialPoints(responseData.data.initialPoints),
      };

      await persistCompletedSignup(completedUserData);
    } catch (error) {
      if (__DEV__) console.warn('❌ 회원가입 준비 오류(prepareSignupResult):', error);

      if (completedUserData) {
        showSessionSaveError(completedUserData);
        return;
      }

      const msg = error instanceof Error ? error.message : '오류가 발생했습니다.';

      Alert.alert('오류', msg, [{ text: '다시 시도', onPress: prepareSignupResult }]);
    } finally {
      setIsPreparing(false);
    }
  };

  useEffect(() => {
    prepareSignupResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirm = () => {
    if (!pendingUserData) return;

    const {
      signupProfileId: _completedSignupProfileId,
      ...authenticatedUserData
    } = pendingUserData;
    onComplete(authenticatedUserData);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centerWrap}>
        <View
          style={styles.card}
          onLayout={e => {
            const { width, height } = e.nativeEvent.layout;
            if (Math.abs(width - cardSize.w) > 1 || Math.abs(height - cardSize.h) > 1) {
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
              (isPreparing || !pendingUserData) && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirm}
            disabled={isPreparing || !pendingUserData}
            activeOpacity={0.85}
          >
            {isPreparing ? (
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
  confettiLayer: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#222222',
    textAlign: 'center',
    marginBottom: 12,
    zIndex: 1,
  },
  pointBlock: { alignItems: 'center', marginBottom: 14, zIndex: 1 },
  pointBrand: { fontSize: 24, fontWeight: '900', color: '#222222', marginBottom: 4 },
  pointAmount: { fontSize: 28, fontWeight: '900', color: '#222222' },
  bullets: { alignSelf: 'stretch', marginTop: 6, marginBottom: 16, zIndex: 1 },
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
