// src/screens/home/HomeScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import FilterModal from '../../components/common/FilterModal';
import ProfileCardModal from '../../components/common/ProfileCardModal';
import { FilterSettings } from '../../types/DatingAPI';
import {
  defaultFilterSettings,
  getFilterSummary,
} from '../../utils/DatingUtils';

import type { MainTabParamList } from '../../navigation/MainTabNavigator';

type HomeTabNav = BottomTabNavigationProp<MainTabParamList, 'dating'>;

interface HomeScreenProps {
  onLogout: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onLogout }) => {
  const navigation = useNavigation<HomeTabNav>();

  const [filterSettings, setFilterSettings] = useState<FilterSettings>(
    defaultFilterSettings,
  );
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const handleLogout = () => {
    console.log('로그아웃 처리');
    onLogout();
  };

  const goToMyPage = () => {
    // ✅ 이제 MyPage는 스택이 아니라 탭 라우트(mypage)
    navigation.navigate('mypage');
  };

  const handleFilterApply = (newFilters: FilterSettings) => {
    setFilterSettings(newFilters);
    setFilterModalVisible(false);
    console.log('필터 설정 적용:', newFilters);
  };

  const handleProfileMatchingPress = () => {
    setProfileModalVisible(true);
  };

  const handleRomanceMatchingPress = () => {
    Alert.alert('준비 중', '연애관 매칭 기능은 현재 개발 중입니다.', [
      { text: '확인' },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>만나봄</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Text style={styles.filterButtonText}>⚙️</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.mypageButton} onPress={goToMyPage}>
            <Text style={styles.mypageButtonText}>마이페이지</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>로그아웃</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* dating 탭 메인 */}
      <View style={styles.content}>
        <View style={styles.datingContent}>
          <TouchableOpacity
            style={styles.matchingCard}
            onPress={handleProfileMatchingPress}
          >
            <View style={styles.cardContent}>
              <Text style={styles.cardEmoji}>💕</Text>
              <Text style={styles.cardTitle}>오늘의 프로필</Text>
              <Text style={styles.cardDescription}>
                새로운 인연을 만나보세요!
              </Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.description}>놓치지 말아요! 보세요!</Text>

          <TouchableOpacity
            style={styles.romanceCard}
            onPress={handleRomanceMatchingPress}
          >
            <View style={styles.romanceCardContent}>
              <Text style={styles.romanceTitle}>오늘의 연애 코드</Text>
              <Text style={styles.romanceSubtitle}>특별한 사람</Text>
              <Text style={styles.romanceDescription}>
                새로운 만남을 위해 준비된 특별한{'\n'}
                질문들과 함께하는 연애 코드를{'\n'}
                지금 바로 확인해보세요.
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.filterInfo}>
            <Text style={styles.filterTitle}>현재 설정된 조건</Text>
            <Text style={styles.filterText}>
              {getFilterSummary(filterSettings)}
            </Text>
            <TouchableOpacity
              style={styles.filterChangeButton}
              onPress={() => setFilterModalVisible(true)}
            >
              <Text style={styles.filterChangeButtonText}>조건 변경</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 모달 */}
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
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333333' },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterButton: {
    padding: 8,
    backgroundColor: '#FFE8F1',
    borderRadius: 20,
  },
  filterButtonText: { fontSize: 16 },

  mypageButton: {
    backgroundColor: '#E9ECEF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  mypageButtonText: { color: '#333333', fontSize: 13, fontWeight: '700' },

  logoutButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 15,
  },
  logoutButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },

  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 10,
  },

  datingContent: { flex: 1, gap: 20 },

  matchingCard: {
    backgroundColor: '#FFE8F1',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  cardEmoji: { fontSize: 40, marginBottom: 10 },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 8,
  },
  cardDescription: { fontSize: 14, color: '#666666', textAlign: 'center' },

  romanceCard: {
    backgroundColor: '#FFF8F8',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFE8F1',
    padding: 25,
  },
  romanceCardContent: { alignItems: 'center' },
  romanceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  romanceSubtitle: { fontSize: 14, color: '#666666', marginBottom: 15 },
  romanceDescription: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 18,
  },

  filterInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  filterText: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 15,
    lineHeight: 16,
  },
  filterChangeButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  filterChangeButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
});

export default HomeScreen;
