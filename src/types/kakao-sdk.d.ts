// src/types/kakao-sdk.d.ts
// @react-native-seoul/kakao-login의 타입 정의

declare module '@react-native-seoul/kakao-login' {
  export interface KakaoOAuthToken {
    accessToken: string;
    refreshToken: string;
    idToken?: string;
    accessTokenExpiresAt: Date;
    refreshTokenExpiresAt: Date;
    scopes?: string[];
  }

  export interface KakaoProfile {
    id: number;
    nickname?: string;
    profileImageUrl?: string;
    thumbnailImageUrl?: string;
    email?: string;
    ageRange?: string;
    birthday?: string;
    birthyear?: string;
    gender?: 'male' | 'female';
    isEmailValid?: boolean;
    isEmailVerified?: boolean;
    isKorean?: boolean;
    phoneNumber?: string;
    ci?: string;
    connectedAt?: Date;
    synchedAt?: Date;
  }

  export interface KakaoAccount {
    profileNeedsAgreement?: boolean;
    profile?: KakaoProfile;
    nameNeedsAgreement?: boolean;
    name?: string;
    emailNeedsAgreement?: boolean;
    isEmailValid?: boolean;
    isEmailVerified?: boolean;
    email?: string;
    ageRangeNeedsAgreement?: boolean;
    ageRange?: string;
    birthyearNeedsAgreement?: boolean;
    birthyear?: string;
    birthdayNeedsAgreement?: boolean;
    birthday?: string;
    birthdayType?: string;
    genderNeedsAgreement?: boolean;
    gender?: 'male' | 'female';
    phoneNumberNeedsAgreement?: boolean;
    phoneNumber?: string;
    ciNeedsAgreement?: boolean;
    ci?: string;
  }

  export function login(): Promise<KakaoOAuthToken>;
  export function logout(): Promise<string>;
  export function getProfile(): Promise<KakaoProfile>;
  export function unlink(): Promise<string>;
}
