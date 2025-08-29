import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import Svg, { Text as SvgText } from 'react-native-svg';

const mbtiGrid = [
  ['E', 'S', 'F', 'J'],
  ['I', 'N', 'T', 'P'],
];

export default function MBTI() {
  const [selected, setSelected] = useState<Record<string, string | null>>({
    EI: null,
    SN: null,
    FT: null,
    JP: null,
  });

  const handleSelect = (groupId: string, value: string) => {
    setSelected(prev => ({
      ...prev,
      [groupId]: value,
    }));
  };

  const findGroup = (opt: string) => {
    if (['E', 'I'].includes(opt)) return 'EI';
    if (['S', 'N'].includes(opt)) return 'SN';
    if (['F', 'T'].includes(opt)) return 'FT';
    return 'JP';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MBTI (필수)</Text>

      {mbtiGrid.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {row.map(opt => {
            const groupId = findGroup(opt);
            const isSelected = selected[groupId] === opt;

            return (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.circle,
                  isSelected ? styles.circleSelected : styles.circleDefault,
                ]}
                onPress={() => handleSelect(groupId, opt)}
              >
                <Svg height="40" width="40">
                  <SvgText
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    fontSize="26"
                    fontFamily="ABeeZee"
                    fill="#FFFFFF"
                    stroke="#0000001A"
                    strokeWidth={1}
                  >
                    {opt}
                  </SvgText>
                </Svg>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  title: {
    fontFamily: 'ABeeZee',
    fontWeight: '400',
    fontStyle: 'normal',
    fontSize: 20,
    lineHeight: 22,
    letterSpacing: -0.43,
    marginBottom: 12,
    color: '#102A43',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 15,
    borderWidth: 1,
    borderColor: '#00000040',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 2,
    elevation: 2,
  },
  circleDefault: {
    backgroundColor: '#FFB6C1',
  },
  circleSelected: {
    backgroundColor: '#F08080',
  },
});
