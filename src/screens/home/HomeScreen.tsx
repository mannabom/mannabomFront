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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import BottomNavigationBar from '../../components/common/BottomNavigationBar';
import FilterModal from '../../components/common/FilterModal';
import ProfileCardModal from '../../components/common/ProfileCardModal';
import { FilterSettings } from '../../types/DatingAPI';
import {
  defaultFilterSettings,
  getFilterSummary,
} from '../../utils/DatingUtils';

type HomeNav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  onLogout: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onLogout }) => {
  const navigation = useNavigation<HomeNav>();

  // 하단 네비게이션 바 상태
  const [activeTab, setActiveTab] = useState('dating');

  // 데이팅 관련 상태
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
    navigation.navigate('MyPage');
  };

  // 하단바 탭 클릭 시 실행되는 함수
  const handleTabPress = (tabKey: string) => {
    console.log(`${tabKey} 탭 클릭됨`);
    setActiveTab(tabKey);

    // 각 탭별 동작 정의
    switch (tabKey) {
      case 'dating':
        console.log('소개팅 화면으로 이동');
        break;

      case 'meeting':
        console.log('미팅 화면으로 이동');
        Alert.alert('준비 중', '미팅 기능은 현재 개발 중입니다.');
        break;

      case 'interest':
        console.log('관심 화면으로 이동');
        Alert.alert('준비 중', '관심 기능은 현재 개발 중입니다.');
        break;

      case 'chat':
        console.log('채팅 화면으로 이동');
        Alert.alert('준비 중', '채팅 기능은 현재 개발 중입니다.');
        break;

      case 'mypage':
        console.log('마이페이지 화면으로 이동');
        goToMyPage();
        break;

      default:
        console.log('알 수 없는 탭');
        break;
    }
  };

  // 데이팅 관련 함수들
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

  // 현재 활성 탭에 따라 메인 콘텐츠 내용을 다르게 보여주는 함수
  const renderMainContent = () => {
    switch (activeTab) {
      case 'dating':
        return (
          <View style={styles.datingContent}>
            {/* 프로필 매칭 카드 */}
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

            {/* 연애관 매칭 카드 */}
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

            {/* 현재 필터 설정 표시 */}
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
        );

      case 'meeting':
        return (
          <View style={styles.centerContent}>
            <Text style={styles.welcomeText}>미팅</Text>
            <Text style={styles.description}>그룹 미팅으로 재미있게!</Text>
            <Text style={styles.comingSoon}>곧 출시 예정입니다</Text>
          </View>
        );

      case 'interest':
        return (
          <View style={styles.centerContent}>
            <Text style={styles.welcomeText}>관심</Text>
            <Text style={styles.description}>나에게 관심을 보인 사람들</Text>
            <Text style={styles.comingSoon}>곧 출시 예정입니다</Text>
          </View>
        );

      case 'chat':
        return (
          <View style={styles.centerContent}>
            <Text style={styles.welcomeText}>채팅</Text>
            <Text style={styles.description}>매칭된 상대와 대화하기</Text>
            <Text style={styles.comingSoon}>곧 출시 예정입니다</Text>
          </View>
        );

      case 'mypage':
        return (
          <View style={styles.centerContent}>
            <Text style={styles.welcomeText}>마이페이지</Text>
            <Text style={styles.description}>내 프로필 관리하기</Text>
            <TouchableOpacity style={styles.myPageButton} onPress={goToMyPage}>
              <Text style={styles.myPageButtonText}>마이 페이지로 이동</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return (
          <View style={styles.centerContent}>
            <Text style={styles.welcomeText}>환영합니다!</Text>
            <Text style={styles.description}>
              만나봄 앱에 성공적으로 로그인하셨습니다.
            </Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 헤더 영역 */}
      <View style={styles.header}>
        <Text style={styles.title}>만나봄</Text>
        <View style={styles.headerRight}>
          {/* 데이팅 탭일 때만 필터 버튼 표시 */}
          {activeTab === 'dating' && (
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setFilterModalVisible(true)}
            >
              <Text style={styles.filterButtonText}>⚙️</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>로그아웃</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 메인 콘텐츠 영역 - 하단바 공간을 위해 flex: 1 유지 */}
      <View style={styles.content}>
        {/* 활성 탭에 따라 다른 내용 표시 */}
        {renderMainContent()}
      </View>

      {/* 하단 네비게이션 바 */}
      <BottomNavigationBar activeTab={activeTab} onTabPress={handleTabPress} />

      {/* 데이팅 모달들 */}
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
  filterButtonText: {
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 15,
  },
  logoutButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  content: {
    flex: 1, // 중요: flex: 1로 남은 공간 모두 차지 (하단바 제외)
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // 중앙 정렬 콘텐츠 (기존 스타일)
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 10,
  },
  comingSoon: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
    marginTop: 10,
  },
  myPageButton: {
    marginTop: 24,
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
  },
  myPageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // 데이팅 전용 스타일
  datingContent: {
    flex: 1,
    gap: 20,
  },
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
  cardEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  romanceCard: {
    backgroundColor: '#FFF8F8',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFE8F1',
    padding: 25,
  },
  romanceCardContent: {
    alignItems: 'center',
  },
  romanceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  romanceSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 15,
  },
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
  filterChangeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default HomeScreen;
