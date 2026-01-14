// src/navigation/MainTabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BottomNavigationBar from '../components/common/BottomNavigationBar';

import HomeScreen from '../screens/home/HomeScreen';
import MyPage from '../screens/MyPage/MyPage';

import { View, Text } from 'react-native';

export type MainTabParamList = {
  dating: undefined;
  meeting: undefined;
  interest: undefined;
  chat: undefined;
  mypage: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const Placeholder = ({ label }: { label: string }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>{label}</Text>
  </View>
);

interface MainTabNavigatorProps {
  onLogout: () => void;
}

export default function MainTabNavigator({ onLogout }: MainTabNavigatorProps) {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => {
        const activeKey = state.routeNames[state.index]; // 'dating' | ...
        return (
          <BottomNavigationBar
            activeTab={activeKey}
            onTabPress={(tabKey) => navigation.navigate(tabKey as any)}
          />
        );
      }}
    >
      {/* ✅ 소개팅 탭 = 기존 HomeScreen */}
      <Tab.Screen name="dating">
        {() => <HomeScreen onLogout={onLogout} />}
      </Tab.Screen>

      <Tab.Screen name="meeting">
        {() => <Placeholder label="미팅" />}
      </Tab.Screen>

      <Tab.Screen name="interest">
        {() => <Placeholder label="관심" />}
      </Tab.Screen>

      <Tab.Screen name="chat">
        {() => <Placeholder label="채팅" />}
      </Tab.Screen>

      <Tab.Screen name="mypage" component={MyPage} />
    </Tab.Navigator>
  );
}
