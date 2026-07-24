export type AdminReportContextType = 'PROFILE' | 'CHAT';

export interface AdminReportListItemDTO {
  reportId: string;
  reportUserId: string;
  reportedUserId: string;
  contextType: AdminReportContextType;
  contextId: string;
  reason: string;
  additionalDetail?: string;
  createdAt: string;
}

export interface ReportListResponseDTO {
  success: boolean;
  data: AdminReportListItemDTO[];
  message: string;
}

export enum ReportActionEnum {
  DISMISS = 'DISMISS',
  WARN = 'WARN',
  BAN_USER = 'BAN_USER',
}

export interface AdminReportActionRequestDTO {
  reportId: string;
  action: ReportActionEnum;
  reason: string;
  targetUserId: string;
}
