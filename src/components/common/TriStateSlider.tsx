import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  LayoutChangeEvent,
  PanResponder,
  Animated,
  I18nManager,
  Pressable,
  ViewStyle,
  TextStyle,
} from 'react-native';

type Value = 0 | 1 | 2;

interface Props {
  title?: string;
  labels: [string, string, string];
  value?: Value;
  defaultValue?: Value;
  onValueChange?: (v: Value) => void;

  onSlidingComplete?: (v: Value) => void;

  style?: ViewStyle;
  titleStyle?: TextStyle;
  labelStyle?: TextStyle;

  disabled?: boolean;

  trackColor?: string; // 기본 트랙 색
  trackBackgroundColor?: string; // 트랙 배경(회색 바)
  thumbColor?: string; // 손잡이
  tickColor?: string; // 눈금
}

const TriStateSlider: React.FC<Props> = ({
  title,
  labels,
  value,
  defaultValue = 0,
  onValueChange,
  onSlidingComplete,
  style,
  titleStyle,
  labelStyle,
  disabled = false,
  trackColor = '#222',
  trackBackgroundColor = '#E6E6E6',
  thumbColor = '#FFF',
  tickColor = '#222',
}) => {
  const isRTL = I18nManager.isRTL;
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const trackPadding = 12;
  const usableWidth = Math.max(0, measuredWidth - trackPadding * 2);

  // 내부 상태
  const [internal, setInternal] = useState<Value>(value ?? defaultValue);
  const currentValue: Value = (value ?? internal) as Value;

  // 애니메이션 값
  const initialNorm = currentValue / 2; // 0, 0.5, 1
  const pos = useRef(new Animated.Value(initialNorm)).current;

  // 현재 norm 값 추적용 ref
  const currentNorm = useRef(initialNorm);

  // 외부 value 변경 시 위치 반영
  React.useEffect(() => {
    if (value == null) return;
    Animated.timing(pos, {
      toValue: value / 2,
      duration: 120,
      useNativeDriver: false,
    }).start();
    currentNorm.current = value / 2;
  }, [value]);

  const clamp = (x: number) => Math.max(0, Math.min(1, x));

  const snapToNearest = (norm: number): Value => {
    const candidates: [Value, number][] = [
      [0, Math.abs(norm - 0)],
      [1, Math.abs(norm - 0.5)],
      [2, Math.abs(norm - 1)],
    ];
    candidates.sort((a, b) => a[1] - b[1]);
    return candidates[0][0];
  };

  const toX = (norm: number) => {
    const base = norm * usableWidth;
    const adjusted = isRTL ? usableWidth - base : base;
    return adjusted + trackPadding;
  };

  const trackLeft = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: () => {},
      onPanResponderMove: (_, gesture) => {
        if (disabled || usableWidth === 0) return;
        const localX = clamp(
          (gesture.moveX - trackLeft.current - trackPadding) / usableWidth,
        );
        const norm = isRTL ? 1 - localX : localX;
        pos.setValue(norm);
        currentNorm.current = norm;
        const v = snapToNearest(norm);
        onValueChange?.(v);
      },
      onPanResponderRelease: () => {
        const v = snapToNearest(currentNorm.current);
        Animated.spring(pos, {
          toValue: v / 2,
          useNativeDriver: false,
          bounciness: 6,
        }).start();
        if (value == null) setInternal(v);
        onSlidingComplete?.(v);
      },
    }),
  ).current;

  const onTrackLayout = (e: LayoutChangeEvent) => {
    const { width, x } = e.nativeEvent.layout;
    setMeasuredWidth(width);
    trackLeft.current = x;
  };

  // 트랙 탭 → 스냅
  const handleTrackPress = (e: any) => {
    if (disabled || usableWidth === 0) return;
    const tapX = e.nativeEvent.locationX;
    const norm = clamp((tapX - trackPadding) / usableWidth);
    const finalNorm = isRTL ? 1 - norm : norm;
    const v = snapToNearest(finalNorm);
    Animated.spring(pos, {
      toValue: v / 2,
      useNativeDriver: false,
      bounciness: 6,
    }).start();
    currentNorm.current = v / 2;
    if (value == null) setInternal(v);
    onValueChange?.(v);
    onSlidingComplete?.(v);
  };

  const thumbTranslateX = pos.interpolate({
    inputRange: [0, 1],
    outputRange: [toX(0) - 12, toX(1) - 12],
  });

  return (
    <View style={[styles.root, style]}>
      {title ? <Text style={[styles.title, titleStyle]}>{title}</Text> : null}

      <View style={styles.labelsRow}>
        <Text style={[styles.label, labelStyle]}>{labels[0]}</Text>
        <Text style={[styles.label, labelStyle]}>{labels[1]}</Text>
        <Text style={[styles.label, labelStyle]}>{labels[2]}</Text>
      </View>

      <Pressable
        onLayout={onTrackLayout}
        onPress={handleTrackPress}
        disabled={disabled}
      >
        <View
          style={[styles.trackBg, { backgroundColor: trackBackgroundColor }]}
        >
          <View style={[styles.trackLine, { backgroundColor: trackColor }]} />
          <View
            pointerEvents="none"
            style={[
              styles.tick,
              { backgroundColor: tickColor, left: toX(0.5) - 1 },
            ]}
          />
          <View
            pointerEvents="none"
            style={[
              styles.endTick,
              { backgroundColor: tickColor, left: toX(1) - 1 },
            ]}
          />
          <Animated.View
            style={[
              styles.thumb,
              {
                backgroundColor: thumbColor,
                transform: [{ translateX: thumbTranslateX }],
              },
              disabled && { opacity: 0.6 },
            ]}
            {...panResponder.panHandlers}
          />
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    width: '100%',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#102A43',
    marginBottom: 8,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontFamily: 'ABeeZee',
    fontWeight: '400',
    fontStyle: 'normal',
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: -0.23,
    color: '#111',
  },
  trackBg: {
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  trackLine: {
    height: 2,
    marginHorizontal: 12,
    borderRadius: 1,
  },
  tick: {
    position: 'absolute',
    width: 2,
    height: 10,
    top: 9,
    borderRadius: 1,
  },
  endTick: {
    position: 'absolute',
    width: 2,
    height: 14,
    top: 7,
    borderRadius: 1,
  },
  thumb: {
    position: 'absolute',
    top: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#CCC',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 1.5,
  },
});

export default TriStateSlider;
