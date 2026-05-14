// src/utils/SecurityUtils.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { API_BASE_URL } from '../config/api';
import { getAuthTokens, saveAuthTokens, clearAllAuth } from './AuthUtils';

// 로그인 정보 타입
export interface LoginInfo {
  isLoggedIn: boolean;
  token?: string;
  refreshToken?: string;
  user?: any;
}

// 보안 관련 유틸리티
export class SecurityManager {
  // 앱 버전 체크
  static async checkAppVersion(): Promise<boolean> {
    try {
      const currentVersion = DeviceInfo.getVersion();
      const buildNumber = DeviceInfo.getBuildNumber();

      if (__DEV__) console.log('📱 앱 버전:', currentVersion, '빌드:', buildNumber);

      // TODO: 서버에서 최소 지원 버전 가져와서 비교
      // 현재는 항상 true 반환
      return true;
    } catch (error) {
      if (__DEV__) console.warn('❌ 앱 버전 체크 오류:', error);
      return true;
    }
  }

  // 디바이스 정보 수집
  static async getDeviceInfo() {
    try {
      const deviceInfo = {
        deviceId: DeviceInfo.getDeviceId(),
        brand: DeviceInfo.getBrand(),
        model: DeviceInfo.getModel(),
        systemName: DeviceInfo.getSystemName(),
        systemVersion: DeviceInfo.getSystemVersion(),
        appVersion: DeviceInfo.getVersion(),
        buildNumber: DeviceInfo.getBuildNumber(),
        uniqueId: DeviceInfo.getUniqueId(),
        platform: Platform.OS,
      };

      if (__DEV__) console.log('📱 디바이스 정보 수집 완료');
      return deviceInfo;
    } catch (error) {
      if (__DEV__) console.warn('❌ 디바이스 정보 수집 오류:', error);
      return null;
    }
  }

  // 보안 경고 표시
  static showSecurityAlert(title: string, message: string) {
    Alert.alert(title, message, [{ text: '확인', style: 'default' }]);
  }

  // 탈옥/루팅 감지 (기본 구현)
  static async detectJailbreakOrRoot(): Promise<boolean> {
    try {
      // TODO: 실제 탈옥/루팅 감지 라이브러리 사용
      // 예: react-native-jailbreak-detect, react-native-root-detection
      return false;
    } catch (error) {
      if (__DEV__) console.warn('❌ 탈옥/루팅 감지 오류:', error);
      return false;
    }
  }

  // 개발자 모드 감지 (기본 구현)
  static async detectDeveloperMode(): Promise<boolean> {
    try {
      // TODO: 실제 개발자 모드 감지 구현
      return false;
    } catch (error) {
      if (__DEV__) console.warn('❌ 개발자 모드 감지 오류:', error);
      return false;
    }
  }
}

export class AuthManager {
  // ✅ 이제 토큰 저장/조회는 AuthUtils(accessToken/refreshToken)를 "단일 기준"으로 사용합니다.
  // (과거 키 auth_token / refresh_token 는 1회 마이그레이션 후 제거)
  private static readonly LEGACY_ACCESS_TOKEN_KEY = 'auth_token';
  private static readonly LEGACY_REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly USER_INFO_KEY = 'user_info';

  // ✅ legacy 키 -> 신규 키 마이그레이션 (한 번만)
  private static async migrateLegacyTokensIfNeeded() {
    const { accessToken, refreshToken } = await getAuthTokens();
    if (accessToken || refreshToken) return; // 이미 신규 키에 있으면 끝

    const legacyAccess = await AsyncStorage.getItem(this.LEGACY_ACCESS_TOKEN_KEY);
    const legacyRefresh = await AsyncStorage.getItem(this.LEGACY_REFRESH_TOKEN_KEY);

    if (legacyAccess && legacyRefresh) {
      if (__DEV__) console.log('🔁 [Auth] legacy 토큰 발견 -> 신규 키로 마이그레이션');
      await saveAuthTokens(legacyAccess, legacyRefresh);
      await AsyncStorage.multiRemove([
        this.LEGACY_ACCESS_TOKEN_KEY,
        this.LEGACY_REFRESH_TOKEN_KEY,
      ]);
    }
  }

  // ✅ (호환용) 토큰 저장 API — 기존 코드가 saveTokens를 호출해도 안전
  static async saveTokens(accessToken: string, refreshToken: string) {
    await saveAuthTokens(accessToken, refreshToken);
  }

  // 로그인 정보 확인 (앱 시작 시 자동로그인용)
  static async checkLoginStatus(): Promise<LoginInfo> {
    try {
      // 0) legacy -> 신규 키로 1회 마이그레이션
      await this.migrateLegacyTokensIfNeeded();

      // 1) 신규 키에서 토큰 조회
      let { accessToken, refreshToken } = await getAuthTokens();

      if (!accessToken || !refreshToken) {
        return { isLoggedIn: false };
      }

      // 2) 시작할 때 refreshToken으로 accessToken 갱신 시도 (가장 안전)
      const refreshed = await this.refreshTokens(refreshToken);
      if (refreshed?.accessToken && refreshed?.refreshToken) {
        await saveAuthTokens(refreshed.accessToken, refreshed.refreshToken);
        accessToken = refreshed.accessToken;
        refreshToken = refreshed.refreshToken;
        if (__DEV__) console.log('✅ [Auth] 자동로그인: 토큰 갱신 성공');
      } else {
        // refresh 실패면 안전하게 로그아웃 처리 (서버/토큰 상태 불명확)
        if (__DEV__) console.warn('⚠️ [Auth] 자동로그인: 토큰 갱신 실패 -> 로그아웃 처리');
        await this.logout();
        return { isLoggedIn: false };
      }

      const userInfoStr = await AsyncStorage.getItem(this.USER_INFO_KEY);
      const user = userInfoStr ? JSON.parse(userInfoStr) : undefined;

      return {
        isLoggedIn: true,
        token: accessToken,
        refreshToken: refreshToken || undefined,
        user,
      };
    } catch (error) {
      if (__DEV__) console.warn('❌ [Auth] 로그인 상태 확인 오류:', error);
      return { isLoggedIn: false };
    }
  }

  // 토큰 갱신 (refreshToken만 사용)
  private static async refreshTokens(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  } | null> {
    // ✅ 백에서 준 스펙: POST /api/auth/refresh  { refreshToken }
    const candidates = [
      `${API_BASE_URL}/api/auth/refresh`,
      `${API_BASE_URL}/auth/refresh`, // 혹시 기존 서버가 이 경로면 fallback
    ];

    for (const url of candidates) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        // 404/405면 다음 후보로
        if (res.status === 404 || res.status === 405) continue;

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          if (__DEV__) console.warn('⚠️ [Auth] refresh 실패:', res.status, url);
          return null;
        }

        const json: any = await res.json().catch(() => ({}));
        // 응답 형태가 {data:{...}} 일 수도, 최상단일 수도 있어서 둘 다 대응
        const nextAccess = json?.data?.accessToken ?? json?.accessToken;
        const nextRefresh = json?.data?.refreshToken ?? json?.refreshToken;

        if (typeof nextAccess === 'string' && typeof nextRefresh === 'string') {
          return { accessToken: nextAccess, refreshToken: nextRefresh };
        }

        if (__DEV__) console.warn('⚠️ [Auth] refresh 응답 파싱 실패');
        return null;
      } catch (e) {
        if (__DEV__) console.warn('⚠️ [Auth] refresh 네트워크 오류:', url, e);
        // 다음 후보로
      }
    }

    return null;
  }

  // 사용자 정보 저장 (필요하면 계속 사용)
  static async saveUserInfo(user: any) {
    await AsyncStorage.setItem(this.USER_INFO_KEY, JSON.stringify(user));
  }

  // 로그아웃: 신규 키 + legacy 키 + user_info 정리
  static async logout() {
    await clearAllAuth();
    await AsyncStorage.multiRemove([
      this.LEGACY_ACCESS_TOKEN_KEY,
      this.LEGACY_REFRESH_TOKEN_KEY,
      this.USER_INFO_KEY,
    ]);
  }

  // 자동 로그인 처리
  static async performAutoLogin(): Promise<boolean> {
    const loginInfo = await this.checkLoginStatus();
    if (loginInfo.isLoggedIn && loginInfo.token) {
      if (__DEV__) console.log('✅ [Auth] 자동 로그인 성공');
      return true;
    }
    return false;
  }
}
