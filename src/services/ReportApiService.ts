import { API_ENDPOINTS_LIST } from '../config/api';
import type { UserReportRequestDTO } from '../types/ReportAPI';
import apiClient from './apiClient';

class ReportApiService {
  private async submit(
    endpoint: string,
    request: UserReportRequestDTO,
  ): Promise<void> {
    const response = await apiClient.post(endpoint, request);
    if (response.status < 200 || response.status >= 300) {
      throw new Error('신고 요청에 실패했습니다.');
    }
  }

  async reportChat(request: UserReportRequestDTO): Promise<void> {
    await this.submit(API_ENDPOINTS_LIST.REPORT_CHAT, request);
  }

  async reportProfile(request: UserReportRequestDTO): Promise<void> {
    await this.submit(API_ENDPOINTS_LIST.REPORT_PROFILE, request);
  }
}

export const reportApiService = new ReportApiService();
