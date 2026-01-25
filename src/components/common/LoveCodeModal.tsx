import React, { useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';

const { width: W } = Dimensions.get('window');

const PINK = '#FF6F8E';
const BORDER = '#E6E6E6';

type Choice = {
  question: string;
  left: string;
  right: string;
  selected?: string; // left/right 중 하나
};

type OptionalAnswers = {
  meaningOfLove?: string;
  soulFood?: string;
  dailyAndHoliday?: string;
  idealDate?: string;
};

type PageType = 'summary' | 'must' | 'optional' | 'choices';
type Page = { key: string; type: PageType };

interface LoveCodeModalProps {
  visible: boolean;
  onClose: () => void;

  nickname?: string;
  intro: string;
  want: string;
  charm: string;

  optionalAnswers?: OptionalAnswers;
  choices?: Choice[];

  onPressProfile?: () => void;
}

const LoveCodeModal: React.FC<LoveCodeModalProps> = ({
  visible,
  onClose,
  nickname = '닉네임',
  intro,
  want,
  charm,
  optionalAnswers,
  choices = [],
  onPressProfile,
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const optionalList = useMemo(() => {
    return [
      {
        label: '나에게 연애란 어떤 의미인가요?',
        value: optionalAnswers?.meaningOfLove,
      },
      { label: '나의 소울 푸드?', value: optionalAnswers?.soulFood },
      {
        label: '나의 하루 그리고 나의 휴일은?',
        value: optionalAnswers?.dailyAndHoliday,
      },
      { label: '하고 싶은 데이트는?', value: optionalAnswers?.idealDate },
    ].filter(x => (x.value || '').trim().length > 0);
  }, [optionalAnswers]);

  // ✅ TS가 좁게 추론하지 않도록 Page[]로 고정
  const pages = useMemo<Page[]>(() => {
    const base: Page[] = [
      { key: 'p1', type: 'summary' },
      { key: 'p2', type: 'must' },
    ];
    if (optionalList.length > 0) base.push({ key: 'p3', type: 'optional' });
    base.push({ key: 'p4', type: 'choices' });
    return base;
  }, [optionalList.length]);

  const pageCount = pages.length;

  const goTo = (to: number) => {
    const next = Math.max(0, Math.min(pageCount - 1, to));
    setIndex(next);
    scrollRef.current?.scrollTo({ x: next * W, animated: true });
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const nextIdx = Math.round(x / W);
    if (nextIdx !== index) setIndex(nextIdx);
  };

  const renderPage = (type: PageType) => {
    if (type === 'summary') {
      return (
        <View style={styles.page}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>자기소개</Text>
            <Text style={styles.cardBody} numberOfLines={4}>
              {intro}
            </Text>

            <Text style={[styles.cardTitle, { marginTop: 14 }]}>
              연인에게 바라는 한 가지는?
            </Text>
            <Text style={styles.cardBody} numberOfLines={4}>
              {want}
            </Text>

            <Text style={[styles.cardTitle, { marginTop: 14 }]}>
              나를 설레게 하는 이성의 매력?
            </Text>
            <Text style={styles.cardBody} numberOfLines={4}>
              {charm}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.profileBtn}
            onPress={onPressProfile}
            activeOpacity={0.9}
          >
            <Text style={styles.profileBtnText}>프로필 보기</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (type === 'must') {
      return (
        <View style={styles.page}>
          <Text style={styles.nick}>{nickname}</Text>

          <View style={styles.longCard}>
            <Text style={styles.longTitle}>자기소개</Text>
            <Text style={styles.longBody}>{intro}</Text>

            <Text style={[styles.longTitle, { marginTop: 16 }]}>
              연인에게 바라는 한 가지는?
            </Text>
            <Text style={styles.longBody}>{want}</Text>

            <Text style={[styles.longTitle, { marginTop: 16 }]}>
              나를 설레게 하는 이성의 매력?
            </Text>
            <Text style={styles.longBody}>{charm}</Text>
          </View>

          <TouchableOpacity
            style={styles.profileBtn}
            onPress={onPressProfile}
            activeOpacity={0.9}
          >
            <Text style={styles.profileBtnText}>프로필 보기</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (type === 'optional') {
      return (
        <View style={styles.page}>
          <Text style={styles.nick}>{nickname}</Text>

          <View style={styles.longCard}>
            {optionalList.map((it, i) => (
              <View key={it.label}>
                <Text
                  style={[
                    styles.longTitle,
                    i === 0 ? undefined : { marginTop: 16 },
                  ]}
                >
                  {it.label}
                </Text>
                <Text style={styles.longBody}>{it.value}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.profileBtn}
            onPress={onPressProfile}
            activeOpacity={0.9}
          >
            <Text style={styles.profileBtnText}>프로필 보기</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // choices
    return (
      <View style={styles.page}>
        <Text style={styles.nick}>{nickname}</Text>

        <View style={styles.choiceCard}>
          {choices.map((c, i) => {
            const leftActive = c.selected === c.left;
            const rightActive = c.selected === c.right;

            return (
              <View
                key={`${c.question}-${i}`}
                style={{ marginBottom: i === choices.length - 1 ? 0 : 14 }}
              >
                <Text style={styles.choiceQuestion}>{c.question}</Text>

                <View style={styles.vsRow}>
                  <View
                    style={[
                      styles.choicePill,
                      leftActive
                        ? styles.choicePillActive
                        : styles.choicePillIdle,
                    ]}
                  >
                    <Text
                      style={[
                        styles.choiceText,
                        leftActive && styles.choiceTextActive,
                      ]}
                    >
                      {c.left}
                    </Text>
                  </View>

                  <Text style={styles.vsText}>VS</Text>

                  <View
                    style={[
                      styles.choicePill,
                      rightActive
                        ? styles.choicePillActive
                        : styles.choicePillIdle,
                    ]}
                  >
                    <Text
                      style={[
                        styles.choiceText,
                        rightActive && styles.choiceTextActive,
                      ]}
                    >
                      {c.right}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.profileBtn}
          onPress={onPressProfile}
          activeOpacity={0.9}
        >
          <Text style={styles.profileBtnText}>프로필 보기</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.userIcon}>👤</Text>
            <Text style={styles.pageText}>
              {index + 1}/{pageCount}
            </Text>
          </View>

          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <Text style={styles.close}>✕</Text>
          </TouchableOpacity>
        </View>

        <Pressable
          style={[styles.arrowBtn, { left: 8 }]}
          onPress={() => goTo(index - 1)}
        >
          <Text style={styles.arrowText}>‹</Text>
        </Pressable>
        <Pressable
          style={[styles.arrowBtn, { right: 8 }]}
          onPress={() => goTo(index + 1)}
        >
          <Text style={styles.arrowText}>›</Text>
        </Pressable>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
        >
          {pages.map(p => (
            <View key={p.key} style={{ width: W }}>
              {renderPage(p.type)}
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },

  header: {
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  userIcon: { fontSize: 18, marginRight: 8 },
  pageText: { fontSize: 14, fontWeight: '900', color: '#111' },
  close: { fontSize: 16, fontWeight: '900', color: '#111' },

  arrowBtn: {
    position: 'absolute',
    top: 56 + 10,
    zIndex: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: { fontSize: 22, fontWeight: '900', color: '#111' },

  page: { flex: 1, padding: 16, paddingTop: 16 },

  card: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#FFF',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111',
    marginBottom: 6,
  },
  cardBody: { fontSize: 13, color: '#333', lineHeight: 18 },

  nick: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '900',
    color: '#111',
    marginBottom: 12,
  },

  longCard: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#FFF',
  },
  longTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111',
    marginBottom: 6,
  },
  longBody: { fontSize: 13, color: '#333', lineHeight: 18 },

  choiceCard: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#FFF',
  },
  choiceQuestion: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '900',
    color: '#111',
    marginBottom: 10,
  },

  vsRow: { position: 'relative', flexDirection: 'row', alignItems: 'center' },
  vsText: {
    position: 'absolute',
    left: '50%',
    marginLeft: -10,
    fontWeight: '900',
    color: '#999',
    fontSize: 12,
  },
  choicePill: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choicePillIdle: { borderColor: BORDER, backgroundColor: '#FFF' },
  choicePillActive: { borderColor: PINK, backgroundColor: PINK },
  choiceText: { fontSize: 12, fontWeight: '900', color: '#111' },
  choiceTextActive: { color: '#FFF' },

  profileBtn: {
    marginTop: 16,
    alignSelf: 'center',
    height: 44,
    paddingHorizontal: 26,
    borderRadius: 22,
    backgroundColor: '#FFD1DC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFB3C7',
  },
  profileBtnText: { fontSize: 14, fontWeight: '900', color: '#111' },
});

export default LoveCodeModal;
