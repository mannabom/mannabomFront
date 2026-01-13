// src/components/common/BottomNavigationBar.tsx
import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  ImageSourcePropType,
} from 'react-native';

interface NavigationItem {
  key: string;
  label: string;
  activeImage: ImageSourcePropType;
  inactiveImage: ImageSourcePropType;
}

interface BottomNavigationBarProps {
  activeTab: string;
  onTabPress: (tabKey: string) => void;
}

// 네비게이션 아이템 설정
const navigationItems: NavigationItem[] = [
  {
    key: 'dating',
    label: '소개팅',
    activeImage: require('../../assets/images/navigation/ic_dating_on.png'),
    inactiveImage: require('../../assets/images/navigation/ic_dating_off.png'),
  },
  {
    key: 'meeting',
    label: '미팅',
    activeImage: require('../../assets/images/navigation/ic_meeting_on.png'),
    inactiveImage: require('../../assets/images/navigation/ic_meeting_off.png'),
  },
  {
    key: 'interest',
    label: '관심',
    activeImage: require('../../assets/images/navigation/ic_interest_on.png'),
    inactiveImage: require('../../assets/images/navigation/ic_interest_off.png'),
  },
  {
    key: 'chat',
    label: '채팅',
    activeImage: require('../../assets/images/navigation/ic_chat_on.png'),
    inactiveImage: require('../../assets/images/navigation/ic_chat_off.png'),
  },
  {
    key: 'mypage',
    label: '마이페이지',
    activeImage: require('../../assets/images/navigation/ic_mypage_on.png'),
    inactiveImage: require('../../assets/images/navigation/ic_mypage_off.png'),
  },
];

const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({
  activeTab,
  onTabPress,
}) => {
  return (
    <View style={styles.container}>
      {navigationItems.map(item => {
        const isActive = activeTab === item.key;

        return (
          <TouchableOpacity
            key={item.key}
            style={styles.tab}
            onPress={() => onTabPress(item.key)}
            activeOpacity={0.7}
          >
            <Image
              source={isActive ? item.activeImage : item.inactiveImage}
              style={[styles.icon, isActive && styles.activeIcon]}
              resizeMode="contain"
            />
            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    paddingBottom: 10, // 아이폰 하단 안전영역 대응
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  icon: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  activeIcon: {
    // 활성 상태일 때 아이콘 크기 살짝 키우기 (선택사항)
    width: 26,
    height: 26,
  },
  label: {
    fontSize: 11,
    color: '#999999',
    fontWeight: '500',
  },
  activeLabel: {
    color: '#FF6B6B', // 핑크색 텍스트
    fontWeight: '700',
  },
});

export default BottomNavigationBar;
