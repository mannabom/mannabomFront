import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MyPage from './src/screens/MyPage/MyPage';
import ProfileDetail from './src/screens/MyPage/ProfileDetail';
import { RootStackParamList } from './src/navigation/types';
import { enableScreens } from 'react-native-screens';

const Stack = createNativeStackNavigator<RootStackParamList>();

enableScreens();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="MyPage"
          component={MyPage}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ProfileDetail"
          component={ProfileDetail}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
