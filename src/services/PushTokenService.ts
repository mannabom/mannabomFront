// src/services/PushTokenService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import apiClient from './apiClient';

import notifee, { AndroidImportance, AuthorizationStatus } from '@notifee/react-native';

const DEVICE_TOKEN_ENDPOINT = '/api/device-tokens';

const STORAGE_DEVICE_TOKEN = 'deviceToken';
const STORAGE_LAST_SENT = 'deviceToken:lastSent';

const NOTIFEE_CHANNEL_ID = 'default';

let tokenRefreshUnsub: null | (() => void) = null;
let foregroundMsgUnsub: null | (() => void) = null;

let notifeeReady = false;

const tokenState = (token?: string | null) => (token ? `YES(len=${token.length})` : 'NO');

async function ensureNotifeeReady() {
  if (notifeeReady) return;

  try {
    const settings = await notifee.requestPermission();
    // Android 13+에서 알림 차단이면 여기서 status가 막혀있을 수 있음
    // (아래 debug 함수로도 확인 가능)

    await notifee.createChannel({
      id: NOTIFEE_CHANNEL_ID,
      name: 'Default',
      importance: AndroidImportance.HIGH,
    });

    notifeeReady = true;
  } catch (e) {
    if (__DEV__) console.warn('⚠️ [Push] ensureNotifeeReady failed (ignored):', e);
  }
}

function pickTitleBody(remoteMessage: any): { title: string; body: string } {
  const rawTitle =
    remoteMessage?.notification?.title ??
    remoteMessage?.data?.title ??
    remoteMessage?.data?.notificationTitle ??
    '알림';

  const rawBody =
    remoteMessage?.notification?.body ??
    remoteMessage?.data?.body ??
    remoteMessage?.data?.message ??
    remoteMessage?.data?.notificationBody ??
    '';

  return {
    title: String(rawTitle ?? '알림'),
    body: String(rawBody ?? ''),
  };
}

export async function showLocalNotificationFromRemoteMessage(remoteMessage: any) {
  const { title, body } = pickTitleBody(remoteMessage);
  await ensureNotifeeReady();

  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId: NOTIFEE_CHANNEL_ID,
      pressAction: { id: 'default' },
      // ⚠️ 어떤 기기에서 알림이 안 뜨고 로그에 icon 관련 에러 나면 주석 해제 필요
      // smallIcon: 'ic_notification',
    },
  });
}

/** ✅ 권한/상태 디버그용 */
export async function debugPushStatus() {
  try {
    const notifSettings = await notifee.getNotificationSettings();
    const perm =
      notifSettings.authorizationStatus === AuthorizationStatus.AUTHORIZED
        ? 'AUTHORIZED'
        : notifSettings.authorizationStatus === AuthorizationStatus.DENIED
        ? 'DENIED'
        : String(notifSettings.authorizationStatus);

    const lastSent = await AsyncStorage.getItem(STORAGE_LAST_SENT);
    const savedToken = await AsyncStorage.getItem(STORAGE_DEVICE_TOKEN);
    const fcmToken = await messaging().getToken().catch(() => null);

    if (__DEV__) {
      console.log('🧪 [PushDebug] notifee permission:', perm);
      console.log('🧪 [PushDebug] AsyncStorage lastSent:', tokenState(lastSent));
      console.log('🧪 [PushDebug] AsyncStorage savedToken:', tokenState(savedToken));
      console.log('🧪 [PushDebug] messaging getToken():', tokenState(fcmToken));
    }
  } catch (e) {
    if (__DEV__) console.warn('⚠️ [PushDebug] failed:', e);
  }
}

/** ✅ 서버에 FCM 토큰 등록 */
export async function registerFcmTokenToServer(opts?: { force?: boolean }): Promise<string | null> {
  const force = !!opts?.force;

  try {
    if (__DEV__) console.log('📌 [Push] registerFcmTokenToServer start', { force });

    await ensureNotifeeReady();

    await messaging().registerDeviceForRemoteMessages();
    await messaging().requestPermission().catch(() => {});

    const token = await messaging().getToken();
    if (__DEV__) console.log('✅ [Push] FCM token:', tokenState(token));

    if (!token) {
      if (__DEV__) console.warn('⚠️ [Push] token is empty');
      return null;
    }

    await AsyncStorage.setItem(STORAGE_DEVICE_TOKEN, token);

    const lastSent = await AsyncStorage.getItem(STORAGE_LAST_SENT);

    // ✅ 문제의 핵심: 로그인/계정변경/서버초기화 대비해서, 기본은 force로 POST 하자
    if (!force && lastSent === token) {
      if (__DEV__) console.log('⏭️ [Push] token unchanged, skip POST');
      return token;
    }

    if (__DEV__) console.log('🌐 [Push] POST', DEVICE_TOKEN_ENDPOINT, { deviceToken: tokenState(token) });
    await apiClient.post(DEVICE_TOKEN_ENDPOINT, { deviceToken: token });

    await AsyncStorage.setItem(STORAGE_LAST_SENT, token);
    if (__DEV__) console.log('✅ [Push] device token upsert success');

    return token;
  } catch (e: any) {
    if (__DEV__) console.warn('❌ [Push] registerFcmTokenToServer failed:', e?.response?.data || e?.message || e);
    return null;
  }
}

export function startTokenRefreshListener() {
  if (tokenRefreshUnsub) return;

  tokenRefreshUnsub = messaging().onTokenRefresh(async newToken => {
    try {
      if (__DEV__) console.log('🔄 [Push] onTokenRefresh:', tokenState(newToken));

      await AsyncStorage.setItem(STORAGE_DEVICE_TOKEN, newToken);

      await apiClient.post(DEVICE_TOKEN_ENDPOINT, { deviceToken: newToken });
      await AsyncStorage.setItem(STORAGE_LAST_SENT, newToken);

      if (__DEV__) console.log('✅ [Push] refreshed token upsert success');
    } catch (e: any) {
      if (__DEV__) console.warn('❌ [Push] token refresh upsert failed:', e?.response?.data || e?.message || e);
    }
  });
}

export function startForegroundNotificationListener() {
  if (foregroundMsgUnsub) return;

  if (__DEV__) console.log('📌 [Push] startForegroundNotificationListener');

  void ensureNotifeeReady();

  foregroundMsgUnsub = messaging().onMessage(async remoteMessage => {
    try {
      if (__DEV__) {
        console.log('🔔 [Push] onMessage (foreground):', {
          hasNotification: !!remoteMessage?.notification,
          dataKeys: remoteMessage?.data ? Object.keys(remoteMessage.data) : [],
        });
      }

      await showLocalNotificationFromRemoteMessage(remoteMessage);
    } catch (e) {
      if (__DEV__) console.warn('❌ [Push] foreground notification failed:', e);
    }
  });
}

export async function registerDeviceTokenAfterLogin() {
  const token = await registerFcmTokenToServer({ force: true }); // ✅ 로그인 직후는 강제
  if (token) startTokenRefreshListener();
  return token;
}

export function stopPushListeners() {
  if (tokenRefreshUnsub) {
    tokenRefreshUnsub();
    tokenRefreshUnsub = null;
  }
  if (foregroundMsgUnsub) {
    foregroundMsgUnsub();
    foregroundMsgUnsub = null;
  }
}

