import { Gender } from './KakaoAPI';

export type MeetingStatus = 'RECRUITING' | 'FULL' | 'MATCHING' | 'MATCHED';
export type MeetingSearchStatus = 'RECRUITING' | 'FASTMATCHING' | 'MATCHING';
export type MeetingType = 'GENERAL';

export interface MeetingRegion {
  sido: string;
  sigungu: string;
}

export interface MeetingAgeRange {
  min: number;
  max: number;
}

export interface MeetingMemberInfo {
  currentCount: number;
  maxCount: number;
}

export interface MeetingMemberPreview {
  userId: number;
  profileImage: string;
}

export interface MeetingTeamMember {
  userId: number;
  nickname: string;
  profileImage: string;
  leader: boolean;
}

export interface MeetingRoomSummary {
  roomId?: number;
  meetingId: number;
  meetingStatus: MeetingSearchStatus | string;
  roomName: string;
  region: MeetingRegion;
  memberInfo: MeetingMemberInfo;
  ageRangeDto: MeetingAgeRange;
  membersPreview: MeetingMemberPreview[];
}

export interface MyMeetingStatus {
  hasActiveRoom: boolean;
  roomId?: number;
  meetingId?: number;
  matchingStatus?: MeetingStatus;
  roomName?: string;
  roomCode?: string;
  gender?: Gender;
  region?: MeetingRegion;
  memberInfo?: MeetingMemberInfo;
  ageRangeDto?: MeetingAgeRange;
  teamMembers?: MeetingTeamMember[];
  leader?: boolean;
}

export interface MeetingChatRoomInfo {
  roomId: number;
  meetingId: number;
  matchingStatus: MeetingStatus;
  roomName: string;
  roomCode: string;
  gender: Gender;
  region: MeetingRegion;
  memberInfo: MeetingMemberInfo;
  ageRangeDto: MeetingAgeRange;
  teamMembers: MeetingTeamMember[];
  leader: boolean;
}

export interface MeetingMemberProfile {
  userId: number;
  profileImage: string;
  age: number;
  mbti: string;
  smokingHabit: string;
  drinkingHabit: string;
}

export interface MeetingFilterSettings {
  region: MeetingRegion;
  ageRange: MeetingAgeRange;
  memberCounts: number[];
}

export interface MeetingRoomsSearchRequest {
  region: MeetingRegion;
  ageRange: MeetingAgeRange;
  memberCounts: number[];
}

export interface MeetingRoomsSearchResult {
  nextCursor: string;
  hasNext: boolean;
  meetings: MeetingRoomSummary[];
}

export interface MeetingMemberProfilesResult {
  members: MeetingMemberProfile[];
}

export interface MeetingRoomCreateRequest {
  roomName: string;
  region: MeetingRegion;
  ageRange: MeetingAgeRange;
  maxMembers: number;
  meetingType: MeetingType;
}

export interface MeetingRoomJoinRequest {
  meetingId: number;
}

export interface MeetingRoomJoinByCodeRequest {
  roomCode: string;
}

export interface MeetingRoomLeaveRequest {
  roomId: number;
}

export interface MeetingRoomLeaveResult {
  left: boolean;
}

export interface MeetingEntryResult {
  creationCost?: number;
  pointsUsed?: number;
  remainingPoints: number;
  meetingChatRoomInfo: MeetingChatRoomInfo;
}

export interface MatchingStartRequest {
  roomId: string;
  gender: Gender;
  region: MeetingRegion;
  ageRange: MeetingAgeRange;
  memberCount: number;
}

export interface MatchingStartResult {
  matchingStarted: boolean;
  estimatedWaitTime: number;
}

export interface MatchingCancelRequest {
  roomId: string;
}

export interface MatchingCancelResult {
  cancelled: boolean;
  sseUnsubscribed: boolean;
}

export interface MatchingContinueRequest {
  roomId: string;
}

export interface MatchingContinueResult {
  continued: boolean;
  estimatedWaitTime?: number;
}

export interface MatchingResultMember {
  userId: number;
  nickname: string;
  age: number;
  profileImage: string;
  mbti: string;
  smokingHabit: string;
  drinkingHabit: string;
}

export interface MatchingResultData {
  matchId: string;
  opponentTeam: {
    roomId: string;
    roomName: string;
    members: MatchingResultMember[];
  };
  decisionDeadline: string;
}

export interface AcceptMatchRequest {
  matchId: string;
}

export interface RejectMatchRequest {
  matchId: string;
}

export type MatchDecisionStatus = 'WAITING' | 'COMPLETED';

export interface AcceptMatchResult {
  currentStatus: MatchDecisionStatus;
  data: {
    chatRoom?: {
      roomId: string;
      roomName: string;
      participants: {
        userId: number;
        nickname: string;
        profileImage: string;
      }[];
      matchInfo: {
        region: MeetingRegion;
        totalMembers: number;
        matchedAt: string;
      };
    };
    decisionDeadline: string;
  };
}

export interface RejectMatchResult {
  currentStatus: MatchDecisionStatus;
  data: {
    remainingRematches: number;
    canRematch: boolean;
  };
}

export interface MatchingStatusStreamEvent {
  type: 'MATCHING_STATUS';
  roomId: string;
  timestamp: string;
  eventId: string;
  data: {
    status: MeetingStatus;
    matchingDuration?: number;
    timeoutWarning?: boolean;
    estimatedWaitTime?: number;
  };
}

export interface MatchFoundStreamEvent {
  type: 'MATCH_FOUND';
  roomId: string;
  timestamp: string;
  eventId: string;
  data: {
    matchId: string;
    opponentTeam: {
      roomId: string;
      roomName: string;
      members: MatchingResultMember[];
    };
    decisionDeadline: string;
  };
}

export interface MatchingTimeoutStreamEvent {
  type: 'MATCHING_TIMEOUT';
  roomId: string;
  timestamp: string;
  eventId: string;
  data: {
    totalWaitTime: number;
    canContinue: boolean;
    remainingAttempts?: number;
  };
}

export interface DecisionResultStreamEvent {
  type: 'DECISION_RESULT';
  roomId: string;
  timestamp: string;
  eventId: string;
  data: {
    matchId: string;
    chatRoom?: {
      roomId: string;
      roomName: string;
      participants: {
        userId: number;
        nickname: string;
        profileImage: string;
      }[];
      matchInfo: {
        region: MeetingRegion;
        totalMembers: number;
        matchedAt: string;
      };
    };
    remainingRematches?: number;
    autoUnsubscribed: boolean;
  };
}

export type MeetingStreamEvent =
  | MatchingStatusStreamEvent
  | MatchFoundStreamEvent
  | MatchingTimeoutStreamEvent
  | DecisionResultStreamEvent;

export type MeetingStreamEventName =
  | 'matching-status'
  | 'match-found'
  | 'matching-timeout'
  | 'decision-result';

export interface MeetingStreamHandlers {
  onEvent?: (event: MeetingStreamEvent, eventName: MeetingStreamEventName) => void;
  onError?: (error: unknown) => void;
}
