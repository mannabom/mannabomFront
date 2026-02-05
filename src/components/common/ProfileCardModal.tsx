// src/components/common/ProfileCardModal.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Image,
  Platform,
  ToastAndroid,
  PanResponder,
} from 'react-native';

import { DrinkingHabit, FilterSettings, SmokingHabit } from '../../types/DatingAPI';
import { drinkingHabitLabels, smokingHabitLabels } from '../../utils/DatingUtils';

const BORDER = '#E9ECEF';
const PINK = '#FF6B9A';
const DARK = '#111';

const { width: W, height: H } = Dimensions.get('window');

const FREE_ICON = require('../../assets/images/freeprofile.png');
const PAID_ICON = require('../../assets/images/paidprofile.png');

type MatchProfileCard = {
  profileId: number;
  nickname: string;
  age: number;
  mbti?: string;
  smoking?: SmokingHabit;
  drinking?: DrinkingHabit;
  photoUris?: string[]; // remote uri들
};

export type ProfileCardModalProps = {
  visible: boolean;
  onClose: () => void;
  filterSettings: FilterSettings;

  // ✅ 결제/멤버십/재화 관련(BlindDateScreen에서 보내는 값들)
  isVip?: boolean;
  isSubscribed?: boolean;
  tingBalance?: number;
  coinBalance?: number;

  // ✅ 남은 횟수
  freeRemaining?: number; // 무료 남은 장 수
  paidRemaining?: number; // 유료(혜택권/추가구매) 남은 장 수

  // ✅ 데이터 주입(추천: 지금은 mock에서 만들어서 넣기)
  profiles?: MatchProfileCard[];

  // ✅ 행동 콜백
  onRateProfile?: (profileId: number, score: 1 | 2 | 3 | 4 | 5) => void | Promise<void>;
  onPressProfileDetail?: (profileId: number) => void; // "상세 프로필 보기"
  onNavigateToStore?: () => void;

  // 혹시 더 던지면 받기
} & Record<string, any>;

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const toast = (msg: string) => {
  if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
  else console.log('[Toast]', msg);
};

const ProfileCardModal: React.FC<ProfileCardModalProps> = props => {
  const {
    visible,
    onClose,
    profiles,
    freeRemaining = 0,
    paidRemaining = 0,
    onRateProfile,
    onPressProfileDetail,
  } = props;

  const totalRemaining = (freeRemaining ?? 0) + (paidRemaining ?? 0);

  const [index, setIndex] = useState(0);
  const [ratedMap, setRatedMap] = useState<Record<number, 1 | 2 | 3 | 4 | 5>>({});
  const [infoVisible, setInfoVisible] = useState(false);

  const current = useMemo(() => {
    if (!profiles || profiles.length === 0) return null;
    const safeIdx = clamp(index, 0, profiles.length - 1);
    return profiles[safeIdx];
  }, [profiles, index]);

  useEffect(() => {
    if (!visible) return;
    setIndex(0);
  }, [visible]);

  const canGoPrev = !!profiles && profiles.length > 0 && index > 0;
  const canGoNext = !!profiles && profiles.length > 0 && index < profiles.length - 1;

  const goPrev = () => {
    if (!canGoPrev) return;
    setIndex(i => i - 1);
  };

  const goNext = () => {
    if (!canGoNext) return;
    setIndex(i => i + 1);
  };

  // ✅ swipe
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12 && Math.abs(g.dy) < 18,
      onPanResponderRelease: (_, g) => {
        if (g.dx > 50) goPrev();
        if (g.dx < -50) goNext();
      },
    }),
  ).current;

  const handleRate = async (score: 1 | 2 | 3 | 4 | 5) => {
    if (!current) return;

    const already = ratedMap[current.profileId];
    if (already) {
      toast('별점은 한 번만 줄 수 있어요.');
      return;
    }

    setRatedMap(prev => ({ ...prev, [current.profileId]: score }));

    try {
      await onRateProfile?.(current.profileId, score);
    } catch (e) {
      console.warn('rate failed:', e);
    }

    if (score >= 4) {
      toast('높은 별점 리스트에 추가 되었습니다');
    } else {
      toast('별점이 저장되었습니다');
    }
  };

  const handlePressDetail = () => {
    if (!current) return;
    onClose();
    if (onPressProfileDetail) {
      onPressProfileDetail(current.profileId);
      return;
    }
    toast('상대 상세 프로필 화면 연결 전입니다.');
  };

const renderStars = () => {
    const already = current ? ratedMap[current.profileId] : undefined;

    return (
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map(n => {
          const active = already ? n <= already : false;
          const disabled = !!already;
          return (
            <TouchableOpacity
              key={n}
              onPress={() => handleRate(n as 1 | 2 | 3 | 4 | 5)}
              activeOpacity={0.85}
              disabled={disabled}
              style={[
                styles.starBtn,
                active && styles.starBtnActive,
                disabled && styles.starBtnDisabled,
              ]}
            >
              <Text style={[styles.starText, active && styles.starTextActive]}>
                ❤
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}} {...pan.panHandlers}>
          <View style={styles.header}>
            <Text style={styles.title}>오늘의 프로필</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 본문 */}
          <View style={styles.body}>
            {!profiles || profiles.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyTitle}>프로필 데이터가 아직 없어요</Text>
                <Text style={styles.emptyDesc}>
                  지금은 mock에서 profiles 배열을 만들어서 ProfileCardModal에 넘겨주면 화면부터 바로 확인 가능!
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.hintWrap}>
                  <TouchableOpacity style={styles.infoRow} onPress={() => setInfoVisible(v => !v)} activeOpacity={0.8}>
                    <Image source={FREE_ICON} style={styles.counterIcon} />
                    <Text style={styles.infoCount}>{freeRemaining}</Text>
                    <Image source={PAID_ICON} style={[styles.counterIcon, { marginLeft: 10 }]} />
                    <Text style={[styles.infoCount, { color: PINK }]}>{paidRemaining}</Text>
                  </TouchableOpacity>
                  {infoVisible && (
                    <View style={styles.tooltip}>
                      <View style={styles.tooltipHeader}>
                        <Text style={styles.tooltipTitle}>정보</Text>
                        <TouchableOpacity hitSlop={10} onPress={() => setInfoVisible(false)}>
                          <Text style={styles.tooltipClose}>✕</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.tooltipRow}>
                        <Image source={FREE_ICON} style={styles.tooltipIcon} />
                        <Text style={styles.tooltipText}>무료 프로필 잔여횟수</Text>
                      </View>
                      <View style={styles.tooltipRow}>
                        <Image source={PAID_ICON} style={styles.tooltipIcon} />
                        <Text style={styles.tooltipText}>유료 프로필 잔여횟수</Text>
                      </View>
                    </View>
                  )}
                  <Text style={styles.hintText}>상세 프로필에서 당신의 호감을 표시해주세요!</Text>
                </View>

                <View style={styles.profileCard}>
                  <View style={styles.photoRow}>
                    <TouchableOpacity
                      style={[styles.arrowBtn, !canGoPrev && styles.arrowDisabled]}
                      onPress={goPrev}
                      activeOpacity={0.75}
                      disabled={!canGoPrev}
                    >
                      <Text style={styles.arrowText}>‹</Text>
                    </TouchableOpacity>

                    <View style={styles.photoBox}>
                      {current?.photoUris?.[0] ? (
                        <Image source={{ uri: current.photoUris[0] }} style={styles.photo} />
                      ) : (
                        <View style={styles.photoPlaceholder}>
                          <Text style={styles.photoPlaceholderText}>사진</Text>
                        </View>
                      )}
                    </View>

                    <TouchableOpacity
                      style={[styles.arrowBtn, !canGoNext && styles.arrowDisabled]}
                      onPress={goNext}
                      activeOpacity={0.75}
                      disabled={!canGoNext}
                    >
                      <Text style={styles.arrowText}>›</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.nick}>{current?.nickname}</Text>

                  <View style={{ marginTop: 10 }}>{renderStars()}</View>
                </View>

                <TouchableOpacity style={styles.detailBtn} onPress={handlePressDetail} activeOpacity={0.9}>
                  <Text style={styles.detailBtnText}>프로필 보기</Text>
                </TouchableOpacity>

                <Text style={styles.pageIndicator}>
                  {index + 1} / {profiles.length}
                </Text>
              </>
            )}
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
    maxHeight: H * 0.82,
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
  title: { fontSize: 16, fontWeight: '900', color: DARK },
  close: { fontSize: 16, fontWeight: '900', color: DARK },

  body: { padding: 16 },

  emptyWrap: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#FFF',
  },
  emptyTitle: { fontSize: 14, fontWeight: '900', color: DARK, marginBottom: 6 },
  emptyDesc: { fontSize: 12, fontWeight: '700', color: '#666', lineHeight: 18 },

  profileCard: {
    borderWidth: 0,
    alignItems: 'center',
    gap: 10,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  arrowBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  arrowDisabled: { opacity: 0.35 },
  arrowText: { fontSize: 20, fontWeight: '900', color: DARK },

  photoBox: {
    width: 240,
    height: 240,
    backgroundColor: '#F6F6F6',
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: { width: '100%', height: '100%', resizeMode: 'cover' },
  photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  photoPlaceholderText: { fontSize: 14, fontWeight: '900', color: '#999' },

  nick: { fontSize: 18, fontWeight: '900', color: DARK, textAlign: 'center', marginTop: 4 },

  starRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  starBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starBtnActive: { backgroundColor: '#FFE8F1', borderColor: PINK },
  starBtnDisabled: { opacity: 0.7 },
  starText: { fontSize: 16, fontWeight: '900', color: '#BBB' },
  starTextActive: { color: PINK },

  detailBtn: {
    marginTop: 12,
    height: 44,
    borderRadius: 22,
    backgroundColor: PINK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900' },

  hintWrap: { alignItems: 'center', marginBottom: 10 },
  hintText: { fontSize: 12, fontWeight: '800', color: '#555' },
  pageIndicator: { marginTop: 10, alignSelf: 'flex-end', fontSize: 12, fontWeight: '900', color: '#555' },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#FFF',
    alignSelf: 'flex-start',
    marginBottom: 6,
    gap: 4,
  },
  counterIcon: { width: 20, height: 20, resizeMode: 'contain' },
  infoCount: { fontSize: 12, fontWeight: '900', color: DARK },
  tooltip: {
    position: 'absolute',
    top: 34,
    left: 0,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: BORDER,
    width: 180,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tooltipTitle: { fontSize: 12, fontWeight: '900', color: DARK },
  tooltipClose: { fontSize: 12, fontWeight: '900', color: DARK },
  tooltipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  tooltipIcon: { width: 18, height: 18, resizeMode: 'contain' },
  tooltipText: { fontSize: 12, fontWeight: '800', color: DARK },
});

export default ProfileCardModal;
