import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import Dropdown from '../common/Dropdown';

const bodyTypes = ['마름', '보통', '통통'];

export default function Physical() {
  const [height, setHeight] = useState('');
  const [bodyType, setBodyType] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      {/* 타이틀 */}
      <Text style={styles.title}>신체 프로필</Text>

      <View style={styles.row}>
        {/* 키 입력 */}
        <View style={styles.inputBox}>
          <TextInput
            style={styles.input}
            placeholder="키"
            placeholderTextColor="#ABABAB"
            keyboardType="numeric"
            value={height}
            onChangeText={setHeight}
          />
          <Text style={styles.unit}>cm</Text>
        </View>

        {/* 체형 드롭다운 */}
        <Dropdown
          options={bodyTypes}
          placeholder="체형"
          value={bodyType}
          onSelect={setBodyType}
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
  inputBox: {
    width: 125,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#AFB1B6',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    height: 36,
    fontFamily: 'Work Sans',
    fontSize: 12,
    letterSpacing: 0.6,
    color: '#000',
  },
  unit: {
    fontFamily: 'Work Sans',
    fontWeight: '500',
    fontSize: 12,
    letterSpacing: 0.6,
    color: '#ABABAB',
    marginLeft: 4,
  },
});
