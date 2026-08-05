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

export interface ProfileReportRequestDTO {
  /** 프로필 신고 API는 상대의 영구 profileId만 식별자로 받는다. */
  profileId: string;
  reason: ReportReason;
  additionalDetail?: string;
}

export interface ReportSubmissionResult {
  /** 신규 신고와 중복 신고 모두 서버가 동일한 문자열 ID를 반환한다. */
  reportId: string;
}
