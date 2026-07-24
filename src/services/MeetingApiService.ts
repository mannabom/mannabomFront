import {
  API_ENDPOINTS_LIST,
  getApiUrl,
  getApiUrlWithParams,
} from '../config/api';
import {
  AcceptMatchRequest,
  AcceptMatchResult,
  MatchingCancelRequest,
  MatchingCancelResult,
  MatchingContinueRequest,
  MatchingContinueResult,
  MatchingResultData,
  MatchingStartRequest,
  MatchingStartResult,
  MeetingChatRoomInfo,
  MeetingEntryResult,
  MeetingMemberProfile,
  MeetingMemberProfilesResult,
  MeetingRoomCreateRequest,
  MeetingRoomJoinByCodeRequest,
  MeetingRoomJoinRequest,
  MeetingRoomLeaveRequest,
  MeetingRoomLeaveResult,
  MeetingRoomSummary,
  MeetingRoomsSearchRequest,
  MeetingRoomsSearchResult,
  MeetingStreamEvent,
  MeetingStreamEventName,
  MeetingStreamHandlers,
  MeetingSearchStatus,
  MeetingStatus,
  MeetingTeamMember,
  MyMeetingStatus,
  RejectMatchRequest,
  RejectMatchResult,
} from '../types/MeetingAPI';
import { Gender } from '../types/KakaoAPI';
import { getAuthTokens } from '../utils/AuthUtils';
import apiClient from './apiClient';

const toNumber = (value: any, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const toStringValue = (value: any, fallback = '') =>
  typeof value === 'string' ? value : fallback;

const normalizeTeamMember = (raw: any): MeetingTeamMember => ({
  userId: toNumber(raw?.userId ?? raw?.id),
  nickname: toStringValue(raw?.nickname ?? raw?.nickName, '팀원'),
  profileImage: toStringValue(raw?.profileImage ?? raw?.profileImageUrl),
  leader: Boolean(raw?.leader ?? raw?.isLeader),
});

const normalizeChatRoomInfo = (raw: any): MeetingChatRoomInfo => {
  const rawTeamMembers = Array.isArray(raw?.teamMembers)
    ? raw.teamMembers
    : Array.isArray(raw?.teamMember)
    ? raw.teamMember
    : [];

  return {
    roomId: toNumber(raw?.roomId),
    meetingId: toNumber(raw?.meetingId),
    matchingStatus: String(
      raw?.matchingStatus ?? raw?.meetingStatus ?? 'RECRUITING',
    ) as MeetingStatus,
    roomName: toStringValue(raw?.roomName, '미팅 방'),
    roomCode: toStringValue(raw?.roomCode),
    gender: String(raw?.gender ?? Gender.OTHER) as Gender,
    region: {
      sido: toStringValue(raw?.region?.sido),
      sigungu: toStringValue(raw?.region?.sigungu),
    },
    memberInfo: {
      currentCount: toNumber(raw?.memberInfo?.currentCount),
      maxCount: toNumber(raw?.memberInfo?.maxCount),
    },
    ageRangeDto: {
      min: toNumber(raw?.ageRangeDto?.min),
      max: toNumber(raw?.ageRangeDto?.max),
    },
    teamMembers: rawTeamMembers.map(normalizeTeamMember),
    leader: Boolean(raw?.leader ?? raw?.isLeader),
  };
};

const normalizeRoomSummary = (raw: any): MeetingRoomSummary => ({
  roomId:
    raw?.roomId === undefined || raw?.roomId === null
      ? undefined
      : toNumber(raw?.roomId),
  meetingId: toNumber(raw?.meetingId),
  meetingStatus: String(
    raw?.meetingStatus ?? 'RECRUITING',
  ) as MeetingSearchStatus,
  roomName: toStringValue(raw?.roomName, '미팅 방'),
  region: {
    sido: toStringValue(raw?.region?.sido),
    sigungu: toStringValue(raw?.region?.sigungu),
  },
  memberInfo: {
    currentCount: toNumber(raw?.memberInfo?.currentCount),
    maxCount: toNumber(raw?.memberInfo?.maxCount),
  },
  ageRangeDto: {
    min: toNumber(raw?.ageRangeDto?.min),
    max: toNumber(raw?.ageRangeDto?.max),
  },
  membersPreview: Array.isArray(raw?.membersPreview)
    ? raw.membersPreview.map((member: any) => ({
        userId: toNumber(member?.userId ?? member?.id),
        profileImage: toStringValue(
          member?.profileImage ?? member?.profileImageUrl,
        ),
      }))
    : [],
});

const STREAM_EVENT_TYPE: Record<
  MeetingStreamEventName,
  MeetingStreamEvent['type']
> = {
  'matching-status': 'MATCHING_STATUS',
  'match-found': 'MATCH_FOUND',
  'matching-timeout': 'MATCHING_TIMEOUT',
  'decision-result': 'DECISION_RESULT',
};

const parseStreamPayload = (
  value: string,
  eventName: MeetingStreamEventName,
): MeetingStreamEvent | null => {
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      ...parsed,
      type: STREAM_EVENT_TYPE[eventName],
    } as MeetingStreamEvent;
  } catch {
    return null;
  }
};

class MeetingApiService {
  private unwrap<T>(raw: any): T {
    return (raw?.data ?? raw) as T;
  }

  async getMyStatus(): Promise<MyMeetingStatus> {
    const response = await apiClient.get(API_ENDPOINTS_LIST.MEETING_MY_STATUS);
    const data = this.unwrap<any>(response.data);

    if (!data?.hasActiveRoom) {
      return { hasActiveRoom: false };
    }

    const normalized = normalizeChatRoomInfo(data);

    return {
      hasActiveRoom: true,
      roomId: normalized.roomId,
      meetingId: normalized.meetingId,
      matchingStatus: normalized.matchingStatus,
      roomName: normalized.roomName,
      roomCode: normalized.roomCode,
      gender: normalized.gender,
      region: normalized.region,
      memberInfo: normalized.memberInfo,
      ageRangeDto: normalized.ageRangeDto,
      teamMembers: normalized.teamMembers,
      leader: normalized.leader,
    };
  }

  async searchRooms(
    payload: MeetingRoomsSearchRequest,
  ): Promise<MeetingRoomsSearchResult> {
    const response = await apiClient.post(
      API_ENDPOINTS_LIST.MEETING_ROOMS_SEARCH,
      payload,
    );
    const data = this.unwrap<any>(response.data);

    return {
      nextCursor: toStringValue(data?.nextCursor),
      hasNext: Boolean(data?.hasNext),
      meetings: Array.isArray(data?.meetings)
        ? data.meetings.map(normalizeRoomSummary)
        : [],
    };
  }

  async getMemberProfiles(
    roomId: number,
  ): Promise<MeetingMemberProfilesResult> {
    const response = await apiClient.get(
      getApiUrlWithParams(API_ENDPOINTS_LIST.MEETING_MEMBER_PROFILES, {
        roomId: String(roomId),
      }),
    );
    const data = this.unwrap<any>(response.data);

    return {
      members: Array.isArray(data?.members)
        ? data.members.map(
            (member: any): MeetingMemberProfile => ({
              userId: toNumber(member?.userId ?? member?.id),
              profileImage: toStringValue(
                member?.profileImage ?? member?.profileImageUrl,
              ),
              age: toNumber(member?.age),
              mbti: toStringValue(member?.mbti),
              smokingHabit: toStringValue(member?.smokingHabit),
              drinkingHabit: toStringValue(member?.drinkingHabit),
            }),
          )
        : [],
    };
  }

  async createRoom(
    payload: MeetingRoomCreateRequest,
  ): Promise<MeetingEntryResult> {
    const response = await apiClient.post(
      API_ENDPOINTS_LIST.MEETING_ROOM_CREATE,
      payload,
    );
    const data = this.unwrap<any>(response.data);

    return {
      creationCost:
        data?.creationCost === undefined
          ? undefined
          : toNumber(data?.creationCost),
      remainingPoints: toNumber(data?.remainingPoints),
      meetingChatRoomInfo: normalizeChatRoomInfo(
        data?.meetingChatRoomInfo ?? data?.chatRoomInfo ?? data,
      ),
    };
  }

  async joinRoom(payload: MeetingRoomJoinRequest): Promise<MeetingEntryResult> {
    const response = await apiClient.post(
      API_ENDPOINTS_LIST.MEETING_ROOM_JOIN,
      payload,
    );
    const data = this.unwrap<any>(response.data);

    return {
      pointsUsed:
        data?.pointsUsed === undefined ? undefined : toNumber(data?.pointsUsed),
      remainingPoints: toNumber(data?.remainingPoints),
      meetingChatRoomInfo: normalizeChatRoomInfo(
        data?.meetingChatRoomInfo ?? data?.chatRoomInfo ?? data,
      ),
    };
  }

  async joinRoomByCode(
    payload: MeetingRoomJoinByCodeRequest,
  ): Promise<MeetingEntryResult> {
    const response = await apiClient.post(
      API_ENDPOINTS_LIST.MEETING_ROOM_JOIN_BY_CODE,
      payload,
    );
    const data = this.unwrap<any>(response.data);

    return {
      pointsUsed:
        data?.pointsUsed === undefined ? undefined : toNumber(data?.pointsUsed),
      remainingPoints: toNumber(data?.remainingPoints),
      meetingChatRoomInfo: normalizeChatRoomInfo(
        data?.meetingChatRoomInfo ?? data?.chatRoomInfo ?? data,
      ),
    };
  }

  async leaveRoom(
    payload: MeetingRoomLeaveRequest,
  ): Promise<MeetingRoomLeaveResult> {
    const response = await apiClient.post(
      API_ENDPOINTS_LIST.MEETING_ROOM_LEAVE,
      payload,
    );
    return this.unwrap<MeetingRoomLeaveResult>(response.data);
  }

  async startMatching(
    payload: MatchingStartRequest,
  ): Promise<MatchingStartResult> {
    const response = await apiClient.post(
      API_ENDPOINTS_LIST.MEETING_MATCHING_START,
      payload,
    );
    return this.unwrap<MatchingStartResult>(response.data);
  }

  async cancelMatching(
    payload: MatchingCancelRequest,
  ): Promise<MatchingCancelResult> {
    const response = await apiClient.post(
      API_ENDPOINTS_LIST.MEETING_MATCHING_CANCEL,
      payload,
    );
    return this.unwrap<MatchingCancelResult>(response.data);
  }

  async continueMatching(
    payload: MatchingContinueRequest,
  ): Promise<MatchingContinueResult> {
    const response = await apiClient.post(
      API_ENDPOINTS_LIST.MEETING_MATCHING_CONTINUE,
      payload,
    );
    return this.unwrap<MatchingContinueResult>(response.data);
  }

  getEventsStreamUrl(roomId: string): string {
    const query = new URLSearchParams({ roomId }).toString();
    return `${getApiUrl(API_ENDPOINTS_LIST.MEETING_EVENTS_STREAM)}?${query}`;
  }

  async subscribeToMatchingEvents(
    roomId: string,
    handlers: MeetingStreamHandlers,
  ): Promise<() => void> {
    const EventSourceConstructor = (globalThis as any).EventSource;

    if (!EventSourceConstructor) {
      throw new Error(
        'EventSource is not available. Install a React Native EventSource/SSE polyfill before subscribing.',
      );
    }

    const { accessToken } = await getAuthTokens();
    const source = new EventSourceConstructor(this.getEventsStreamUrl(roomId), {
      headers: {
        Accept: 'text/event-stream',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    });

    const eventNames: MeetingStreamEventName[] = [
      'matching-status',
      'match-found',
      'matching-timeout',
      'decision-result',
    ];

    eventNames.forEach(eventName => {
      source.addEventListener(eventName, (event: any) => {
        const parsed = parseStreamPayload(event?.data, eventName);
        if (parsed) handlers.onEvent?.(parsed, eventName);
      });
    });

    source.onerror = (error: unknown) => {
      handlers.onError?.(error);
    };

    return () => {
      source.close();
    };
  }

  async getMatchingResult(roomId: string): Promise<MatchingResultData> {
    const response = await apiClient.get(
      getApiUrlWithParams(API_ENDPOINTS_LIST.MEETING_MATCHING_RESULT, {
        roomId,
      }),
    );
    return this.unwrap<MatchingResultData>(response.data);
  }

  async acceptMatch(payload: AcceptMatchRequest): Promise<AcceptMatchResult> {
    const response = await apiClient.post(
      API_ENDPOINTS_LIST.MEETING_MATCHING_ACCEPT,
      payload,
    );
    const raw = response.data;
    return (
      raw?.currentStatus ? raw : this.unwrap<AcceptMatchResult>(raw)
    ) as AcceptMatchResult;
  }

  async rejectMatch(payload: RejectMatchRequest): Promise<RejectMatchResult> {
    const response = await apiClient.post(
      API_ENDPOINTS_LIST.MEETING_MATCHING_REJECT,
      payload,
    );
    const raw = response.data;
    return (
      raw?.currentStatus ? raw : this.unwrap<RejectMatchResult>(raw)
    ) as RejectMatchResult;
  }
}

export const meetingApiService = new MeetingApiService();
