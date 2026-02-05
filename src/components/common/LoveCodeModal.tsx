// src/components/common/LoveCodeModal.tsx
import React, { useMemo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Platform,
  ToastAndroid,
} from 'react-native';

const BORDER = '#E9ECEF';
const PINK = '#FF6B9A';

type OptionalAnswers = Record<string, string | undefined | null>;

type ChoiceItem = {
  question: string;
  left: string;
  right: string;
  selected: string;
};

export type LoveCodeModalProps = {
  visible: boolean;
  onClose: () => void;

  // 데이터
  nickname?: string;
  intro?: string; // 자기소개(필수)
  want?: string; // 필수 주관식
  charm?: string; // 필수 주관식
  optionalAnswers?: OptionalAnswers; // 선택 주관식(빈 값은 미표시)
  choices?: ChoiceItem[]; // 밸런스 질문(있으면 표시)

  // 행동
  onPressProfile?: () => void;

  // ✅ BlindDateScreen에서 던질 수 있는 추가 props들(타입 에러 방지용)
  isVip?: boolean;
  isSubscribed?: boolean;
  tingBalance?: number;
  coinBalance?: number;
  freeRemaining?: number;
  paidRemaining?: number;
  extraRemaining?: number;
  onNavigateToStore?: () => void;
} & Record<string, any>; // ✅ 어떤 props 더 와도 OK

const { height: H } = Dimensions.get('window');

const isNonEmpty = (v?: string | null) => typeof v === 'string' && v.trim().length > 0;

const showToast = (msg: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    // iOS는 일단 콘솔로(프로젝트에 별도 토스트 컴포넌트 있으면 여기서 교체)
    console.log('[Toast]', msg);
  }
};

const LoveCodeModal: React.FC<LoveCodeModalProps> = props => {
  const {
    visible,
    onClose,
    nickname,
    intro,
    want,
    charm,
    optionalAnswers,
    choices,
    onPressProfile,
  } = props;

  const visibleOptionalEntries = useMemo(() => {
    const entries = Object.entries(optionalAnswers ?? {});
    return entries.filter(([, v]) => isNonEmpty(v));
  }, [optionalAnswers]);

  const handlePressProfile = () => {
    onClose();
    if (onPressProfile) {
      onPressProfile();
      return;
    }
    // ✅ fallback 네비게이션 절대 안 함 (동미 요청)
    showToast('상대 프로필 상세 화면 연결 전입니다.');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>오늘의 연애 코드</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {isNonEmpty(nickname) && <Text style={styles.nickname}>{nickname}</Text>}

            {isNonEmpty(intro) && (
              <View style={styles.block}>
                <Text style={styles.blockTitle}>자기소개</Text>
                <Text style={styles.blockText}>{intro}</Text>
              </View>
            )}

            {isNonEmpty(want) && (
              <View style={styles.block}>
                <Text style={styles.blockTitle}>필수 주관식 1</Text>
                <Text style={styles.blockText}>{want}</Text>
              </View>
            )}

            {isNonEmpty(charm) && (
              <View style={styles.block}>
                <Text style={styles.blockTitle}>필수 주관식 2</Text>
                <Text style={styles.blockText}>{charm}</Text>
              </View>
            )}

            {visibleOptionalEntries.length > 0 && (
              <View style={styles.block}>
                <Text style={styles.blockTitle}>선택 주관식</Text>
                {visibleOptionalEntries.map(([k, v]) => (
                  <View key={k} style={styles.optionalRow}>
                    <Text style={styles.optionalKey}>{k}</Text>
                    <Text style={styles.optionalVal}>{String(v)}</Text>
                  </View>
                ))}
              </View>
            )}

            {(choices?.length ?? 0) > 0 && (
              <View style={styles.block}>
                <Text style={styles.blockTitle}>밸런스 질문</Text>
                {choices!.map((c, idx) => (
                  <View key={`${c.question}-${idx}`} style={styles.choiceRow}>
                    <Text style={styles.choiceQ}>{c.question}</Text>
                    <Text style={styles.choiceA}>선택: {c.selected}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.profileBtn} onPress={handlePressProfile} activeOpacity={0.9}>
              <Text style={styles.profileBtnText}>프로필 보기</Text>
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
    maxHeight: H * 0.78,
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
  close: { fontSize: 16, fontWeight: '900', color: '#111' },

  content: { padding: 16, paddingBottom: 12 },

  nickname: { fontSize: 18, fontWeight: '900', color: '#111', marginBottom: 10 },

  block: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#FFF',
  },
  blockTitle: { fontSize: 13, fontWeight: '900', color: '#111', marginBottom: 8 },
  blockText: { fontSize: 12, fontWeight: '700', color: '#444', lineHeight: 18 },

  optionalRow: { marginBottom: 10 },
  optionalKey: { fontSize: 12, fontWeight: '900', color: '#111', marginBottom: 4 },
  optionalVal: { fontSize: 12, fontWeight: '700', color: '#444', lineHeight: 18 },

  choiceRow: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#F1F1F1' },
  choiceQ: { fontSize: 12, fontWeight: '900', color: '#111' },
  choiceA: { marginTop: 4, fontSize: 12, fontWeight: '700', color: '#555' },

  footer: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  profileBtn: {
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE8F1',
  },
  profileBtnText: { color: PINK, fontSize: 14, fontWeight: '900' },
});

export default LoveCodeModal;
