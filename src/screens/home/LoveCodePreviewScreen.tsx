import React, { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import BottomNavigationBar from '../../components/common/BottomNavigationBar';

const vipBadgeImg = require('../../assets/images/VIP.png');
const subBadgeImg = require('../../assets/images/SUB.png');
const tingIconImg = require('../../assets/images/Ting.png');
const eventTingIconImg = require('../../assets/images/Eventting.png');
const petalImg = require('../../assets/images/petal.png');
const freeProfileImg = require('../../assets/images/freeprofile.png');
const paidProfileImg = require('../../assets/images/paidprofile.png');

export default function LoveCodePreviewScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const nickname: string = route.params?.nickname ?? '닉네임';
  const intro: string = route.params?.intro ?? '';
  const want: string = route.params?.want ?? '';
  const charm: string = route.params?.charm ?? '';

  const isVip: boolean = route.params?.isVip ?? false;
  const isSubscribed: boolean = route.params?.isSubscribed ?? false;
  const tingBalance: number = route.params?.tingBalance ?? 0;
  const eventTingBalance: number = route.params?.eventTingBalance ?? 0;

  const page = route.params?.page ?? 1;
  const total = route.params?.total ?? 1;
  const [counterInfoVisible, setCounterInfoVisible] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={styles.back}>{'←'}</Text>
        </Pressable>

        <View style={styles.topRow}>
          {isVip && (
            <View style={[styles.chip, styles.vipChip]}>
              <Image source={vipBadgeImg} style={styles.chipIcon} />
              <Text style={styles.vipChipText}>VIP</Text>
            </View>
          )}
          {isSubscribed && (
            <View style={[styles.chip, styles.subChip]}>
              <Image source={subBadgeImg} style={styles.chipIcon} />
              <Text style={styles.subChipText}>SUB</Text>
            </View>
          )}
          <View style={styles.balancePanel}>
            <View style={styles.balanceLine}>
              <Image source={tingIconImg} style={styles.balanceIcon} />
              <Text style={styles.balanceNumber}>{tingBalance}</Text>
            </View>
            <View style={styles.balanceLine}>
              <Image source={eventTingIconImg} style={styles.balanceIcon} />
              <Text style={styles.balanceNumber}>{eventTingBalance}</Text>
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.metaRow}
        activeOpacity={0.85}
        onPress={() => setCounterInfoVisible(true)}
      >
        <Image source={freeProfileImg} style={styles.metaIcon} />
        <Text style={styles.metaText}>5</Text>
        <Image source={paidProfileImg} style={styles.metaIcon} />
        <Text style={[styles.metaText, { color: '#E76A8C' }]}>5</Text>
      </TouchableOpacity>

      <View style={styles.contentWrap}>
        <Pressable style={styles.sideBtn}>
          <Text style={styles.sideArrow}>{'‹'}</Text>
        </Pressable>

        <ScrollView style={styles.card} contentContainerStyle={styles.cardContent}>
          <Text style={styles.title}>{nickname}의 연애코드</Text>

          <Text style={styles.qTitle}>자기소개</Text>
          <Text style={styles.answer}>{intro || '자기소개가 없어요.'}</Text>

          <Text style={styles.qTitle}>연인에게 바라는 한 가지는?</Text>
          <Text style={styles.answer}>{want || '응답이 없어요.'}</Text>

          <Text style={styles.qTitle}>나를 설레게 하는 이성의 매력?</Text>
          <Text style={styles.answer}>{charm || '응답이 없어요.'}</Text>
        </ScrollView>

        <Pressable style={styles.sideBtn}>
          <Text style={styles.sideArrow}>{'›'}</Text>
        </Pressable>
      </View>

      <TouchableOpacity style={styles.profileBtn} activeOpacity={0.9}>
        <Text style={styles.profileBtnText}>프로필 보기</Text>
      </TouchableOpacity>

      <Text style={styles.pageText}>{`${page}/${total}`}</Text>

      <Image source={petalImg} style={[styles.petal, styles.petalLeft]} />
      <Image source={petalImg} style={[styles.petal, styles.petalRight]} />

      <BottomNavigationBar
        activeTab="dating"
        onTabPress={tabKey => navigation.navigate('MainTabs', { screen: tabKey } as any)}
      />

      <Modal
        visible={counterInfoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCounterInfoVisible(false)}
      >
        <Pressable style={styles.counterBackdrop} onPress={() => setCounterInfoVisible(false)}>
          <Pressable style={styles.counterCard} onPress={() => {}}>
            <View style={styles.counterHeader}>
              <Text style={styles.counterTitle}>정보</Text>
              <Pressable onPress={() => setCounterInfoVisible(false)} hitSlop={10}>
                <Text style={styles.counterClose}>✕</Text>
              </Pressable>
            </View>
            <View style={styles.counterLine}>
              <Image source={freeProfileImg} style={styles.counterIcon} />
              <Text style={styles.counterText}>무료 프로필 잔여횟수</Text>
            </View>
            <View style={styles.counterLine}>
              <Image source={paidProfileImg} style={styles.counterIcon} />
              <Text style={styles.counterText}>유료 프로필 잔여횟수</Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    paddingHorizontal: 14,
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  back: { fontSize: 22, color: '#111', fontWeight: '700' },

  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  chip: {
    height: 24,
    width: 62,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  chipIcon: { width: 11, height: 11, resizeMode: 'contain' },
  vipChip: { backgroundColor: '#660099' },
  subChip: { backgroundColor: '#FFB6C180', borderWidth: 1, borderColor: '#00000020' },
  vipChipText: { color: '#F0C22D', fontSize: 12, fontWeight: '900' },
  subChipText: { color: '#111', fontSize: 12, fontWeight: '700' },
  balancePanel: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    width: 65,
  },
  balanceLine: { flexDirection: 'row', alignItems: 'center', paddingVertical: 1 },
  balanceIcon: { width: 19, height: 19, resizeMode: 'contain' },
  balanceNumber: { marginLeft: 10, fontSize: 16, fontWeight: '400', color: '#111' },

  metaRow: { paddingHorizontal: 16, marginTop: 10, flexDirection: 'row', gap: 4, alignItems: 'center' },
  metaIcon: { width: 18, height: 18, resizeMode: 'contain' },
  metaText: { fontSize: 14, color: '#111', fontWeight: '700' },

  contentWrap: { marginTop: 10, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center' },
  sideBtn: { width: 18, alignItems: 'center' },
  sideArrow: { fontSize: 22, color: '#111' },
  card: {
    flex: 1,
    maxHeight: 360,
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 14,
    backgroundColor: '#F9F9F9',
  },
  cardContent: { padding: 14 },
  title: { fontSize: 28, fontWeight: '900', color: '#111', marginBottom: 14, textAlign: 'center' },
  qTitle: { fontSize: 14, fontWeight: '900', color: '#111', marginTop: 8, marginBottom: 6 },
  answer: { fontSize: 12, color: '#444', lineHeight: 18, fontWeight: '600' },

  profileBtn: {
    marginTop: 10,
    alignSelf: 'center',
    width: 90,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F8C5D2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBtnText: { fontSize: 12, color: '#111', fontWeight: '800' },
  pageText: {
    position: 'absolute',
    right: 10,
    bottom: 4,
    color: '#111',
    fontWeight: '700',
    fontSize: 14,
  },

  petal: { position: 'absolute', width: 34, height: 34, opacity: 0.9 },
  petalLeft: { left: 14, bottom: 10, transform: [{ rotate: '-18deg' }] },
  petalRight: { right: 16, top: '44%', transform: [{ rotate: '18deg' }] },

  counterBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 74,
  },
  counterCard: {
    width: 210,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E4E4',
    padding: 10,
  },
  counterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  counterTitle: { fontSize: 12, fontWeight: '900', color: '#111' },
  counterClose: { fontSize: 12, color: '#111' },
  counterLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  counterIcon: { width: 16, height: 16, resizeMode: 'contain' },
  counterText: { fontSize: 12, color: '#111', fontWeight: '700' },
});
