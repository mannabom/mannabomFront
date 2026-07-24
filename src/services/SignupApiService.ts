import { PREPARED_SIGNUP_API_ENDPOINTS } from '../config/api';
import type {
  SignupCompleteRequestDto,
  SignupCompleteResponseDto,
  TermsAgreementRequestDto,
  TermsAgreementResponseDto,
  TermsApiTermType,
  TermsContentResponseDto,
} from '../types/SignupAPI';
import apiClient from './apiClient';

const buildTermsContentPath = (termType: TermsApiTermType): string =>
  PREPARED_SIGNUP_API_ENDPOINTS.TERMS_CONTENT.replace(
    '{termType}',
    encodeURIComponent(termType),
  );

/**
 * 백엔드 구현 완료 후 화면에서 사용할 회원가입 API 서비스입니다.
 *
 * 아직 어떤 화면에서도 호출하지 않습니다.
 */
class SignupApiService {
  async getTermsContent(
    termType: TermsApiTermType,
  ): Promise<TermsContentResponseDto> {
    const response = await apiClient.get<TermsContentResponseDto>(
      buildTermsContentPath(termType),
    );
    return response.data;
  }

  async agreeToTerms(
    request: TermsAgreementRequestDto,
  ): Promise<TermsAgreementResponseDto> {
    const response = await apiClient.post<TermsAgreementResponseDto>(
      PREPARED_SIGNUP_API_ENDPOINTS.TERMS_AGREEMENT,
      request,
    );
    return response.data;
  }

  async completeSignup(
    request: SignupCompleteRequestDto,
  ): Promise<SignupCompleteResponseDto> {
    const response = await apiClient.post<SignupCompleteResponseDto>(
      PREPARED_SIGNUP_API_ENDPOINTS.SIGNUP_COMPLETE,
      request,
    );
    return response.data;
  }
}

export const signupApiService = new SignupApiService();
