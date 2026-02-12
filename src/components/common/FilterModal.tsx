// src/components/common/FilterModal.tsx
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
const BORDER = '#E5E7EB';

const MIN_AGE = 20;
const MAX_AGE = 29;
const STEP_COUNT = 9; // 20~29 사이 9칸
const STEP_SIZE = (MAX_AGE - MIN_AGE) / STEP_COUNT; // 1
const DEFAULT_MIN = 20;
const DEFAULT_MAX = 29;
const AGE_VALUES = Array.from(
  { length: MAX_AGE - MIN_AGE + 1 },
  (_, i) => MIN_AGE + i,
);

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const { height: SCREEN_H } = Dimensions.get('window');

const ensureAtLeastOne = <T,>(arr: T[], fallback: T) => (arr && arr.length ? arr : [fallback]);
const snapToAgeStep = (v: number) => {
  const stepped = Math.round((v - MIN_AGE) / STEP_SIZE);
  return clamp(MIN_AGE + stepped * STEP_SIZE, MIN_AGE, MAX_AGE);
};

const sanitizeAgeRange = (range: { min: number; max: number }) => {
  const min = Math.round(snapToAgeStep(range.min));
  const max = Math.round(snapToAgeStep(range.max));
  return {
    min: Math.min(min, max),
    max: Math.max(min, max),
  };
};

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters,
}) => {
  const [ageRange, setAgeRange] = useState(
    sanitizeAgeRange(initialFilters?.ageRange || defaultFilterSettings.ageRange),
  );

  const [selectedSmoking, setSelectedSmoking] = useState<SmokingHabit[]>(
    ensureAtLeastOne(
      initialFilters?.smoking || defaultFilterSettings.smoking,
      allSmokingHabits[0],
    ),
  );

  const [selectedDrinking, setSelectedDrinking] = useState<DrinkingHabit[]>(
    ensureAtLeastOne(
      initialFilters?.drinking || defaultFilterSettings.drinking,
      allDrinkingHabits[0],
    ),
  );

  // ✅ 모달 열 때 초기값 동기화
  useEffect(() => {
    if (!visible) return;
    setAgeRange(sanitizeAgeRange(initialFilters?.ageRange || defaultFilterSettings.ageRange));

    setSelectedSmoking(
      ensureAtLeastOne(
        initialFilters?.smoking || defaultFilterSettings.smoking,
        allSmokingHabits[0],
      ),
    );

    setSelectedDrinking(
      ensureAtLeastOne(
        initialFilters?.drinking || defaultFilterSettings.drinking,
        allDrinkingHabits[0],
      ),
    );
  }, [visible, initialFilters]);

  // ✅ 흡연 최소 1개 유지 + 다중 선택 가능
  const toggleSmokingHabit = (habit: SmokingHabit) => {
    setSelectedSmoking(prev => {
      if (prev.includes(habit)) {
        return prev.length > 1 ? prev.filter(h => h !== habit) : prev;
      }
      return [...prev, habit];
    });
  };

  // ✅ 음주 최소 1개 유지 + 다중 선택 가능
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
  // ✅ 나이 Range Slider (투 핸들, 서로 못 넘음)
  // =========================
  const trackWidthRef = useRef(0);
  const [trackWidth, setTrackWidth] = useState(0);
  const ageRangeRef = useRef(ageRange);

  const THUMB = 18; // 스샷 느낌으로 살짝 작게
  const usable = Math.max(1, trackWidth - THUMB);

  const snapValue = (v: number) => Math.round(snapToAgeStep(v));

  const valueToX = (v: number) => {
    const ratio = (v - MIN_AGE) / (MAX_AGE - MIN_AGE);
    return ratio * usable;
  };

  const xToValue = (x: number) => {
    const ratio = clamp(x / usable, 0, 1);
    return MIN_AGE + ratio * (MAX_AGE - MIN_AGE); // 실시간은 부드럽게, 스냅은 release에서
  };

  const minX = useMemo(() => valueToX(ageRange.min), [ageRange.min, trackWidth]);
  const maxX = useMemo(() => valueToX(ageRange.max), [ageRange.max, trackWidth]);

  const minStartRef = useRef(ageRange.min);
  const maxStartRef = useRef(ageRange.max);

  useEffect(() => {
    ageRangeRef.current = ageRange;
  }, [ageRange]);

  const onTrackLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    trackWidthRef.current = w;
    setTrackWidth(w);
  };

  const minPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: () => {
        minStartRef.current = ageRangeRef.current.min;
      },
      onPanResponderMove: (_, g) => {
        if (!trackWidthRef.current) return;

        const usableWidth = Math.max(1, trackWidthRef.current - THUMB);
        const stepPxNow = usableWidth / STEP_COUNT;
        const stepDelta = Math.round(g.dx / Math.max(1, stepPxNow));
        const currentMax = ageRangeRef.current.max;
        const nextMin = clamp(snapValue(minStartRef.current + stepDelta), MIN_AGE, currentMax);

        setAgeRange(prev => ({ ...prev, min: nextMin }));
      },
      onPanResponderRelease: () => {
        const snapped = snapValue(ageRangeRef.current.min);
        setAgeRange(prev => ({ ...prev, min: Math.min(snapped, prev.max) }));
      },
    }),
  ).current;

  const maxPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: () => {
        maxStartRef.current = ageRangeRef.current.max;
      },
      onPanResponderMove: (_, g) => {
        if (!trackWidthRef.current) return;

        const usableWidth = Math.max(1, trackWidthRef.current - THUMB);
        const stepPxNow = usableWidth / STEP_COUNT;
        const stepDelta = Math.round(g.dx / Math.max(1, stepPxNow));
        const currentMin = ageRangeRef.current.min;
        const nextMax = clamp(snapValue(maxStartRef.current + stepDelta), currentMin, MAX_AGE);

        setAgeRange(prev => ({ ...prev, max: nextMax }));
      },
      onPanResponderRelease: () => {
        const snapped = snapValue(ageRangeRef.current.max);
        setAgeRange(prev => ({ ...prev, max: Math.max(snapped, prev.min) }));
      },
    }),
  ).current;

  const handleApply = () => {
    // 안전벨트: 혹시라도 빈 배열이면 저장 막음
    if (!selectedSmoking.length || !selectedDrinking.length) return;

    onApply({
      ageRange: sanitizeAgeRange(ageRange),
      smoking: selectedSmoking,
      drinking: selectedDrinking,
    });
  };
  const onTapAge = (age: number) => {
    setAgeRange(prev => {
      const distToMin = Math.abs(age - prev.min);
      const distToMax = Math.abs(age - prev.max);

      if (distToMin <= distToMax) {
        return { min: clamp(age, MIN_AGE, prev.max), max: prev.max };
      }

      return { min: prev.min, max: clamp(age, prev.min, MAX_AGE) };
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.card, { height: SCREEN_H * 0.62 }]} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>조건 설정</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* 나이대 */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>나이대</Text>
              <TouchableOpacity style={styles.defaultBtn} onPress={setDefaultAge} activeOpacity={0.85}>
                <Text style={styles.defaultBtnText}>기본값 설정</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.rangeWrap} onLayout={onTrackLayout}>
              <View style={styles.track} />

              {trackWidth > 0 && (
                <View
                  style={[
                    styles.selectedTrack,
                    {
                      left: minX + THUMB / 2,
                      width: Math.max(0, maxX - minX),
                    },
                  ]}
                />
              )}

              <View style={[styles.thumb, { left: minX }]} {...minPan.panHandlers} />
              <View style={[styles.thumb, { left: maxX }]} {...maxPan.panHandlers} />
            </View>

            {/* tick 20~29 전체 표시 */}
            <View style={styles.ticks}>
              {AGE_VALUES.map(age => (
                <TouchableOpacity key={age} style={styles.tickItem} onPress={() => onTapAge(age)}>
                  <View style={styles.tickMark} />
                  <Text
                    style={[
                      styles.tickText,
                      age >= ageRange.min && age <= ageRange.max && styles.tickTextActive,
                    ]}
                  >
                    {age}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* 흡연 */}
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

            {/* 음주 */}
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
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  card: {
    width: '92%',
    maxWidth: 340,
    height: SCREEN_H * 0.78,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 18, fontWeight: '900', color: '#111' },
  close: { fontSize: 16, color: '#111' },

  content: { paddingHorizontal: 16, paddingBottom: 8 },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: '#111' },

  defaultBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#F8F9FA',
  },
  defaultBtnText: { fontSize: 12, fontWeight: '800', color: '#111' },

  rangeWrap: {
    marginTop: 12,
    height: 28,
    justifyContent: 'center',
  },
  track: { height: 6, borderRadius: 6, backgroundColor: '#E5E7EB' },
  selectedTrack: {
    position: 'absolute',
    height: 6,
    borderRadius: 6,
    backgroundColor: PINK,
    top: 11,
  },
  thumb: {
    position: 'absolute',
    top: 5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: PINK,
  },

  ticks: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tickItem: { alignItems: 'center', width: 24 },
  tickMark: {
    width: 1,
    height: 6,
    backgroundColor: '#C5CAD3',
    marginBottom: 3,
  },
  tickText: { fontSize: 11, fontWeight: '800', color: '#111' },
  tickTextActive: { color: PINK, fontWeight: '900' },
  blockTitle: { marginTop: 14, fontSize: 14, fontWeight: '900', color: '#111' },

  buttonGroup: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#FFFFFF',
    marginRight: 10,
    marginBottom: 10,
  },
  pillActive: {
    backgroundColor: '#FFE8F1',
    borderColor: PINK,
  },
  pillText: { fontSize: 12, fontWeight: '800', color: '#111' },
  pillTextActive: { color: '#111', fontWeight: '900' },

  footer: { padding: 14 },
  saveBtn: {
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFB3C7',
  },
  saveText: { color: '#111', fontSize: 14, fontWeight: '900' },
});

export default FilterModal;
