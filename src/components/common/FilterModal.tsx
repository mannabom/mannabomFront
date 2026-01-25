import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';

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

const PINK = '#FF6B6B';
const BORDER = '#E9ECEF';

const MIN_AGE = 20;
const MAX_AGE = 35;
const DEFAULT_MIN = 20;
const DEFAULT_MAX = 29;

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const { height: SCREEN_H } = Dimensions.get('window');

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters,
}) => {
  const [ageRange, setAgeRange] = useState(
    initialFilters?.ageRange || defaultFilterSettings.ageRange,
  );
  const [selectedSmoking, setSelectedSmoking] = useState<SmokingHabit[]>(
    initialFilters?.smoking || defaultFilterSettings.smoking,
  );
  const [selectedDrinking, setSelectedDrinking] = useState<DrinkingHabit[]>(
    initialFilters?.drinking || defaultFilterSettings.drinking,
  );

  // ✅ 모달 다시 열 때 초기값 동기화
  useEffect(() => {
    if (!visible) return;
    setAgeRange(initialFilters?.ageRange || defaultFilterSettings.ageRange);
    setSelectedSmoking(initialFilters?.smoking || defaultFilterSettings.smoking);
    setSelectedDrinking(initialFilters?.drinking || defaultFilterSettings.drinking);
  }, [visible, initialFilters]);

  // ✅ 흡연 최소 1개 유지
  const toggleSmokingHabit = (habit: SmokingHabit) => {
    setSelectedSmoking(prev => {
      if (prev.includes(habit)) {
        return prev.length > 1 ? prev.filter(h => h !== habit) : prev;
      }
      return [...prev, habit];
    });
  };

  // ✅ 음주 최소 1개 유지
  const toggleDrinkingHabit = (habit: DrinkingHabit) => {
    setSelectedDrinking(prev => {
      if (prev.includes(habit)) {
        return prev.length > 1 ? prev.filter(h => h !== habit) : prev;
      }
      return [...prev, habit];
    });
  };

  const setDefaultAge = () => setAgeRange({ min: DEFAULT_MIN, max: DEFAULT_MAX });

  // =========================
  // ✅ 나이 Range Slider (한 줄 + 투 핸들)
  // =========================
  const trackWidthRef = useRef(0);
  const [trackWidth, setTrackWidth] = useState(0);

  const THUMB = 22; // 손잡이(버튼) 크기
  const usable = Math.max(1, trackWidth - THUMB);

  const valueToX = (v: number) => {
    const ratio = (v - MIN_AGE) / (MAX_AGE - MIN_AGE);
    return ratio * usable;
  };

  const xToValue = (x: number) => {
    const ratio = clamp(x / usable, 0, 1);
    const raw = MIN_AGE + ratio * (MAX_AGE - MIN_AGE);
    return Math.round(raw); // step=1
  };

  const minX = useMemo(() => valueToX(ageRange.min), [ageRange.min, trackWidth]);
  const maxX = useMemo(() => valueToX(ageRange.max), [ageRange.max, trackWidth]);

  const minStartRef = useRef(ageRange.min);
  const maxStartRef = useRef(ageRange.max);

  const onTrackLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    trackWidthRef.current = w;
    setTrackWidth(w);
  };

  const minPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        minStartRef.current = ageRange.min;
      },
      onPanResponderMove: (_, g) => {
        if (!trackWidthRef.current) return;

        const startX = valueToX(minStartRef.current);
        const nextX = clamp(startX + g.dx, 0, maxX); // ✅ 오른쪽(최대) 넘어가면 안 됨
        const nextMin = clamp(xToValue(nextX), MIN_AGE, ageRange.max);

        setAgeRange(prev => ({ ...prev, min: nextMin }));
      },
    }),
  ).current;

  const maxPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        maxStartRef.current = ageRange.max;
      },
      onPanResponderMove: (_, g) => {
        if (!trackWidthRef.current) return;

        const startX = valueToX(maxStartRef.current);
        const nextX = clamp(startX + g.dx, minX, usable); // ✅ 왼쪽(최소) 넘어가면 안 됨
        const nextMax = clamp(xToValue(nextX), ageRange.min, MAX_AGE);

        setAgeRange(prev => ({ ...prev, max: nextMax }));
      },
    }),
  ).current;

  const handleApply = () => {
    // 혹시라도 빈 배열이면 막기(안전벨트)
    if (!selectedSmoking.length || !selectedDrinking.length) return;

    onApply({
      ageRange,
      smoking: selectedSmoking,
      drinking: selectedDrinking,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.card, { height: SCREEN_H * 0.35 }]} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>조건 설정</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* ✅ 나이대: 한 줄 + 기본값 버튼 */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>나이대</Text>
              <Text style={styles.sectionValue}>
                {ageRange.min} - {ageRange.max}
              </Text>

              <TouchableOpacity style={styles.defaultBtn} onPress={setDefaultAge} activeOpacity={0.85}>
                <Text style={styles.defaultBtnText}>기본값 설정</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.rangeWrap} onLayout={onTrackLayout}>
              <View style={styles.track} />
              {/* 선택된 구간 */}
              {trackWidth > 0 && (
                <View
                  style={[
                    styles.selectedTrack,
                    {
                      left: minX + THUMB / 2,
                      width: Math.max(0, (maxX - minX)),
                    },
                  ]}
                />
              )}

              {/* 최소 핸들 */}
              <View
                style={[
                  styles.thumb,
                  { left: minX },
                ]}
                {...minPan.panHandlers}
              />

              {/* 최대 핸들 */}
              <View
                style={[
                  styles.thumb,
                  { left: maxX },
                ]}
                {...maxPan.panHandlers}
              />
            </View>

            <View style={styles.ageTicks}>
              <Text style={styles.tickText}>{MIN_AGE}</Text>
              <Text style={styles.tickText}>{Math.round((MIN_AGE + MAX_AGE) / 2)}</Text>
              <Text style={styles.tickText}>{MAX_AGE}</Text>
            </View>

            {/* ✅ 흡연 */}
            <Text style={styles.blockTitle}>흡연</Text>
            <View style={styles.buttonGroup}>
              {allSmokingHabits.map(habit => {
                const active = selectedSmoking.includes(habit);
                return (
                  <TouchableOpacity
                    key={habit}
                    style={[styles.pill, active && styles.pillActive]}
                    onPress={() => toggleSmokingHabit(habit)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>
                      {smokingHabitLabels[habit]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ✅ 음주 */}
            <Text style={[styles.blockTitle, { marginTop: 12 }]}>음주</Text>
            <View style={styles.buttonGroup}>
              {allDrinkingHabits.map(habit => {
                const active = selectedDrinking.includes(habit);
                return (
                  <TouchableOpacity
                    key={habit}
                    style={[styles.pill, active && styles.pillActive]}
                    onPress={() => toggleDrinkingHabit(habit)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>
                      {drinkingHabitLabels[habit]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleApply} activeOpacity={0.9}>
              <Text style={styles.saveText}>저장</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
  },
  header: {
    height: 52,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 16, fontWeight: '900', color: '#111' },
  close: { fontSize: 16, color: '#111' },

  content: { padding: 16 },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: '#111' },
  sectionValue: { marginLeft: 10, fontSize: 13, fontWeight: '800', color: '#444' },

  defaultBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#F8F9FA',
  },
  defaultBtnText: { fontSize: 12, fontWeight: '800', color: '#111' },

  rangeWrap: {
    marginTop: 14,
    height: 34,
    justifyContent: 'center',
  },
  track: {
    height: 10,
    borderRadius: 8,
    backgroundColor: '#EAEAEA',
  },
  selectedTrack: {
    position: 'absolute',
    height: 10,
    borderRadius: 8,
    backgroundColor: PINK,
    top: 12,
  },

  thumb: {
    position: 'absolute',
    top: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: PINK,
    elevation: 2,
  },

  ageTicks: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tickText: { fontSize: 11, color: '#666', fontWeight: '700' },

  blockTitle: { marginTop: 14, fontSize: 14, fontWeight: '900', color: '#111' },

  buttonGroup: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#F8F9FA',
    marginRight: 8,
    marginBottom: 8,
  },
  pillActive: {
    backgroundColor: '#FFE8F1',
    borderColor: PINK,
  },
  pillText: { fontSize: 12, fontWeight: '700', color: '#666' },
  pillTextActive: { color: PINK, fontWeight: '900' },

  footer: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  saveBtn: {
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PINK,
  },
  saveText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
});

export default FilterModal;
