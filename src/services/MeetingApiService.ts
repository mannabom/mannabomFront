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
import { requireExternalId, toExternalId } from '../utils/IdUtils';
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

const normalizeTeamMember = (raw: any): MeetingTeamMember | null => {
  const userId = toExternalId(raw?.userId);
  if (!userId) return null;
  return {
    userId,
    nickname: toStringValue(raw?.nickname ?? raw?.nickName, '팀원'),
    profileImage: toStringValue(raw?.profileImage ?? raw?.profileImageUrl),
    leader: Boolean(raw?.leader ?? raw?.isLeader),
  };
};

const normalizeMatchingMember = (raw: any) => {
  const userId = toExternalId(raw?.userId);
  if (!userId) return null;
  return {
    ...raw,
    userId,
  };
};

const normalizeParticipants = (raw: any) =>
  Array.isArray(raw)
    ? raw
        .map((participant: any) => {
          const userId = toExternalId(participant?.userId);
          if (!userId) return null;
          return {
            ...participant,
            userId,
            profileId: toExternalId(participant?.profileId) ?? undefined,
          };
        })
        .filter(Boolean)
    : [];

const normalizeDecisionChatRoom = (raw: any) => ({
  ...raw,
  roomId: requireExternalId(raw?.roomId, 'roomId'),
  participants: normalizeParticipants(raw?.participants),
});

const normalizeMatchingResult = (raw: any): MatchingResultData => ({
  ...raw,
  matchId: requireExternalId(raw?.matchId, 'matchId'),
  opponentTeam: {
    ...raw?.opponentTeam,
    roomId: requireExternalId(raw?.opponentTeam?.roomId, 'opponentTeam.roomId'),
    members: Array.isArray(raw?.opponentTeam?.members)
      ? raw.opponentTeam.members.map(normalizeMatchingMember).filter(Boolean)
      : [],
  },
});

const normalizeChatRoomInfo = (raw: any): MeetingChatRoomInfo => {
  const rawTeamMembers = Array.isArray(raw?.teamMembers)
    ? raw.teamMembers
    : Array.isArray(raw?.teamMember)
    ? raw.teamMember
    : [];

  const roomId = toExternalId(raw?.roomId);
  const meetingId = toExternalId(raw?.meetingId);
  if (!roomId && !meetingId) {
    throw new Error('미팅 방 ID가 없는 잘못된 서버 응답입니다.');
  }

  return {
    roomId: roomId ?? undefined,
    meetingId: meetingId ?? undefined,
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
    teamMembers: rawTeamMembers
      .map(normalizeTeamMember)
      .filter(
        (member: MeetingTeamMember | null): member is MeetingTeamMember =>
          member !== null,
      ),
    leader: Boolean(raw?.leader ?? raw?.isLeader),
  };
};

const normalizeRoomSummary = (raw: any): MeetingRoomSummary | null => {
  const meetingId = toExternalId(raw?.meetingId);
  if (!meetingId) return null;

  return {
    roomId:
      raw?.roomId === undefined || raw?.roomId === null
        ? undefined
        : toExternalId(raw?.roomId) ?? undefined,
    meetingId,
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
      ? raw.membersPreview.flatMap((member: any) => {
          const userId = toExternalId(member?.userId);
          return userId
            ? [{
                userId,
                profileImage: toStringValue(
                  member?.profileImage ?? member?.profileImageUrl,
                ),
              }]
            : [];
        })
      : [],
  };
};

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
  subscribedRoomId: string,
): MeetingStreamEvent | null => {
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') return null;
    const normalized: any = {
      ...parsed,
      type: STREAM_EVENT_TYPE[eventName],
      roomId:
        toExternalId(parsed?.roomId) ??
        requireExternalId(subscribedRoomId, 'roomId'),
      eventId: toExternalId(parsed?.eventId) ?? undefined,
    };

    if (eventName === 'match-found') {
      normalized.data = {
        ...parsed.data,
        matchId: requireExternalId(parsed?.data?.matchId, 'matchId'),
        opponentTeam: {
          ...parsed?.data?.opponentTeam,
          roomId: requireExternalId(
            parsed?.data?.opponentTeam?.roomId,
            'opponentTeam.roomId',
          ),
          members: Array.isArray(parsed?.data?.opponentTeam?.members)
            ? parsed.data.opponentTeam.members
                .map(normalizeMatchingMember)
                .filter(Boolean)
            : [],
        },
      };
    } else if (eventName === 'decision-result') {
      normalized.data = {
        ...parsed.data,
        matchId: requireExternalId(parsed?.data?.matchId, 'matchId'),
        ...(parsed?.data?.chatRoom
          ? { chatRoom: normalizeDecisionChatRoom(parsed.data.chatRoom) }
          : {}),
      };
    }

    return normalized as MeetingStreamEvent;
  } catch (error) {
    if (__DEV__) {
      console.warn('Invalid meeting stream event ignored', eventName, error);
    }
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
        ? data.meetings
            .map(normalizeRoomSummary)
            .filter(
              (
                room: MeetingRoomSummary | null,
              ): room is MeetingRoomSummary => room !== null,
            )
        : [],
    };
  }

  async getMemberProfiles(
    roomId: string,
  ): Promise<MeetingMemberProfilesResult> {
    const response = await apiClient.get(
      getApiUrlWithParams(API_ENDPOINTS_LIST.MEETING_MEMBER_PROFILES, {
        roomId,
      }),
    );
    const data = this.unwrap<any>(response.data);

    return {
      members: Array.isArray(data?.members)
        ? data.members.flatMap(
            (member: any): MeetingMemberProfile[] => {
              const userId = toExternalId(member?.userId);
              return userId
                ? [{
                    userId,
                    profileImage: toStringValue(
                      member?.profileImage ?? member?.profileImageUrl,
                    ),
                    age: toNumber(member?.age),
                    mbti: toStringValue(member?.mbti),
                    smokingHabit: toStringValue(member?.smokingHabit),
                    drinkingHabit: toStringValue(member?.drinkingHabit),
                  }]
                : [];
            },
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
        const parsed = parseStreamPayload(event?.data, eventName, roomId);
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
    return normalizeMatchingResult(this.unwrap<any>(response.data));
  }

  async acceptMatch(payload: AcceptMatchRequest): Promise<AcceptMatchResult> {
    const response = await apiClient.post(
      API_ENDPOINTS_LIST.MEETING_MATCHING_ACCEPT,
      payload,
    );
    const raw = response.data;
    const result = (
      raw?.currentStatus ? raw : this.unwrap<AcceptMatchResult>(raw)
    ) as AcceptMatchResult;
    return {
      ...result,
      data: {
        ...result.data,
        ...(result.data?.chatRoom
          ? { chatRoom: normalizeDecisionChatRoom(result.data.chatRoom) }
          : {}),
      },
    };
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
