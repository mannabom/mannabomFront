// src/components/common/FilterModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import {
  SmokingHabit,
  DrinkingHabit,
  FilterSettings,
} from '../../types/DatingAPI';
import {
  smokingHabitLabels,
  drinkingHabitLabels,
  allSmokingHabits,
  allDrinkingHabits,
  defaultFilterSettings,
} from '../../utils/DatingUtils';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterSettings) => void;
  initialFilters?: FilterSettings;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters,
}) => {
  // 기본값 설정 (API enum에 맞춰 수정)
  const [ageRange, setAgeRange] = useState(
    initialFilters?.ageRange || defaultFilterSettings.ageRange,
  );
  const [selectedSmoking, setSelectedSmoking] = useState<SmokingHabit[]>(
    initialFilters?.smoking || defaultFilterSettings.smoking,
  );
  const [selectedDrinking, setSelectedDrinking] = useState<DrinkingHabit[]>(
    initialFilters?.drinking || defaultFilterSettings.drinking,
  );

  // 나이 범위 업데이트
  const handleAgeRangeChange = (value: number, type: 'min' | 'max') => {
    const newValue = Math.round(value);
    setAgeRange(prev => {
      if (type === 'min') {
        return { ...prev, min: Math.min(newValue, prev.max) };
      } else {
        return { ...prev, max: Math.max(newValue, prev.min) };
      }
    });
  };

  // 흡연 습관 토글
  const toggleSmokingHabit = (habit: SmokingHabit) => {
    setSelectedSmoking(prev => {
      if (prev.includes(habit)) {
        // 선택 해제 (단, 최소 1개는 남겨둬야 함)
        return prev.length > 1 ? prev.filter(h => h !== habit) : prev;
      } else {
        // 선택 추가
        return [...prev, habit];
      }
    });
  };

  // 음주 습관 토글
  const toggleDrinkingHabit = (habit: DrinkingHabit) => {
    setSelectedDrinking(prev => {
      if (prev.includes(habit)) {
        // 선택 해제 (단, 최소 1개는 남겨둬야 함)
        return prev.length > 1 ? prev.filter(h => h !== habit) : prev;
      } else {
        // 선택 추가
        return [...prev, habit];
      }
    });
  };

  // 흡연 전체 선택/해제
  const toggleAllSmoking = () => {
    if (selectedSmoking.length === allSmokingHabits.length) {
      // 전체 선택된 상태 -> 첫 번째 하나만 남기기
      setSelectedSmoking([allSmokingHabits[0]]);
    } else {
      // 일부만 선택된 상태 -> 전체 선택
      setSelectedSmoking([...allSmokingHabits]);
    }
  };

  // 음주 전체 선택/해제
  const toggleAllDrinking = () => {
    if (selectedDrinking.length === allDrinkingHabits.length) {
      // 전체 선택된 상태 -> 첫 번째 하나만 남기기
      setSelectedDrinking([allDrinkingHabits[0]]);
    } else {
      // 일부만 선택된 상태 -> 전체 선택
      setSelectedDrinking([...allDrinkingHabits]);
    }
  };

  // 필터 적용
  const handleApply = () => {
    const filters: FilterSettings = {
      ageRange,
      smoking: selectedSmoking,
      drinking: selectedDrinking,
    };
    onApply(filters);
  };

  // 초기화
  const handleReset = () => {
    setAgeRange(defaultFilterSettings.ageRange);
    setSelectedSmoking(defaultFilterSettings.smoking);
    setSelectedDrinking(defaultFilterSettings.drinking);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>조건 설정</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetButton}>기본값</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* 나이대 설정 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>나이대</Text>
              <Text style={styles.sectionValue}>
                {ageRange.min}세 - {ageRange.max}세
              </Text>
            </View>

            {/* 나이 범위 슬라이더 */}
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>
                최소 나이: {ageRange.min}세
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={20}
                maximumValue={35}
                value={ageRange.min}
                onValueChange={value => handleAgeRangeChange(value, 'min')}
                minimumTrackTintColor="#FF6B6B"
                maximumTrackTintColor="#E0E0E0"
                thumbTintColor="#FF6B6B"
                step={1}
              />

              <Text style={styles.sliderLabel}>
                최대 나이: {ageRange.max}세
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={20}
                maximumValue={35}
                value={ageRange.max}
                onValueChange={value => handleAgeRangeChange(value, 'max')}
                minimumTrackTintColor="#FF6B6B"
                maximumTrackTintColor="#E0E0E0"
                thumbTintColor="#FF6B6B"
                step={1}
              />
            </View>
          </View>

          {/* 흡연 설정 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>흡연</Text>
              <TouchableOpacity onPress={toggleAllSmoking}>
                <Text style={styles.selectAllButton}>
                  {selectedSmoking.length === allSmokingHabits.length
                    ? '전체해제'
                    : '전체선택'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonGroup}>
              {allSmokingHabits.map(habit => (
                <TouchableOpacity
                  key={habit}
                  style={[
                    styles.optionButton,
                    selectedSmoking.includes(habit) &&
                      styles.optionButtonActive,
                  ]}
                  onPress={() => toggleSmokingHabit(habit)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      selectedSmoking.includes(habit) &&
                        styles.optionButtonTextActive,
                    ]}
                  >
                    {smokingHabitLabels[habit]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 음주 설정 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>음주</Text>
              <TouchableOpacity onPress={toggleAllDrinking}>
                <Text style={styles.selectAllButton}>
                  {selectedDrinking.length === allDrinkingHabits.length
                    ? '전체해제'
                    : '전체선택'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonGroup}>
              {allDrinkingHabits.map(habit => (
                <TouchableOpacity
                  key={habit}
                  style={[
                    styles.optionButton,
                    selectedDrinking.includes(habit) &&
                      styles.optionButtonActive,
                  ]}
                  onPress={() => toggleDrinkingHabit(habit)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      selectedDrinking.includes(habit) &&
                        styles.optionButtonTextActive,
                    ]}
                  >
                    {drinkingHabitLabels[habit]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* 저장 버튼 */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleApply}>
            <Text style={styles.saveButtonText}>저장</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  closeButton: {
    fontSize: 18,
    color: '#666666',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  resetButton: {
    fontSize: 12,
    color: '#FF6B6B',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  sectionValue: {
    fontSize: 14,
    color: '#666666',
  },
  selectAllButton: {
    fontSize: 12,
    color: '#FF6B6B',
    textDecorationLine: 'underline',
  },
  sliderContainer: {
    paddingHorizontal: 10,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#333333',
    marginTop: 10,
  },
  slider: {
    width: '100%',
    height: 30,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: 8,
  },
  optionButtonActive: {
    backgroundColor: '#FFE8F1',
    borderColor: '#FF6B6B',
  },
  optionButtonText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  optionButtonTextActive: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
  },
  saveButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FilterModal;
