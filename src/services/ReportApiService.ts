import { API_ENDPOINTS_LIST } from '../config/api';
import {
  REPORT_DETAIL_MAX_LENGTH,
  type ChatReportRequestDTO,
  type ReportSubmissionResult,
} from '../types/ReportAPI';
import { toExternalId } from '../utils/IdUtils';
import apiClient from './apiClient';

class ReportApiService {
  private normalizeRequest<T extends ChatReportRequestDTO>(
    request: T,
  ): T {
    const contextId = toExternalId(request.contextId);
    const targetId = toExternalId(request.targetId);
    const additionalDetail = request.additionalDetail?.trim();

    if (!contextId || !targetId) {
      throw new Error('신고 대상 식별자를 확인할 수 없습니다.');
    }
    if (
      additionalDetail &&
      additionalDetail.length > REPORT_DETAIL_MAX_LENGTH
    ) {
      throw new Error(
        `신고 상세 내용은 ${REPORT_DETAIL_MAX_LENGTH}자 이내로 입력해 주세요.`,
      );
    }

    return {
      ...request,
      contextId,
      targetId,
      ...(additionalDetail
        ? { additionalDetail }
        : { additionalDetail: undefined }),
    };
  }

  private parseResult(raw: any): ReportSubmissionResult {
    if (raw?.success === false) {
      throw new Error(String(raw?.message ?? '신고 요청에 실패했습니다.'));
    }

    const reportId = toExternalId(
      raw?.data?.reportId ??
        raw?.reportId ??
        raw?.data?.data?.reportId,
    );
    return { reportId };
  }

  private async submit(
    endpoint: string,
    request: ChatReportRequestDTO,
  ): Promise<ReportSubmissionResult> {
    const response = await apiClient.post(
      endpoint,
      this.normalizeRequest(request),
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
}

export const reportApiService = new ReportApiService();
