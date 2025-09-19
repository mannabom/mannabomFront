// src/screens/HomeScreen.tsx
import React, { useState } from 'react'; // ✅ 추가: useState import (탭 상태 관리용)
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import BottomNavigationBar from '../../components/common/BottomNavigationBar'; // ✅ 추가: 하단바 컴포넌트 import

type HomeNav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  onLogout: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onLogout }) => {
  const navigation = useNavigation<HomeNav>();

  // ✅ 추가: 현재 활성화된 탭을 관리하는 state (기본값: 'dating')
  const [activeTab, setActiveTab] = useState('dating');

  const handleLogout = () => {
    console.log('로그아웃 처리');
    onLogout();
  };

  const goToMyPage = () => {
    navigation.navigate('MyPage');
  };

  // ✅ 추가: 하단바 탭 클릭 시 실행되는 함수
  const handleTabPress = (tabKey: string) => {
    console.log(`${tabKey} 탭 클릭됨`); // 디버깅용 로그

    // 현재 활성 탭 업데이트 (UI에서 선택된 탭 색상 변경)
    setActiveTab(tabKey);

    // 각 탭별 동작 정의
    switch (tabKey) {
      case 'dating':
        console.log('소개팅 화면으로 이동');
        // TODO: 나중에 소개팅 화면으로 네비게이션 추가
        // navigation.navigate('Dating');
        break;

      case 'meeting':
        console.log('미팅 화면으로 이동');
        // TODO: 나중에 미팅 화면으로 네비게이션 추가
        // navigation.navigate('Meeting');
        break;

      case 'interest':
        console.log('관심 화면으로 이동');
        // TODO: 나중에 관심 화면으로 네비게이션 추가
        // navigation.navigate('Interest');
        break;

      case 'chat':
        console.log('채팅 화면으로 이동');
        // TODO: 나중에 채팅 화면으로 네비게이션 추가
        // navigation.navigate('Chat');
        break;

      case 'mypage':
        console.log('마이페이지 화면으로 이동');
        // 기존 마이페이지 이동 함수 재사용
        goToMyPage();
        break;

      default:
        console.log('알 수 없는 탭');
        break;
    }
  };

  // ✅ 추가: 현재 활성 탭에 따라 메인 콘텐츠 내용을 다르게 보여주는 함수
  const renderMainContent = () => {
    switch (activeTab) {
      case 'dating':
        return (
          <>
            <Text style={styles.welcomeText}>소개팅</Text>
            <Text style={styles.description}>새로운 인연을 만나보세요!</Text>
          </>
        );

      case 'meeting':
        return (
          <>
            <Text style={styles.welcomeText}>미팅</Text>
            <Text style={styles.description}>그룹 미팅으로 재미있게!</Text>
          </>
        );

      case 'interest':
        return (
          <>
            <Text style={styles.welcomeText}>관심</Text>
            <Text style={styles.description}>나에게 관심을 보인 사람들</Text>
          </>
        );

      case 'chat':
        return (
          <>
            <Text style={styles.welcomeText}>채팅</Text>
            <Text style={styles.description}>매칭된 상대와 대화하기</Text>
          </>
        );

      case 'mypage':
        return (
          <>
            <Text style={styles.welcomeText}>마이페이지</Text>
            <Text style={styles.description}>내 프로필 관리하기</Text>
            {/* 기존 마이페이지 버튼 유지 */}
            <TouchableOpacity style={styles.myPageButton} onPress={goToMyPage}>
              <Text style={styles.myPageButtonText}>마이 페이지로 이동</Text>
            </TouchableOpacity>
          </>
        );

      default:
        return (
          <>
            <Text style={styles.welcomeText}>환영합니다!</Text>
            <Text style={styles.description}>
              만나봄 앱에 성공적으로 로그인하셨습니다.
            </Text>
          </>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 헤더 영역 (기존과 동일) */}
      <View style={styles.header}>
        <Text style={styles.title}>만나봄</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      {/* ✅ 수정: 메인 콘텐츠 영역 - 하단바 공간을 위해 flex: 1 유지 */}
      <View style={styles.content}>
        {/* 활성 탭에 따라 다른 내용 표시 */}
        {renderMainContent()}
      </View>

      {/* ✅ 추가: 하단 네비게이션 바 */}
      {/* 
        - activeTab: 현재 선택된 탭 (분홍색으로 강조 표시)
        - onTabPress: 탭 클릭 시 실행될 함수 전달
        - 하단바는 SafeAreaView 내부 최하단에 위치
      */}
      <BottomNavigationBar activeTab={activeTab} onTabPress={handleTabPress} />
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
  logoutButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 15,
  },
  logoutButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  content: {
    flex: 1, // ✅ 중요: flex: 1로 남은 공간 모두 차지 (하단바 제외)
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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
});

export default HomeScreen;
