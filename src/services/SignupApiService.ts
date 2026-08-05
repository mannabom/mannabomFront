import { PREPARED_SIGNUP_API_ENDPOINTS } from '../config/api';
import type {
  SignupCompleteRequestDto,
  SignupCompleteResponseDto,
  TermsAgreementRequestDto,
  TermsAgreementResponseDto,
  TermsApiTermType,
  TermsContentResponseDto,
} from '../types/SignupAPI';
import signupApiClient from './signupApiClient';

const buildTermsContentPath = (termType: TermsApiTermType): string =>
  PREPARED_SIGNUP_API_ENDPOINTS.TERMS_CONTENT.replace(
    '{termType}',
    encodeURIComponent(termType),
  );

/** 임시 signupToken으로 호출하는 회원가입 API 서비스입니다. */
class SignupApiService {
  async getTermsContent(
    termType: TermsApiTermType,
  ): Promise<TermsContentResponseDto> {
    const response = await signupApiClient.get<TermsContentResponseDto>(
      buildTermsContentPath(termType),
    );
    return response.data;
  }

  async agreeToTerms(
    request: TermsAgreementRequestDto,
  ): Promise<TermsAgreementResponseDto> {
    const response = await signupApiClient.post<TermsAgreementResponseDto>(
      PREPARED_SIGNUP_API_ENDPOINTS.TERMS_AGREEMENT,
      request,
    );
    return response.data;
  }

  async completeSignup(
    request: SignupCompleteRequestDto,
  ): Promise<SignupCompleteResponseDto> {
    const response = await signupApiClient.post<SignupCompleteResponseDto>(
      PREPARED_SIGNUP_API_ENDPOINTS.SIGNUP_COMPLETE,
      request,
    );
    return response.data;
  }
}

export const signupApiService = new SignupApiService();
