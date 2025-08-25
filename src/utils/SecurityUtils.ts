// utils/SecurityUtils.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

export interface SecurityCheckResult {
  isValid: boolean;
  error?: string;
  requiresUpdate?: boolean;
}

export interface LoginInfo {
  isLoggedIn: boolean;
  token?: string;
  refreshToken?: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

// 보안 검사 클래스
export class SecurityManager {
  // 앱 무결성 검사
  static async checkAppIntegrity(): Promise<SecurityCheckResult> {
    try {
      // 디버그 모드 검사
      if (__DEV__) {
        console.log('개발 모드에서는 보안 검사를 건너뜁니다.');
        return { isValid: true };
      }

      // 루팅/탈옥 검사
      const isJailbroken = await this.checkJailbreak();
      if (isJailbroken) {
        return {
          isValid: false,
          error: '보안상 이유로 루팅/탈옥된 기기에서는 사용할 수 없습니다.',
        };
      }

      // 앱 서명 검증 (실제 구현 필요)
      const isSignatureValid = await this.verifyAppSignature();
      if (!isSignatureValid) {
        return {
          isValid: false,
          error: '앱 무결성 검증에 실패했습니다.',
        };
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: '보안 검사 중 오류가 발생했습니다.',
      };
    }
  }

  // 버전 검사
  static async checkAppVersion(): Promise<SecurityCheckResult> {
    try {
      const currentVersion = DeviceInfo.getVersion();

      // API에서 최신 버전 정보 가져오기
      const response = await fetch('https://api.mannabom.com/version/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentVersion,
          platform: Platform.OS,
        }),
      });

      const versionInfo = await response.json();

      if (versionInfo.forceUpdate) {
        return {
          isValid: false,
          requiresUpdate: true,
          error: '새 버전으로 업데이트가 필요합니다.',
        };
      }

      return { isValid: true };
    } catch (error) {
      // 네트워크 오류 등의 경우 앱 사용을 허용
      console.warn('버전 체크 실패:', error);
      return { isValid: true };
    }
  }

  // 루팅/탈옥 검사 (간단한 예시)
  private static async checkJailbreak(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        // iOS 탈옥 검사
        return await this.checkiOSJailbreak();
      } else {
        // Android 루팅 검사
        return await this.checkAndroidRoot();
      }
    } catch {
      return false; // 검사 실패시 안전하게 false 반환
    }
  }

  private static async checkiOSJailbreak(): Promise<boolean> {
    // iOS 탈옥 검사 로직 (라이브러리 사용 권장)
    // 예: react-native-jailbreak-detection
    return false; // 임시로 false 반환
  }

  private static async checkAndroidRoot(): Promise<boolean> {
    // Android 루팅 검사 로직 (라이브러리 사용 권장)
    // 예: react-native-root-detection
    return false; // 임시로 false 반환
  }

  private static async verifyAppSignature(): Promise<boolean> {
    // 앱 서명 검증 로직
    // 실제 구현시 네이티브 모듈 필요
    return true; // 임시로 true 반환
  }

  // 보안 오류 처리
  static handleSecurityError(result: SecurityCheckResult) {
    if (result.requiresUpdate) {
      Alert.alert(
        '업데이트 필요',
        result.error || '새 버전으로 업데이트해주세요.',
        [
          {
            text: '업데이트',
            onPress: () => {
              // 스토어로 이동
              this.redirectToStore();
            },
          },
        ],
        { cancelable: false },
      );
    } else {
      Alert.alert(
        '보안 오류',
        result.error || '보안 검사에 실패했습니다.',
        [{ text: '확인', onPress: () => {} }],
        { cancelable: false },
      );
    }
  }

  private static redirectToStore() {
    // 앱스토어/플레이스토어로 리디렉션
    // const storeURL = Platform.OS === 'ios'
    //   ? 'https://apps.apple.com/app/mannabom/id123456789'
    //   : 'https://play.google.com/store/apps/details?id=com.mannabom';

    // 실제 구현시: Linking.openURL(storeURL);
    console.log('스토어로 리디렉션');
  }
}

// 인증 관리 클래스
export class AuthManager {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly USER_INFO_KEY = 'user_info';

  // 로그인 정보 확인
  static async checkLoginStatus(): Promise<LoginInfo> {
    try {
      const token = await AsyncStorage.getItem(this.TOKEN_KEY);
      const refreshToken = await AsyncStorage.getItem(this.REFRESH_TOKEN_KEY);
      const userInfoStr = await AsyncStorage.getItem(this.USER_INFO_KEY);

      if (!token) {
        return { isLoggedIn: false };
      }

      // 토큰 유효성 검사
      const isTokenValid = await this.validateToken(token);

      if (isTokenValid) {
        const user = userInfoStr ? JSON.parse(userInfoStr) : undefined;
        return {
          isLoggedIn: true,
          token,
          refreshToken: refreshToken || undefined,
          user,
        };
      } else if (refreshToken) {
        // 토큰 갱신 시도
        const newTokens = await this.refreshTokens(refreshToken);
        if (newTokens) {
          await this.saveTokens(newTokens.accessToken, newTokens.refreshToken);
          const user = userInfoStr ? JSON.parse(userInfoStr) : undefined;
          return {
            isLoggedIn: true,
            token: newTokens.accessToken,
            refreshToken: newTokens.refreshToken,
            user,
          };
        }
      }

      // 토큰이 유효하지 않으면 로그아웃 처리
      await this.logout();
      return { isLoggedIn: false };
    } catch (error) {
      console.error('로그인 상태 확인 오류:', error);
      return { isLoggedIn: false };
    }
  }

  // 토큰 유효성 검증
  private static async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.mannabom.com/auth/validate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.status === 200;
    } catch {
      return false;
    }
  }

  // 토큰 갱신
  private static async refreshTokens(refreshToken: string) {
    try {
      const response = await fetch('https://api.mannabom.com/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.status === 200) {
        const data = await response.json();
        return {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        };
      }
    } catch (error) {
      console.error('토큰 갱신 실패:', error);
    }
    return null;
  }

  // 토큰 저장
  static async saveTokens(accessToken: string, refreshToken: string) {
    await Promise.all([
      AsyncStorage.setItem(this.TOKEN_KEY, accessToken),
      AsyncStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken),
    ]);
  }

  // 사용자 정보 저장
  static async saveUserInfo(user: any) {
    await AsyncStorage.setItem(this.USER_INFO_KEY, JSON.stringify(user));
  }

  // 로그아웃
  static async logout() {
    await Promise.all([
      AsyncStorage.removeItem(this.TOKEN_KEY),
      AsyncStorage.removeItem(this.REFRESH_TOKEN_KEY),
      AsyncStorage.removeItem(this.USER_INFO_KEY),
    ]);
  }

  // 자동 로그인 처리
  static async performAutoLogin(): Promise<boolean> {
    const loginInfo = await this.checkLoginStatus();

    if (loginInfo.isLoggedIn && loginInfo.token) {
      // 추가적인 자동 로그인 로직 (필요시)
      console.log('자동 로그인 성공:', loginInfo.user?.name);
      return true;
    }

    return false;
  }
}
