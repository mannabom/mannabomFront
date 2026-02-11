// src/screens/store/StoreScreen.tsx
import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { setSelectedGift } from '../../utils/GiftSelectionStore';

const StoreScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const pickMode = route.params?.pickGiftMode === true;

  const giftItems = [
    { giftId: 'g1', title: '비타오백', price: 500 },
    { giftId: 'g2', title: '커피쿠폰', price: 1200 },
    { giftId: 'g3', title: '초콜릿', price: 900 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {pickMode ? (
        <View style={styles.giftWrap}>
          <Text style={styles.title}>선물 선택</Text>
          {giftItems.map(item => (
            <TouchableOpacity
              key={item.giftId}
              style={styles.giftItem}
              onPress={() => {
                setSelectedGift(item);
                navigation.goBack();
              }}
            >
              <Text style={styles.giftTitle}>{item.title}</Text>
              <Text style={styles.giftPrice}>{item.price}팅</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.center}>
          <Text style={styles.text}>스토어 화면</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 22, fontWeight: '900', color: '#111' },
  giftWrap: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  title: { fontSize: 24, fontWeight: '900', color: '#101B4D', marginBottom: 20 },
  giftItem: {
    height: 58,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E2E2',
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
  },
  giftTitle: { fontSize: 16, fontWeight: '800', color: '#111' },
  giftPrice: { fontSize: 15, fontWeight: '900', color: '#E06385' },
});

export default StoreScreen;
