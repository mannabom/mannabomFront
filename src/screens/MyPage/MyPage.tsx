import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Image } from 'react-native';
import { styles } from './MyPage.styles';
import ConfirmModal from '../../components/common/ConfirmModal';
import { mockUser } from '../../data/mockUser';
export default function MyPage() {
  const { profile, coins, isSubscribed } = mockUser;

  const [logoutVisible, setLogoutVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);

  return (
    <ScrollView style={styles.container}>
      {/* 프로필 + 닉네임 */}
      <View style={styles.profileRow}>
        <View style={styles.avatar}>
          <Image
            style={styles.avatarImage}
            source={{ uri: 'https://via.placeholder.com/100' }}
          />
        </View>
        <Text style={styles.nickname}>{profile.nickName}</Text>
      </View>

      {/* 보유 팅 + 구독 카드 */}
      <View style={styles.cardBox}>
        {[
          { label: `보유 팅 : ${coins}개`, action: null },
          {
            label: `구독 : ${isSubscribed ? '구독중' : '미구독'}`,
            action: null,
          },
        ].map((item, idx, arr) => {
          const isLast = idx === arr.length - 1;
          return (
            <View
              key={idx}
              style={[styles.cardRow, isLast && styles.lastCardRow]}
            >
              <Text style={styles.cardText}>{item.label}</Text>
              <Pressable style={styles.cta}>
                <Text style={styles.ctaText}>
                  {idx === 0 ? '충전' : '구독'}
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
          { label: '1. 프로필 수정' },
          { label: '2. 스토어' },
          { label: '3. 고객센터' },
          { label: '4. 앱정보' },
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
          console.log('로그아웃 처리');
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
          console.log('탈퇴 처리');
        }}
      />
    </ScrollView>
  );
}
