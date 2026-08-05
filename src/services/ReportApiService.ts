import { API_ENDPOINTS_LIST } from '../config/api';
import {
  REPORT_DETAIL_MAX_LENGTH,
  type ChatReportRequestDTO,
  type ProfileReportRequestDTO,
  type ReportSubmissionResult,
} from '../types/ReportAPI';
import { requireExternalId, toExternalId } from '../utils/IdUtils';
import apiClient from './apiClient';

class ReportApiService {
  private normalizeDetail(additionalDetail?: string): string | undefined {
    const normalized = additionalDetail?.trim();
    if (normalized && normalized.length > REPORT_DETAIL_MAX_LENGTH) {
      throw new Error(
        `신고 상세 내용은 ${REPORT_DETAIL_MAX_LENGTH}자 이내로 입력해 주세요.`,
      );
    }
    return normalized || undefined;
  }

  private normalizeChatRequest(
    request: ChatReportRequestDTO,
  ): ChatReportRequestDTO {
    const contextId = toExternalId(request.contextId);
    const targetId = toExternalId(request.targetId);

    if (!contextId || !targetId) {
      throw new Error('신고 대상 식별자를 확인할 수 없습니다.');
    }

    return {
      ...request,
      contextId,
      targetId,
      additionalDetail: this.normalizeDetail(request.additionalDetail),
    };
  }

  private parseResult(raw: any): ReportSubmissionResult {
    if (raw?.success === false) {
      throw new Error(String(raw?.message ?? '신고 요청에 실패했습니다.'));
    }

    const reportId = requireExternalId(
      raw?.data?.reportId ??
        raw?.reportId ??
        raw?.data?.data?.reportId,
      '신고 ID',
    );
    return { reportId };
  }

  private async submit(
    endpoint: string,
    request: ChatReportRequestDTO,
  ): Promise<ReportSubmissionResult> {
    const response = await apiClient.post(
      endpoint,
      this.normalizeChatRequest(request),
    );
    if (response.status < 200 || response.status >= 300) {
      throw new Error('신고 요청에 실패했습니다.');
    }
    return this.parseResult(response.data);
  }

  async reportChat(
    request: ChatReportRequestDTO,
  ): Promise<ReportSubmissionResult> {
    return this.submit(API_ENDPOINTS_LIST.REPORT_CHAT, request);
  }

  async reportProfile(
    request: ProfileReportRequestDTO,
  ): Promise<ReportSubmissionResult> {
    const response = await apiClient.post(API_ENDPOINTS_LIST.REPORT_PROFILE, {
      ...request,
      profileId: requireExternalId(request.profileId, '프로필 ID'),
      additionalDetail: this.normalizeDetail(request.additionalDetail),
    });
    if (response.status < 200 || response.status >= 300) {
      throw new Error('신고 요청에 실패했습니다.');
    }
    return this.parseResult(response.data);
  }
}

export const reportApiService = new ReportApiService();
