import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // ← 변경된 부분
import MyPage from './src/screens/MyPage/MyPage';

function App() {
  return (
    <SafeAreaView style={styles.container}>
      <MyPage />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default App;
