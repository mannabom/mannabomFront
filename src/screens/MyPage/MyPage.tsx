// src/screens/MyPage/MyPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import AsyncStorage from '@react-native-async-storage/async-storage';

import ConfirmModal from '../../components/common/ConfirmModal';
import apiClient from '../../services/apiClient';
import { API_ENDPOINTS_LIST } from '../../config/api';

import type { RootStackParamList } from '../../navigation/types';
import type { MainTabParamList } from '../../navigation/MainTabNavigator';

type MyPageNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'mypage'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type ServerProfile = {
  nickName?: string;
  birthDate?: string;
  mbti?: string;
  height?: number;
  regionSido?: string;
  regionSigungu?: string;
  university?: string;
  profileImageUrl?: string;
  coins?: number;
  isSubscribed?: boolean;
};

type MyPageProps = {
  onLogout: () => void; // ✅ App.tsx의 handleLogout 연결용
};

export default function MyPage({ onLogout }: MyPageProps) {
  const navigation = useNavigation<MyPageNav>();

  const [logoutVisible, setLogoutVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ServerProfile | null>(null);
  const [mainPhotoUrl, setMainPhotoUrl] = useState<string | null>(null);
  const [coins, setCoins] = useState<number>(0);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const loadMyPage = useCallback(async () => {
    try {
      setLoading(true);

      // 1) 기본 정보
      const res = await apiClient.get(API_ENDPOINTS_LIST.USER_PROFILE);
      console.log('🧾 [MyPage] USER_PROFILE raw response:', res.data);

      const data: any = res.data?.data ?? res.data;

      const nextProfile: ServerProfile = {
        nickName: data?.nickName ?? data?.nickname ?? data?.profile?.nickName,
        birthDate: data?.birthDate ?? data?.profile?.birthDate,
        mbti: data?.mbti ?? data?.profile?.mbti,
        height: data?.height ?? data?.profile?.height,
        regionSido:
          data?.region?.sido ??
          data?.profile?.region?.sido ??
          data?.regionSido ??
          data?.profile?.regionSido,
        regionSigungu:
          data?.region?.sigungu ??
          data?.profile?.region?.sigungu ??
          data?.regionSigungu ??
          data?.profile?.regionSigungu,
        university: data?.university ?? data?.profile?.university,
        profileImageUrl:
          data?.profileImageUrl ??
          data?.profileImage ??
          data?.profile?.profileImageUrl,
        coins: data?.coins ?? data?.points ?? data?.myCoins ?? 0,
        isSubscribed: data?.isSubscribed ?? data?.subscribed ?? false,
      };

      setProfile(nextProfile);
      setCoins(Number(nextProfile.coins ?? 0));
      setIsSubscribed(Boolean(nextProfile.isSubscribed ?? false));

      // 2) 메인 사진
      try {
        const photoRes = await apiClient.get(API_ENDPOINTS_LIST.USER_MAIN_PHOTO);
        const photoData: any = photoRes.data?.data ?? photoRes.data;
        setMainPhotoUrl(
          photoData?.photoURL ??
            photoData?.photoUrl ??
            photoData?.url ??
            photoData?.profileImage ??
            null,
        );
      } catch (photoErr: any) {
        const status = photoErr?.response?.status;
        if (status === 401) {
          console.warn('🔒 [MyPage] 메인 사진 401 - 로그인 필요');
        } else {
          console.error(
            '❌ [MyPage] USER_MAIN_PHOTO error:',
            photoErr?.response?.data || photoErr?.message || photoErr,
          );
        }
        setMainPhotoUrl(null);
      }

      // 3) 구독 여부
      try {
        const membershipRes = await apiClient.get(API_ENDPOINTS_LIST.USER_MEMBERSHIP);
        const membershipData: any = membershipRes.data?.data ?? membershipRes.data;
        const active =
          membershipData?.isSubscribed ??
          membershipData?.subscribed ??
          membershipData?.active ??
          membershipData?.membershipActive;
        setIsSubscribed(Boolean(active));
      } catch (membershipErr: any) {
        const status = membershipErr?.response?.status;
        if (status === 401) {
          console.warn('🔒 [MyPage] 구독 여부 401 - 로그인 필요');
        } else {
          console.error(
            '❌ [MyPage] USER_MEMBERSHIP error:',
            membershipErr?.response?.data ||
              membershipErr?.message ||
              membershipErr,
          );
        }
      }
    } catch (e: any) {
      const status = e?.response?.status;
      const serverMessage =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        'unknown';
      console.error(
        '❌ [MyPage] USER_PROFILE error:',
        e?.response?.data || e?.message || e,
      );
      Alert.alert(
        '오류',
        `내 정보 불러오기에 실패했어요.\nstatus: ${status ?? 'unknown'}\nmessage: ${serverMessage}`,
        [
          { text: '닫기', style: 'cancel' },
          { text: '다시 시도', onPress: loadMyPage },
        ],
      );
    } finally {
      setLoading(false);
    }
  }, [/* loadMyPage는 내부에서 참조 */]);

  useEffect(() => {
    loadMyPage();
  }, [loadMyPage]);

  // ✅ 로그아웃 API 호출 후 로컬 정리 + 로그인 화면 이동
  // 백엔드: POST /api/auth/logout + body { deviceToken: String }
  const handleLogoutConfirm = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      const deviceToken =
        (await AsyncStorage.getItem('deviceToken')) ||
        (await AsyncStorage.getItem('fcmToken')) ||
        'unknown';

      await apiClient.post(API_ENDPOINTS_LIST.LOGOUT, { deviceToken });

      Alert.alert('로그아웃', '로그아웃 되었어요.', [
        {
          text: '확인',
          onPress: () => {
            onLogout();
          },
        },
      ]);
    } catch (e: any) {
      console.error('❌ [MyPage] LOGOUT error:', e?.response?.data || e?.message || e);

      // 서버 로그아웃 실패해도 UX상 로컬 로그아웃 진행
      Alert.alert('알림', '서버 로그아웃에 실패했지만 로그아웃 처리할게요.', [
        { text: '확인', onPress: () => onLogout() },
      ]);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // ✅ 탈퇴 API 호출 후 로컬 정리 + 로그인 화면 이동
  // 백엔드: DELETE /api/auth/leave (보통 body 없음)
  const handleLeaveConfirm = async () => {
    if (isLeaving) return;

    setIsLeaving(true);
    try {
      // ✅ 핵심 수정: POST -> DELETE
      // 보통은 바디 없이:
      await apiClient.delete(API_ENDPOINTS_LIST.LEAVE);

      // 만약 백엔드가 "빈 바디라도 받아야 함"이면 아래처럼 바꿔:
      // await apiClient.delete(API_ENDPOINTS_LIST.LEAVE, { data: {} });

      Alert.alert('탈퇴 완료', '이용해주셔서 감사합니다.', [
        {
          text: '확인',
          onPress: () => {
            onLogout();
          },
        },
      ]);
    } catch (e: any) {
      console.error('❌ [MyPage] LEAVE error:', e?.response?.data || e?.message || e);
      Alert.alert('오류', '탈퇴 처리에 실패했어요.\n잠시 후 다시 시도해주세요.');
    } finally {
      setIsLeaving(false);
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>불러오는 중...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 프로필 + 닉네임 */}
      <View style={styles.profileRow}>
        <View style={styles.avatar}>
          <Image
            style={styles.avatarImage}
            source={{
              uri:
                mainPhotoUrl ||
                profile?.profileImageUrl ||
                'https://via.placeholder.com/150',
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.nickname}>{profile?.nickName ?? '닉네임 없음'}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, styles.coinBadge]}>
              <Text style={styles.badgeText}>팅 {coins}개</Text>
            </View>
            <View
              style={[
                styles.badge,
                isSubscribed ? styles.subscribedBadge : styles.unsubscribedBadge,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  isSubscribed && { color: '#fff' },
                  !isSubscribed && { color: '#EB5757' },
                ]}
              >
                {isSubscribed ? '구독중' : '미구독'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 보유 팅 + 구독 카드 */}
      <View style={styles.cardBox}>
        {[
          { label: `보유 팅 : ${coins}개`, action: () => console.log('충전 이동') },
          {
            label: `구독 : ${isSubscribed ? '구독중' : '미구독'}`,
            action: () => console.log('구독 이동'),
          },
        ].map((item, idx, arr) => {
          const isLast = idx === arr.length - 1;
          return (
            <View key={idx} style={[styles.cardRow, isLast && styles.lastCardRow]}>
              <Text style={styles.cardText}>{item.label}</Text>
              <Pressable style={styles.cta} onPress={item.action}>
                <Text style={styles.ctaText}>
                  {idx === 0 ? '충전' : isSubscribed ? '관리' : '구독'}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      {/* 벤치 이미지 */}
      <Image
        source={require('../../assets/images/bench.png')}
        style={styles.bench}
      />

      {/* 메뉴 리스트 */}
      <View style={styles.menuWrapper}>
        {[
          {
            label: '1. 프로필 수정',
            action: () => navigation.navigate('ProfileDetail'),
          },
          { label: '2. 스토어', action: () => console.log('스토어') },
          { label: '3. 고객센터', action: () => console.log('고객센터') },
          { label: '4. 앱정보', action: () => console.log('앱정보') },
          { label: '5. 로그아웃', action: () => setLogoutVisible(true) },
          { label: '6. 탈퇴', action: () => setDeleteVisible(true) },
        ].map((item, idx, arr) => {
          const isLast = idx === arr.length - 1;
          return (
            <Pressable
              key={idx}
              style={[styles.menuItem, isLast && styles.lastMenuItem]}
              onPress={item.action}
            >
              <Text style={styles.menuText}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* 벚꽃 이미지 4개 */}
      <Image source={require('../../assets/images/petal.png')} style={styles.petal1} />
      <Image source={require('../../assets/images/petal.png')} style={styles.petal2} />
      <Image source={require('../../assets/images/petal.png')} style={styles.petal3} />
      <Image source={require('../../assets/images/petal.png')} style={styles.petal4} />

      {/* 로그아웃 모달 */}
      <ConfirmModal
        visible={logoutVisible}
        title="로그아웃하시겠습니까?🥲"
        message="다시 로그인 할 때까지 기다릴게요!"
        confirmText={isLoggingOut ? '로그아웃 중...' : '로그아웃하기'}
        onCancel={() => {
          if (!isLoggingOut) setLogoutVisible(false);
        }}
        onConfirm={async () => {
          setLogoutVisible(false);
          await handleLogoutConfirm();
        }}
      />

      {/* 탈퇴 모달 */}
      <ConfirmModal
        visible={deleteVisible}
        title="탈퇴하시겠습니까?😭"
        message="탈퇴할 시 보유 재화 및 구독은 사라져요"
        confirmText={isLeaving ? '탈퇴 처리 중...' : '탈퇴하기'}
        onCancel={() => {
          if (!isLeaving) setDeleteVisible(false);
        }}
        onConfirm={async () => {
          setDeleteVisible(false);
          await handleLeaveConfirm();
        }}
      />
    </ScrollView>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },

  // 프로필 + 닉네임
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: '#AFB1B6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 75,
  },
  nickname: {
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF9595',
    backgroundColor: '#fff4f4',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9595',
  },
  coinBadge: {
    borderColor: '#FF9595',
    backgroundColor: '#FFE5E5',
    marginRight: 8,
  },
  subscribedBadge: {
    backgroundColor: '#EB5757',
    borderColor: '#EB5757',
  },
  unsubscribedBadge: {
    backgroundColor: '#fff',
    borderColor: '#EB5757',
  },

  // 보유 팅 + 구독 카드
  cardBox: {
    marginBottom: 20,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#FF9595',
    borderRadius: 5,
    backgroundColor: '#fff',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,

    marginTop: -3,
  },
  lastCardRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#FF9595',
    marginBottom: 16,
  },

  cardText: {
    fontFamily: 'WorkSans',
    fontWeight: '400',
    fontStyle: 'normal',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
    color: '#19191B',
  },
  cta: {
    width: 56,
    height: 23,
    backgroundColor: '#EB5757',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: 'ABeeZee',
    fontWeight: '400',
    fontStyle: 'normal',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.23,
    color: '#FFFFFF',
  },

  // 메뉴 리스트
  menuWrapper: {
    marginTop: 16,
  },

  menuItem: {
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#FF9595',
    borderRadius: 5,
    backgroundColor: '#fff',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,

    marginTop: -3,
  },
  lastMenuItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#FF9595',
    marginBottom: 16,
  },

  menuText: {
    fontFamily: 'WorkSans',
    fontWeight: '400',
    fontStyle: 'normal',
    fontSize: 16,
    lineHeight: 24,
    color: '#19191B',
  },

  // 장식 이미지들
  bench: {
    position: 'absolute',
    right: -18,
    top: 132,
    width: 70,
    height: 70,
    resizeMode: 'contain',
  },

  // 벚꽃들
  petal1: {
    position: 'absolute',
    left: -13,
    top: 308,
    width: 50,
    height: 50,
    resizeMode: 'contain',
    transform: [{ rotate: '-80deg' }],
  },
  petal2: {
    position: 'absolute',
    right: 105,
    top: 368,
    width: 50,
    height: 50,
    resizeMode: 'contain',
    transform: [{ rotate: '-65deg' }],
    opacity: 0.5,
  },
  petal3: {
    position: 'absolute',
    left: 90,
    top: 462,
    width: 50,
    height: 50,
    resizeMode: 'contain',
    transform: [{ rotate: '-45deg' }],
    opacity: 0.5,
  },
  petal4: {
    position: 'absolute',
    right: 65,
    top: 548,
    width: 50,
    height: 50,
    resizeMode: 'contain',
    transform: [{ rotate: '-35deg' }],
    opacity: 0.5,
  },
});
