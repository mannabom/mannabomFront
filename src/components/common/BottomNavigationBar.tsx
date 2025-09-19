// src/components/common/BottomNavigationBar.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

interface TabItem {
  key: string;
  label: string;
  icon: string;
}

interface BottomNavigationBarProps {
  activeTab: string;
  onTabPress: (tabKey: string) => void;
}

const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({
  activeTab,
  onTabPress,
}) => {
  // 더 심플하고 깔끔한 아이콘들로 변경
  const tabs: TabItem[] = [
    { key: 'dating', label: '소개팅', icon: '♡' },
    { key: 'meeting', label: '미팅', icon: '👥' },
    { key: 'interest', label: '관심', icon: '♥' },
    { key: 'chat', label: '채팅', icon: '✉' },
    { key: 'mypage', label: '마이페이지', icon: '👤' },
  ];

  const renderTab = (tab: TabItem) => {
    const isActive = activeTab === tab.key;

    return (
      <TouchableOpacity
        key={tab.key}
        style={styles.tabItem}
        onPress={() => onTabPress(tab.key)}
        activeOpacity={0.6}
      >
        <View style={styles.tabContent}>
          {/* 아이콘 */}
          <Text
            style={[
              styles.icon,
              isActive ? styles.activeIcon : styles.inactiveIcon,
            ]}
          >
            {tab.icon}
          </Text>

          {/* 라벨 */}
          <Text
            style={[
              styles.label,
              isActive ? styles.activeLabel : styles.inactiveLabel,
            ]}
          >
            {tab.label}
          </Text>

          {/* 활성화된 탭 아래 핑크색 인디케이터 */}
          {isActive && <View style={styles.activeIndicator} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>{tabs.map(renderTab)}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingVertical: 12,
    paddingHorizontal: 8,
    height: 70,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  // 활성화된 탭 아이콘 (핑크색)
  activeIcon: {
    color: '#FF6B6B',
  },
  // 비활성화된 탭 아이콘 (회색)
  inactiveIcon: {
    color: '#C7C7CC',
  },
  label: {
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
  // 활성화된 탭 라벨 (핑크색)
  activeLabel: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  // 비활성화된 탭 라벨 (회색)
  inactiveLabel: {
    color: '#C7C7CC',
  },
  // 활성화된 탭 아래 핑크색 인디케이터 바
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 40,
    height: 3,
    backgroundColor: '#FF6B6B',
    borderRadius: 2,
  },
});

export default BottomNavigationBar;
