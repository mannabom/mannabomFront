import { ReportReason } from '../types/ReportAPI';

export const REPORT_REASON_OPTIONS: ReadonlyArray<{
  value: ReportReason;
  label: string;
}> = [
  {
    value: ReportReason.INAPPROPRIATE_PROFILE,
    label: '부적절한 프로필',
  },
  {
    value: ReportReason.ABUSIVE_LANGUAGE,
    label: '욕설 및 모욕',
  },
  {
    value: ReportReason.SPAM,
    label: '스팸 및 광고',
  },
  {
    value: ReportReason.GHOSTING,
    label: '연락 두절',
  },
  {
    value: ReportReason.NO_SHOW,
    label: '약속 불참',
  },
  {
    value: ReportReason.VIOLENT_LANGUAGE,
    label: '폭력적이거나 위협적인 언어',
  },
  {
    value: ReportReason.UNCOOPERATIVE,
    label: '비협조적인 행동',
  },
  {
    value: ReportReason.ETC,
    label: '기타',
  },
];
