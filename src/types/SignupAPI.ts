export interface ApiResponseDto<T> {
  success: boolean;
  data: T;
  message: string;
}

/**
 * 백엔드 약관 상세 조회 API가 현재 문서화한 값입니다.
 *
 * 화면에서 사용하는 `operation`, `payment`, `location`은 이 API enum에
 * 포함되지 않으므로 백엔드 계약이 확정되기 전에는 두 타입을 합치지 않습니다.
 */
export type TermsApiTermType = 'service' | 'privacy' | 'marketing';

export interface TermsContentDataDto {
  termType: TermsApiTermType;
  title: string;
  content: string;
  lastUpdated: string;
  required: boolean;
}

export type TermsContentResponseDto = ApiResponseDto<TermsContentDataDto>;

export interface TermsAgreementRequestDto {
  // 백엔드 wire key는 profileId지만 값은 임시 가입 진행 ID입니다.
  profileId: string;
  termsAgreement: {
    serviceTerms: boolean;
    privacyPolicy: boolean;
    marketingConsent: boolean;
  };
}

export interface TermsAgreementDataDto {
  agreed: boolean;
}

export type TermsAgreementResponseDto = ApiResponseDto<TermsAgreementDataDto>;

export interface SignupCompleteRequestDto {
  // 백엔드 wire key는 profileId지만 값은 임시 가입 진행 ID입니다.
  profileId: string;
}

export interface SignupCompleteDataDto {
  userId: string;
  accessToken: string;
  refreshToken: string;
  initialPoints: number;
}

export type SignupCompleteResponseDto = ApiResponseDto<SignupCompleteDataDto>;
