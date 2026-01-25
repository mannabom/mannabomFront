import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  ImageBackground,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import FilterModal from '../../components/common/FilterModal';
import ProfileCardModal from '../../components/common/ProfileCardModal';
import LoveCodeModal from '../../components/common/LoveCodeModal';

import { FilterSettings } from '../../types/DatingAPI';
import { defaultFilterSettings } from '../../utils/DatingUtils';

interface BlindDateScreenProps {
  onLogout: () => void;
}

const STORAGE_KEYS = {
  LAST_OPEN_PROFILE_MATCH: 'last_open_profile_match',
  LAST_OPEN_LOVE_CODE: 'last_open_love_code',
};

const getTodayNoon = () => {
  const now = new Date();
  const noon = new Date(now);
  noon.setHours(12, 0, 0, 0);
  return noon;
};

const isNewAfterNoon = (lastOpenedMs?: number | null) => {
  const now = new Date();
  const noon = getTodayNoon();

  // 12시 전이면 NEW 없음
  if (now.getTime() < noon.getTime()) return false;

  // 기록 없으면 NEW
  if (!lastOpenedMs) return true;

  // 마지막 오픈이 오늘 12시 이전이면 NEW
  return lastOpenedMs < noon.getTime();
};

const BlindDateScreen: React.FC<BlindDateScreenProps> = ({ onLogout }) => {
  const [filterSettings, setFilterSettings] = useState<FilterSettings>(defaultFilterSettings);

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [loveCodeModalVisible, setLoveCodeModalVisible] = useState(false);

  // ✅ 재화/구독 (지금은 임시값. 나중에 USER_MEMBERSHIP 붙이면 여기만 교체하면 됨)
  const [tingBalance, setTingBalance] = useState<number>(225);
  const [isSubscribed] = useState<boolean>(true);

  const has200 = tingBalance >= 200;
  const hasBenefitTicket = has200 || isSubscribed;

  const [isNewProfile, setIsNewProfile] = useState(false);
  const [isNewLoveCode, setIsNewLoveCode] = useState(false);

  const refreshNewBadges = useCallback(async () => {
    try {
      const [p, l] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.LAST_OPEN_PROFILE_MATCH),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_OPEN_LOVE_CODE),
      ]);

      const pMs = p ? Number(p) : null;
      const lMs = l ? Number(l) : null;

      setIsNewProfile(isNewAfterNoon(pMs));
      setIsNewLoveCode(isNewAfterNoon(lMs));
    } catch {
      setIsNewProfile(false);
      setIsNewLoveCode(false);
    }
  }, []);

  useEffect(() => {
    refreshNewBadges();
  }, [refreshNewBadges]);

  const handleFilterApply = (newFilters: FilterSettings) => {
    setFilterSettings(newFilters);
    setFilterModalVisible(false);
  };

  const handleProfilePress = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_OPEN_PROFILE_MATCH, String(Date.now()));
    } catch {}
    setIsNewProfile(false);
    setProfileModalVisible(true);
  };

  const handleLoveCodePress = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_OPEN_LOVE_CODE, String(Date.now()));
    } catch {}
    setIsNewLoveCode(false);
    setLoveCodeModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ✅ 상단 바: 오른쪽에 200이상 보유, 그 밑에 필터 버튼 */}
      <View style={styles.topBar}>
        <View style={styles.leftChips}>
          {isSubscribed && (
            <View style={[styles.chip, styles.chipGreen]}>
              <Text style={[styles.chipText, styles.chipTextGreen]}>구독중</Text>
            </View>
          )}

          <View style={styles.tingChip}>
            <Text style={styles.tingText}>♥ {tingBalance}</Text>
          </View>
        </View>

        <View style={styles.rightStack}>
          {has200 && (
            <View style={[styles.chip, styles.chipOutlinePurple]}>
              <Text style={[styles.chipText, styles.chipTextPurple]}>200이상 보유</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.filterIconButton}
            onPress={() => setFilterModalVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.filterIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ✅ 카드 2개가 화면 꽉 차게 */}
      <View style={styles.cardsWrap}>
        <TouchableOpacity style={styles.cardTouchable} onPress={handleProfilePress} activeOpacity={0.9}>
          <ImageBackground
            source={{ uri: 'https://picsum.photos/800/1200?blur=2' }}
            blurRadius={Platform.OS === 'android' ? 2 : 10}
            style={styles.bigCard}
            imageStyle={styles.bigCardImage}
          >
            <View style={styles.cardBorder} />
            {isNewProfile && <Text style={styles.newTag}>New!</Text>}
            <View style={styles.cardFooter}>
              <Text style={styles.cardTitle}>오늘의 프로필</Text>
            </View>
          </ImageBackground>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cardTouchable} onPress={handleLoveCodePress} activeOpacity={0.9}>
          <ImageBackground
            source={{ uri: 'https://picsum.photos/800/900?blur=2' }}
            blurRadius={Platform.OS === 'android' ? 2 : 10}
            style={styles.bigCard}
            imageStyle={styles.bigCardImage}
          >
            <View style={styles.cardBorder} />
            {isNewLoveCode && <Text style={styles.newTag}>New!</Text>}
            <View style={styles.cardFooter}>
              <Text style={styles.cardTitle}>오늘의 연애 코드</Text>
            </View>
          </ImageBackground>
        </TouchableOpacity>
      </View>

      {/* ✅ 모달들 */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleFilterApply}
        initialFilters={filterSettings}
      />

      <ProfileCardModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
        filterSettings={filterSettings}
        hasBenefitTicket={hasBenefitTicket}
        tingBalance={tingBalance}
        onChangeTingBalance={setTingBalance}
      />

      <LoveCodeModal
        visible={loveCodeModalVisible}
        onClose={() => setLoveCodeModalVisible(false)}
        // 지금은 더미 데이터(연애코드 API 스펙 주면 이 부분만 실제 데이터로 교체)
        nickname="닉네임"
        intro="서로의 감정에 진심으로 공감해주고, 말하지 않아도 마음이 전해지는 그런 따뜻한 사람이면 좋겠어요."
        want="서로의 감정에 진심으로 공감해주고, 말하지 않아도 마음이 전해지는 그런 따뜻한 사람이면 좋겠어요."
        charm="서로의 감정에 진심으로 공감해주고, 말하지 않아도 마음이 전해지는 그런 따뜻한 사람이면 좋겠어요."
        optionalAnswers={{
          meaningOfLove: '서로의 감정에 진심으로 공감해주고, 말하지 않아도 마음이 전해지는 그런 따뜻한 사람이면 좋겠어요.',
          soulFood: '서로의 감정에 진심으로 공감해주고, 말하지 않아도 마음이 전해지는 그런 따뜻한 사람이면 좋겠어요.',
          dailyAndHoliday: '서로의 감정에 진심으로 공감해주고, 말하지 않아도 마음이 전해지는 그런 따뜻한 사람이면 좋겠어요.',
          idealDate: '서로의 감정에 진심으로 공감해주고, 말하지 않아도 마음이 전해지는 그런 따뜻한 사람이면 좋겠어요.',
        }}
        choices={[
          { question: '연인과 싸웠을 때', left: '바로 풀고 싶다', right: '시간을 좀 가지고 싶다', selected: '바로 풀고 싶다' },
          { question: '연인과 함께한 사진', left: 'SNS에 공유해도 된다', right: 'SNS에 공유하기 싫다', selected: 'SNS에 공유하기 싫다' },
          { question: '연애에서 더 중요한 것은', left: '편안함', right: '설렘', selected: '설렘' },
          { question: '연인과의 데이트에서', left: '실내에서 데이트하기', right: '실외에서 데이트하기', selected: '실외에서 데이트하기' },
          { question: '연애에서 적당한 질투가', left: '있어야 재미있다', right: '쿨한 게 편하다', selected: '쿨한 게 편하다' },
          { question: '연인과의 이상적인 하루는', left: '편안한 일상 즐기기', right: '새로운 경험 해보기', selected: '새로운 경험 해보기' },
          { question: '연인에게 주로 끌리는 모습은', left: '배려심 넘치는 모습', right: '주도적인 모습', selected: '주도적인 모습' },
          { question: '연인이 내 친구들과', left: '어울리며 놀기', right: '따로 놀기', selected: '따로 놀기' },
        ]}
        onPressProfile={() => {
          // TODO: “상대 상세 프로필” 화면 라우트 생기면 여기에서 navigation 연결
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },

  leftChips: { flexDirection: 'row', alignItems: 'center' },
  rightStack: { alignItems: 'flex-end' },

  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, marginLeft: 8 },
  chipText: { fontSize: 12, fontWeight: '800' },

  chipGreen: { backgroundColor: '#22C55E' },
  chipTextGreen: { color: '#FFFFFF' },

  chipOutlinePurple: { borderWidth: 1, borderColor: '#8B5CF6', backgroundColor: '#FFFFFF', marginBottom: 8 },
  chipTextPurple: { color: '#8B5CF6' },

  tingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE8F1',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tingText: { color: '#FF4D6D', fontWeight: '900', fontSize: 12 },

  filterIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  filterIcon: { fontSize: 18 },

  cardsWrap: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },

  cardTouchable: {
    flex: 1,
    marginBottom: 14,
  },

  bigCard: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  bigCardImage: { borderRadius: 22 },

  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FFB3C7',
  },

  newTag: {
    position: 'absolute',
    right: 14,
    top: 10,
    color: '#FF7AA2',
    fontWeight: '900',
    fontSize: 12,
    transform: [{ rotate: '-18deg' }],
  },

  cardFooter: {
    paddingBottom: 14,
    alignItems: 'center',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 18,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

export default BlindDateScreen;
