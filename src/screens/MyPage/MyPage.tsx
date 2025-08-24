import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { styles } from './MyPage.styles';
// SVG는 나중에 쓸 수 있도록 주석 처리해둠
// import Bench from '../../../assets/images/bench.svg';
// import Petal from '../../../assets/images/petal.svg';

export default function MyPage() {
  const coins = 0;
  const isSubscribed = true;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 80 }}
    >
      <View style={styles.profileRow}>
        <View style={styles.avatar} />
        <Text style={styles.nickname}>닉네임</Text>
      </View>

      <View style={styles.cardRow}>
        <Text style={styles.cardText}>보유 팅 : {coins}개</Text>
        <Pressable style={styles.cta}>
          <Text style={styles.ctaText}>충전</Text>
        </Pressable>
        {/* <Bench width={60} height={60} style={styles.bench} /> */}
      </View>

      <View style={styles.cardRow}>
        <Text style={styles.cardText}>
          구독 : {isSubscribed ? '구독중' : '미구독'}
        </Text>
        {!isSubscribed && (
          <Pressable style={styles.cta}>
            <Text style={styles.ctaText}>구독</Text>
          </Pressable>
        )}
      </View>

      {[
        '1. 프로필 수정',
        '2. 스토어',
        '3. 고객센터',
        '4. 앱정보',
        '5. 로그아웃',
        '6. 탈퇴',
      ].map((label, idx) => (
        <View key={idx} style={styles.menuItem}>
          <Text style={styles.menuText}>{label}</Text>
        </View>
      ))}

      {/* <Petal width={32} height={32} style={styles.petal1} />
      <Petal width={32} height={32} style={styles.petal2} />
      <Petal width={32} height={32} style={styles.petal3} />
      <Petal width={32} height={32} style={styles.petal4} /> */}
    </ScrollView>
  );
}
