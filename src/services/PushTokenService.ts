// src/services/PushTokenService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import apiClient from './apiClient';

const DEVICE_TOKEN_ENDPOINT = '/api/device-tokens';

const STORAGE_DEVICE_TOKEN = 'deviceToken';
const STORAGE_LAST_SENT = 'deviceToken:lastSent';

let tokenRefreshUnsub: null | (() => void) = null;

export async function registerFcmTokenToServer(): Promise<string | null> {
  try {
    console.log('📌 [Push] registerFcmTokenToServer start');

    // RNFirebase 권장
    await messaging().registerDeviceForRemoteMessages();

    // (안드로이드는 권한 없어도 대체로 괜찮지만, 호출해도 문제 없음)
    await messaging().requestPermission().catch(() => {});

    const token = await messaging().getToken();
    console.log('✅ [Push] FCM TOKEN:', token);

    if (!token) {
      console.warn('⚠️ [Push] token is empty');
      return null;
    }

    // 앱 내부 저장 (MyPage 로그아웃에서 참조할 수도 있어서 유지)
    await AsyncStorage.setItem(STORAGE_DEVICE_TOKEN, token);

    // 같은 토큰이면 서버 재등록 스킵
    const lastSent = await AsyncStorage.getItem(STORAGE_LAST_SENT);
    if (lastSent === token) {
      console.log('⏭️ [Push] token unchanged, skip POST');
      return token;
    }

    // 서버 등록
    console.log('🌐 [Push] POST', DEVICE_TOKEN_ENDPOINT, { deviceToken: token });
    await apiClient.post(DEVICE_TOKEN_ENDPOINT, { deviceToken: token });

    await AsyncStorage.setItem(STORAGE_LAST_SENT, token);
    console.log('✅ [Push] device token upsert success');

    // 토큰 갱신 리스너는 1회만
    if (!tokenRefreshUnsub) {
      tokenRefreshUnsub = messaging().onTokenRefresh(async newToken => {
        try {
          console.log('🔄 [Push] onTokenRefresh:', newToken);

          await AsyncStorage.setItem(STORAGE_DEVICE_TOKEN, newToken);
          await apiClient.post(DEVICE_TOKEN_ENDPOINT, { deviceToken: newToken });
          await AsyncStorage.setItem(STORAGE_LAST_SENT, newToken);

          console.log('✅ [Push] refreshed token upsert success');
        } catch (e: any) {
          console.error(
            '❌ [Push] token refresh upsert failed:',
            e?.response?.data || e?.message || e,
          );
        }
      });
    }

    return token;
  } catch (e: any) {
    console.error(
      '❌ [Push] registerFcmTokenToServer failed:',
      e?.response?.data || e?.message || e,
    );
    return null;
  }
}
