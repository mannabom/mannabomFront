// src/screens/store/StoreScreen.tsx
import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

const StoreScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.text}>스토어 화면</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 22, fontWeight: '900', color: '#111' },
});

export default StoreScreen;
