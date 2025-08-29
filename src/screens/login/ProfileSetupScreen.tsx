import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import Physical from '../../components/profile/Physical';
import Region from '../../components/profile/Region';
import MBTI from '../../components/profile/MBTI';
import TriStateSlider from '../../components/common/TriStateSlider'; // 아까 만든 흡연/음주 슬라이더

export default function ProfileSetupScreen({ navigation }: any) {
  const [smoking, setSmoking] = useState<number>(0); // 0: 비흡연, 1: 전자담배, 2: 일반담배
  const [drinking, setDrinking] = useState<number>(0); // 0: 안마심, 1: 가끔, 2: 자주

  const handleNext = () => {
    console.log({
      smoking,
      drinking,
    });
    navigation.navigate('NextScreen'); // 다음 스크린으로 이동
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* 신체 프로필 */}
      <View style={{ marginBottom: 100 }}>
        <Physical />
      </View>

      {/* 지역 */}
      <View style={{ marginBottom: 140 }}>
        <Region />
      </View>

      {/* MBTI */}
      <MBTI />

      {/* 흡연 */}
      <View>
        <Text style={styles.sectionTitle}>흡연</Text>
        <TriStateSlider
          labels={['비흡연', '전자 담배', '일반 담배']}
          value={smoking as any}
          onValueChange={setSmoking}
        />
      </View>

      {/* 음주 */}
      <View style={{ marginTop: 30 }}>
        <Text style={styles.sectionTitle}>음주</Text>
        <TriStateSlider
          labels={['안마심', '가끔 음주', '자주 음주']}
          value={drinking as any}
          onValueChange={setDrinking}
        />
      </View>

      {/* 다음 버튼 */}
      <View style={styles.nextBtnWrapper}>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>다음</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    fontFamily: 'ABeeZee',
    fontWeight: '400',
    fontStyle: 'normal',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.43,
    color: '#102A43',
    marginBottom: 3,
  },
  nextBtnWrapper: {
    marginTop: 32,
    alignItems: 'center',
  },
  nextBtn: {
    backgroundColor: '#FFB6C1',
    width: 125,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 1,
  },
  nextBtnText: {
    fontFamily: 'ABeeZee',
    fontWeight: '400',
    fontStyle: 'normal',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.23,
    textAlign: 'center',
    color: '#000',
  },
});
