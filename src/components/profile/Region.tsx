import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Dropdown from '../common/Dropdown'; // 재사용 드롭다운 컴포넌트 import

// 시/도 데이터
const sidoOptions = ['서울특별시', '경기도', '인천광역시', '부산광역시'];

const gugunOptions: Record<string, string[]> = {
  서울특별시: ['광진구', '관악구', '중구', '서초구'],
  경기도: ['수원시', '성남시', '고양시'],
  인천광역시: ['남동구', '부평구', '연수구'],
  부산광역시: ['해운대구', '부산진구', '남구'],
};

export default function Region() {
  const [sido, setSido] = useState<string | null>(null);
  const [gugun, setGugun] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      {/* 타이틀 */}
      <Text style={styles.title}>지역</Text>

      <View style={styles.row}>
        {/* 시/도 드롭다운 */}
        <Dropdown
          options={sidoOptions}
          placeholder="시/도"
          value={sido}
          onSelect={val => {
            setSido(val);
            setGugun(null);
          }}
        />

        {/* 구/군 드롭다운 */}
        <Dropdown
          options={sido ? gugunOptions[sido] : []}
          placeholder="구/군"
          value={gugun}
          onSelect={setGugun}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontFamily: 'ABeeZee',
    fontWeight: '400',
    fontStyle: 'normal',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.43,
    marginBottom: 12,
    color: '#102A43',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
});
