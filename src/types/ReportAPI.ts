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

export interface UserReportRequestDTO {
  contextId: number;
  targetId: number;
  reason: ReportReason;
  additionalDetail: string;
}

export const toReportId = (value: unknown): number | null => {
  const trimmedValue = typeof value === 'string' ? value.trim() : '';
  const numericValue =
    typeof value === 'number'
      ? value
      : /^\d+$/.test(trimmedValue)
        ? Number(trimmedValue)
        : Number.NaN;

  return Number.isSafeInteger(numericValue) && numericValue > 0
    ? numericValue
    : null;
};
