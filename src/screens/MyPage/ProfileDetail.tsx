// src/screens/mypage/ProfileDetail.tsx (경로는 프로젝트에 맞게)

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { styles } from './ProfileDetail.styles';
import apiClient from '../../services/apiClient';
import { API_ENDPOINTS_LIST } from '../../config/api';

type ServerProfile = {
  nickName?: string;
  birthDate?: string;
  mbti?: string;
  university?: string;
  regionSido?: string;
  regionSigungu?: string;
  height?: number;
  profileImageUrl?: string;
};

export default function ProfileDetail() {
  const [benchTop, setBenchTop] = useState(400);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ServerProfile | null>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    if (y > 200) setBenchTop(250);
    else setBenchTop(400 - y);
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(API_ENDPOINTS_LIST.USER_PROFILE);
      console.log('🧾 [ProfileDetail] USER_PROFILE raw response:', res.data);

      const data: any = res.data?.data ?? res.data;

      setProfile({
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
      });
    } catch (e: any) {
      console.error('❌ [ProfileDetail] load error:', e?.response?.data || e?.message || e);
      Alert.alert('오류', '프로필 불러오기 실패', [{ text: '다시 시도', onPress: loadProfile }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>불러오는 중...</Text>
      </View>
    );
  }

  const birthYear = profile?.birthDate ? parseInt(profile.birthDate.split('-')[0], 10) : undefined;
  const age = birthYear ? new Date().getFullYear() - birthYear : undefined;

  return (
    <View style={styles.container}>
      <View style={styles.titleBar}>
        <Text style={styles.title}>프로필</Text>
      </View>

      {/* 벤치 배경 (고정) */}
      <Image
        source={require('../../assets/images/bench.png')}
        style={[styles.benchBackground, { top: benchTop }]}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* 프로필 사진 */}
        <View style={styles.profileImageWrapper}>
          <Image
            source={{
              uri:
                profile?.profileImageUrl ||
                'https://via.placeholder.com/600x330',
            }}
            style={styles.profileImage}
          />
        </View>

        {/* 기본 정보 */}
        <View style={styles.infoSection}>
          <Text style={styles.nickName}>
            {profile?.nickName ?? '닉네임'}{age ? `(${age})` : ''}{' '}
            {profile?.mbti ? `, ${profile.mbti}` : ''}
          </Text>

          <Text style={styles.subInfo}>{profile?.university ?? ''}</Text>

          <View style={styles.infoRow}>
            <Text style={styles.subInfo}>
              {(profile?.regionSido ?? '') + ' ' + (profile?.regionSigungu ?? '')}
            </Text>
            <Text style={styles.rightInfo}>
              {profile?.height ? `키 ${profile.height}cm` : ''}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.subInfo}>흡연/체형/음주 등은 서버 필드 붙이면 표시</Text>
            <Text style={styles.reportInfo}>신고 횟수: 0</Text>
          </View>
        </View>

        {/* 이하 자기소개/문항 답변은 서버 API 붙이는 순간 실제 값으로 교체하면 됨 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>자기소개</Text>
          <Text style={styles.sectionText}>서버에서 자기소개 가져오면 여기에 표시</Text>
        </View>
      </ScrollView>
    </View>
  );
}
