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
} from 'react-native';
import { styles } from './MyPage.styles';

import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

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

export default function MyPage() {
  const navigation = useNavigation<MyPageNav>();

  const [logoutVisible, setLogoutVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ServerProfile | null>(null);
  const [coins, setCoins] = useState<number>(0);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);

  const loadMyPage = useCallback(async () => {
    try {
      setLoading(true);

      const res = await apiClient.get(API_ENDPOINTS_LIST.USER_PROFILE);
      console.log('🧾 [MyPage] USER_PROFILE raw response:', res.data);

      const data: any = res.data?.data ?? res.data;

      const nextProfile: ServerProfile = {
        nickName: data?.nickName ?? data?.nickname ?? data?.profile?.nickName,
        birthDate: data?.birthDate ?? data?.profile?.birthDate,
        mbti: data?.mbti ?? data?.profile?.mbti,
        height: data?.height ?? data?.profile?.height,
        regionSido: data?.regionSido ?? data?.profile?.regionSido,
        regionSigungu: data?.regionSigungu ?? data?.profile?.regionSigungu,
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
    } catch (e: any) {
      console.error(
        '❌ [MyPage] USER_PROFILE error:',
        e?.response?.data || e?.message || e,
      );
      Alert.alert(
        '오류',
        '내 정보 불러오기에 실패했어요.\n(토큰/서버 상태 확인 필요)',
        [{ text: '다시 시도', onPress: loadMyPage }],
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyPage();
  }, [loadMyPage]);

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
              uri: profile?.profileImageUrl || 'https://via.placeholder.com/150',
            }}
          />
        </View>
        <Text style={styles.nickname}>{profile?.nickName ?? '닉네임 없음'}</Text>
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
            <View
              key={idx}
              style={[styles.cardRow, isLast && styles.lastCardRow]}
            >
              <Text style={styles.cardText}>{item.label}</Text>
              <Pressable style={styles.cta} onPress={item.action}>
                <Text style={styles.ctaText}>{idx === 0 ? '충전' : '구독'}</Text>
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
      <Image
        source={require('../../assets/images/petal.png')}
        style={styles.petal1}
      />
      <Image
        source={require('../../assets/images/petal.png')}
        style={styles.petal2}
      />
      <Image
        source={require('../../assets/images/petal.png')}
        style={styles.petal3}
      />
      <Image
        source={require('../../assets/images/petal.png')}
        style={styles.petal4}
      />

      {/* 로그아웃 모달 */}
      <ConfirmModal
        visible={logoutVisible}
        title="로그아웃하시겠습니까?🥲"
        message="다시 로그인 할 때까지 기다릴게요!"
        confirmText="로그아웃하기"
        onCancel={() => setLogoutVisible(false)}
        onConfirm={() => {
          setLogoutVisible(false);
          console.log('✅ 로그아웃 처리 TODO');
        }}
      />

      {/* 탈퇴 모달 */}
      <ConfirmModal
        visible={deleteVisible}
        title="탈퇴하시겠습니까?😭"
        message="탈퇴할 시 보유 재화 및 구독은 사라져요"
        confirmText="탈퇴하기"
        onCancel={() => setDeleteVisible(false)}
        onConfirm={() => {
          setDeleteVisible(false);
          console.log('✅ 탈퇴 처리 TODO');
        }}
      />
    </ScrollView>
  );
}
