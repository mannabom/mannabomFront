export enum ReportReason {
  INAPPROPRIATE_PROFILE = 'INAPPROPRIATE_PROFILE',
  ABUSIVE_LANGUAGE = 'ABUSIVE_LANGUAGE',
  SPAM = 'SPAM',
  GHOSTING = 'GHOSTING',
  NO_SHOW = 'NO_SHOW',
  VIOLENT_LANGUAGE = 'VIOLENT_LANGUAGE',
  UNCOOPERATIVE = 'UNCOOPERATIVE',
  ETC = 'ETC',
}

export const REPORT_DETAIL_MAX_LENGTH = 1000;

export interface ChatReportRequestDTO {
  /** 채팅방 전체 신고이므로 messageId가 아닌 chatRoomId를 보낸다. */
  contextId: string;
  /** 신고 대상의 profileId가 아닌 userId를 보낸다. */
  targetId: string;
  reason: ReportReason;
  additionalDetail?: string;
}

export interface ReportSubmissionResult {
  /**
   * 백엔드 전환 기간에는 기존 200 응답에 reportId가 없을 수 있습니다.
   * 신규 응답이 배포되면 문자열 ID가 채워집니다.
   */
  reportId: string | null;
}
