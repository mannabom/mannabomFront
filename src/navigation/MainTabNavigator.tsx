// src/navigation/MainTabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BottomNavigationBar from '../components/common/BottomNavigationBar';

import BlindDateScreen from '../screens/home/BlindDateScreen';
import MeetingScreen from '../screens/home/MeetingScreen';
import MyPage from '../screens/MyPage/MyPage';
import InterestScreen from '../screens/interest/InterestScreen';

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
        const activeKey = state.routeNames[state.index];
        return (
          <BottomNavigationBar
            activeTab={activeKey}
            onTabPress={tabKey => navigation.navigate(tabKey as any)}
          />
        );
      }}
    >
      {/* ✅ 소개팅 탭 = BlindDateScreen */}
      <Tab.Screen name="dating">
        {() => <BlindDateScreen onLogout={onLogout} />}
      </Tab.Screen>

      <Tab.Screen name="meeting">
        {() => <MeetingScreen />}
      </Tab.Screen>

      <Tab.Screen name="interest">
        {() => <InterestScreen />}
      </Tab.Screen>

      <Tab.Screen name="chat">
        {() => <Placeholder label="채팅" />}
      </Tab.Screen>

      <Tab.Screen name="mypage">
        {() => <MyPage onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
