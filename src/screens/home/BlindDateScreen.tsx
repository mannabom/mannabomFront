// src/screens/BlindDate/BlindDateScreen.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  ImageBackground,
  Image,
} from 'react-native';

import FilterModal from '../../components/common/FilterModal';
import ProfileCardModal from '../../components/common/ProfileCardModal';
import LoveCodeModal from '../../components/common/LoveCodeModal';

import { FilterSettings } from '../../types/DatingAPI';
import { defaultFilterSettings } from '../../utils/DatingUtils';
import {
  MockFilterInput,
  UiLoveCodeCard,
  UiProfileCard,
  mockFetchLoveCodeCards,
  mockFetchProfileCards,
} from '../../mocks/datingMock';
const petalImg = require('../../assets/images/petal.png');

interface BlindDateScreenProps {
  onLogout: () => void;
}

const DAILY_FREE = 5;
const DAILY_PAID_SUB = 5;

const BlindDateScreen: React.FC<BlindDateScreenProps> = () => {
  const [filterSettings, setFilterSettings] = useState<FilterSettings>(defaultFilterSettings);

  const [previewProfile, setPreviewProfile] = useState<UiProfileCard | null>(null);
  const [previewLoveCode, setPreviewLoveCode] = useState<UiLoveCodeCard | null>(null);
  const [profileCards, setProfileCards] = useState<UiProfileCard[]>([]);
  const [loveCodeCards, setLoveCodeCards] = useState<UiLoveCodeCard[]>([]);

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [loveCodeModalVisible, setLoveCodeModalVisible] = useState(false);

  // ✅ 재화/구독 (지금은 임시값)
  const [tingBalance, setTingBalance] = useState<number>(225); // ♥
  const [coinBalance, setCoinBalance] = useState<number>(100); // 코인(임시)
  const [isVip] = useState<boolean>(true);
  const [isSubscribed] = useState<boolean>(true);

  // ✅ 프로필 열람권(무료/유료) - “프로필/연애코드 통합”으로 같이 씀
  const [freeRemaining, setFreeRemaining] = useState<number>(DAILY_FREE);
  const [paidRemaining, setPaidRemaining] = useState<number>(isSubscribed ? DAILY_PAID_SUB : 0);

  const paidLabelCount = useMemo(() => paidRemaining, [paidRemaining]);

  const toMockFilter = (filters: FilterSettings): MockFilterInput => ({
    minAge: filters.ageRange.min,
    maxAge: filters.ageRange.max,
    smoking: filters.smoking,
    drinking: filters.drinking,
    limit: 10,
  });

  React.useEffect(() => {
    let mounted = true;

    const loadPreview = async () => {
      try {
        const mockInput = toMockFilter(filterSettings);
        const [profiles, loveCodes] = await Promise.all([
          mockFetchProfileCards(mockInput),
          mockFetchLoveCodeCards(mockInput),
        ]);

        if (!mounted) return;
        setProfileCards(profiles);
        setLoveCodeCards(loveCodes);
        setPreviewProfile(profiles[0] ?? null);
        setPreviewLoveCode(loveCodes[0] ?? null);
      } catch (e) {
        console.warn('Failed to load mock previews', e);
      }
    };

    loadPreview();
    return () => {
      mounted = false;
    };
  }, [filterSettings]);

  const handleFilterApply = (newFilters: FilterSettings) => {
    setFilterSettings(newFilters);
    setFilterModalVisible(false);
  };

  const mapProfilesForModal = useMemo(
    () =>
      profileCards.map(p => ({
        profileId: p.profileId,
        nickname: p.nickname,
        age: p.age,
        mbti: p.mbti,
        smoking: p.smoking,
        drinking: p.drinking,
        photoUris: [p.mainPhotoUrl],
      })),
    [profileCards],
  );

  const firstLoveCode = loveCodeCards[0];
  const findAnswer = (q: string | undefined) =>
    firstLoveCode?.requiredQA.find(item => item.question === q)?.answer;
  const loveCodeOptional = useMemo(() => {
    if (!firstLoveCode || !firstLoveCode.optionalQA?.length) return undefined;
    return firstLoveCode.optionalQA.reduce<Record<string, string>>((acc, qa) => {
      acc[qa.question] = qa.answer;
      return acc;
    }, {});
  }, [firstLoveCode]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.container}>
        {/* 상단 바 */}
        <View style={styles.topBar}>
          <View style={styles.badgeRow}>
            {isVip && (
              <View style={[styles.tag, styles.vipTag]}>
                <Text style={styles.vipText}>👑 VIP</Text>
              </View>
            )}
            <View style={[styles.tag, styles.subTag]}>
              <Text style={styles.subText}>🔔 SUB</Text>
            </View>
            <View style={[styles.balanceBox, styles.heartBox]}>
              <Text style={styles.balanceText}>❤ {tingBalance}</Text>
            </View>
          </View>
          <View style={styles.coinRow}>
            <View style={[styles.balanceBox, styles.coinBox]}>
              <Text style={styles.balanceText}>🪙 {coinBalance}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
            activeOpacity={0.85}
          >
            <View style={styles.filterIcon}>
              <View style={[styles.filterLine, { width: 18 }]} />
              <View style={[styles.filterLine, { width: 12, marginTop: 4 }]} />
              <View style={[styles.filterLine, { width: 6, marginTop: 4 }]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* 카드 2개 */}
        <View style={styles.cardsWrap}>
          {/* 떠다니는 벚꽃잎 */}
          <Image source={petalImg} style={[styles.petal, styles.petalLeft]} />
          <Image source={petalImg} style={[styles.petal, styles.petalRight]} />

          {/* 일반 소개팅 */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => setProfileModalVisible(true)}
            activeOpacity={0.9}
          >
            <ImageBackground
              source={{ uri: previewProfile?.mainPhotoUrl ?? 'https://picsum.photos/700/700' }}
              blurRadius={7}
              style={styles.cardImage}
              imageStyle={styles.cardImageStyle}
            >
              <View style={styles.blurScrim} />
            </ImageBackground>
            <Text style={styles.cardTitle}>일반 소개팅</Text>
          </TouchableOpacity>

          {/* 블라인드 소개팅 */}
          <TouchableOpacity
            style={[styles.card, styles.blindCard]}
            onPress={() => setLoveCodeModalVisible(true)}
            activeOpacity={0.9}
          >
            <View style={[styles.cardImage, styles.blindPlaceholder]}>
              <View style={styles.blindBlur} />
              <Text style={styles.blindLabel}>자기소개</Text>
              <Text style={styles.blindText} numberOfLines={4}>
                {previewLoveCode?.requiredQA.find(q => q.question === '자기소개')?.answer ??
                  '소개팅 프로필에 작성된 자기소개가 여기에 블러 처리되어 보여요.'}
              </Text>
            </View>
            <Text style={styles.cardTitle}>블라인드 소개팅</Text>
          </TouchableOpacity>
        </View>

        {/* 필터 모달 */}
        <FilterModal
          visible={filterModalVisible}
          onClose={() => setFilterModalVisible(false)}
          onApply={handleFilterApply}
          initialFilters={filterSettings}
        />

        {/* 프로필 카드 모달(전체 화면) */}
        <ProfileCardModal
          visible={profileModalVisible}
          onClose={() => setProfileModalVisible(false)}
          filterSettings={filterSettings}
          profiles={mapProfilesForModal}
          isVip={isVip}
          isSubscribed={isSubscribed}
          tingBalance={tingBalance}
          coinBalance={coinBalance}
          freeRemaining={freeRemaining}
          paidRemaining={paidLabelCount}
          onChangeTingBalance={setTingBalance}
          onChangeCoinBalance={setCoinBalance}
          onChangeFreeRemaining={setFreeRemaining}
          onChangePaidRemaining={setPaidRemaining}
          // ✅ 여기서 Store 라우트 연결 필요 (아래 질문 참고)
          onNavigateToStore={() => {
            // TODO: 네 “스토어-재화충전” 화면 route 이름 알려주면 정확히 연결해줄게.
            // 예: navigation.navigate('StoreCharge')
          }}
        />

        {/* 연애코드 모달(전체 화면) */}
        <LoveCodeModal
          visible={loveCodeModalVisible}
          onClose={() => setLoveCodeModalVisible(false)}
          nickname={firstLoveCode?.nickname}
          intro={findAnswer('자기소개')}
          want={findAnswer('연인에게 바라는 한 가지는?')}
          charm={findAnswer('나를 설레게 하는 이성의 매력?')}
          optionalAnswers={loveCodeOptional}
          isVip={isVip}
          isSubscribed={isSubscribed}
          tingBalance={tingBalance}
          coinBalance={coinBalance}
          freeRemaining={freeRemaining}
          paidRemaining={paidLabelCount}
          onChangeTingBalance={setTingBalance}
          onChangeCoinBalance={setCoinBalance}
          onChangeFreeRemaining={setFreeRemaining}
          onChangePaidRemaining={setPaidRemaining}
          onNavigateToStore={() => {
            // TODO: StoreCharge 라우트 연결 필요
          }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#FFFFFF', position: 'relative' },

  topBar: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
  },

  badgeRow: { flexDirection: 'row', gap: 8, flexShrink: 1 },
  coinRow: { flexDirection: 'row', alignSelf: 'flex-end' },

  tag: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#FFB3C7',
    shadowOpacity: 0.12,
    shadowRadius: 5,
    minWidth: 64,
    alignItems: 'center',
  },
  vipTag: { backgroundColor: '#6D28D9' },
  vipText: { color: '#FFFFFF', fontWeight: '900', fontSize: 12 },

  subTag: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FF9DBA',
  },
  subText: { color: '#FF6B9A', fontWeight: '900', fontSize: 12 },

  balanceBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFD7E4',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 64,
    alignItems: 'center',
  },
  balanceText: { fontSize: 12, fontWeight: '900', color: '#FF6B9A', textAlign: 'center' },
  heartBox: { borderColor: '#FFD7E4' },
  coinBox: { borderColor: '#FFD7E4' },

  filterButton: { padding: 8, marginTop: 4, alignSelf: 'flex-end' },
  filterIcon: { alignItems: 'flex-end' },
  filterLine: {
    height: 2,
    borderRadius: 2,
    backgroundColor: '#111',
  },

  cardsWrap: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
    position: 'relative',
    overflow: 'visible',
    alignItems: 'center',
  },

  card: {
    width: '82%',
    borderWidth: 2.2,
    borderColor: '#FFB3C7',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingTop: 16,
    paddingBottom: 10,
    shadowColor: '#FFB3C7',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    aspectRatio: 1.1,
  },
  blindCard: { marginTop: 12 },

  cardImage: {
    width: '94%',
    alignSelf: 'center',
    flex: 1,
    minHeight: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  cardImageStyle: { borderRadius: 12 },
  blurScrim: { flex: 1, backgroundColor: 'rgba(255,255,255,0.26)' },

  cardTitle: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '900',
    color: '#111',
  },

  blindPlaceholder: {
    borderWidth: 1,
    borderColor: '#FFE0EA',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: '94%',
    alignSelf: 'center',
    flex: 1,
    minHeight: 80,
  },
  blindBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(240,240,240,0.97)',
  },
  blindLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#111',
    marginBottom: 10,
    opacity: 0.18,
  },
  blindText: {
    color: '#111',
    fontWeight: '900',
    textAlign: 'center',
    opacity: 0.08,
    letterSpacing: 3.6,
    textShadowColor: '#000',
    textShadowRadius: 16,
    textShadowOffset: { width: 2, height: 2 },
    lineHeight: 20,
    transform: [{ scaleX: 0.82 }, { scaleY: 0.8 }],
  },

  petal: { position: 'absolute', width: 34, height: 34, opacity: 0.9 },
  petalLeft: { left: 14, bottom: 10, transform: [{ rotate: '-18deg' }] },
  petalRight: { right: 16, top: '44%', transform: [{ rotate: '18deg' }] },
});

export default BlindDateScreen;
