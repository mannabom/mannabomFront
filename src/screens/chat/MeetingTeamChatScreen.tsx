import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { REPORT_REASON_OPTIONS } from '../../constants/reportReasons';
import { chatApiService } from '../../services/ChatApiService';
import { chatSocketService } from '../../services/ChatSocketService';
import { meetingApiService } from '../../services/MeetingApiService';
import { reportApiService } from '../../services/ReportApiService';
import { ChatMessageDTO, ChatRoomStatus } from '../../types/ChatAPI';
import {
  AcceptMatchResult,
  MatchingResultData,
  MeetingStatus,
  MeetingStreamEvent,
  MyMeetingStatus,
} from '../../types/MeetingAPI';
import {
  REPORT_DETAIL_MAX_LENGTH,
  ReportReason,
} from '../../types/ReportAPI';
import { getUserId } from '../../utils/AuthUtils';
import { toExternalId } from '../../utils/IdUtils';

const sendIconImg = require('../../assets/images/Send.png');
const reportIconImg = require('../../assets/images/report.png');

type MatchState =
  | 'waiting'
  | 'matching'
  | 'offer'
  | 'waitingOpponent'
  | 'matched';
type TeamView = 'mine' | 'opponent';
type SystemKind =
  | 'arrival'
  | 'rejected'
  | 'rejectedByMe'
  | 'matched'
  | 'started'
  | 'cancelled';

type TeamMember = {
  id: string;
  name: string;
  profileImage?: string;
  leader?: boolean;
  self?: boolean;
};

type ChatMessage =
  | {
      id: string;
      serverId?: string;
      type: 'message';
      mine?: boolean;
      tone?: 'pink' | 'blue';
      text: string;
      time: string;
    }
  | {
      id: string;
      type: 'system';
      kind: SystemKind;
      text: string;
      semanticKey?: string;
    };

const INITIAL_MESSAGES: ChatMessage[] = [];

const SYSTEM_COPY: Record<SystemKind, string> = {
  arrival:
    '새로운 상대 팀이 자동 매칭되었습니다. 제한 시간 안에 매칭을 수락해주세요.',
  rejected: '상대팀이 먼저 거절하여 이번 매칭은 성사되지 않았습니다.',
  rejectedByMe: '우리 팀이 거절하여 이번 매칭은 성사되지 않았습니다.',
  matched: '양쪽 팀이 모두 수락하여 미팅이 성사되었습니다.',
  started: '팀장이 매칭을 시작했습니다.',
  cancelled: '팀장이 매칭을 취소했습니다.',
};

const parseApiMessage = (error: any, fallback: string) =>
  String(
    error?.response?.data?.message ??
      error?.response?.data?.error ??
      error?.message ??
      fallback,
  );

const toMatchState = (status?: MeetingStatus): MatchState => {
  if (status === 'MATCHED') return 'matched';
  if (status === 'MATCHING') return 'matching';
  return 'waiting';
};

type MatchedChatRoom = NonNullable<AcceptMatchResult['data']['chatRoom']>;

const formatMessageTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date
    .toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .toLowerCase();
};

const normalizeIncomingMessage = (
  raw: ChatMessageDTO | any,
  currentUserId?: string | null,
): ChatMessage | null => {
  const messageId = toExternalId(
    raw?.messageId ?? raw?.id ?? raw?.clientMessageId,
  );
  const messageContent = raw?.messageContent ?? raw?.content;
  if (!messageId || typeof messageContent !== 'string') return null;

  const mine = Boolean(
    currentUserId && toExternalId(raw?.senderId) === currentUserId,
  );
  return {
    id: messageId,
    serverId:
      toExternalId(raw?.messageId ?? raw?.serverId) ?? undefined,
    type: 'message',
    mine,
    tone: mine ? 'pink' : undefined,
    text: messageContent,
    time: formatMessageTime(raw?.timestamp),
  };
};

const MeetingTeamChatScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const roomId = toExternalId(route.params?.roomId) ?? '';
  const requestedMeetingRoomId =
    toExternalId(route.params?.meetingRoomId) ?? '';
  const [expanded, setExpanded] = useState(false);
  const [matchState, setMatchState] = useState<MatchState>('waiting');
  const [meetingRoom, setMeetingRoom] = useState<MyMeetingStatus | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [opponentTeam, setOpponentTeam] = useState<
    MatchingResultData['opponentTeam'] | null
  >(null);
  const [matchedChatRoom, setMatchedChatRoom] =
    useState<MatchedChatRoom | null>(null);
  const [decisionDeadline, setDecisionDeadline] = useState<string | null>(null);
  const [remainingRematches, setRemainingRematches] = useState<number | null>(
    null,
  );
  const [matchingAction, setMatchingAction] = useState<
    'start' | 'cancel' | 'continue' | 'accept' | 'reject' | null
  >(null);
  const [teamView, setTeamView] = useState<TeamView>('mine');
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [chatRoomStatus, setChatRoomStatus] =
    useState<ChatRoomStatus>('ACTIVE');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const lastChatSyncTimeRef = useRef<string | null>(null);
  const matchStateRef = useRef<MatchState>('waiting');
  const rejectedByMeMatchIdsRef = useRef<Set<string>>(new Set());

  const [infoVisible, setInfoVisible] = useState(false);
  const [cancelVisible, setCancelVisible] = useState(false);
  const [rejectVisible, setRejectVisible] = useState(false);
  const [rematchPrompt, setRematchPrompt] = useState<
    'rejected' | 'timeout' | null
  >(null);
  const [actionVisible, setActionVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [leaveVisible, setLeaveVisible] = useState(false);
  const [leaveDeniedVisible, setLeaveDeniedVisible] = useState(false);
  const [reportTarget, setReportTarget] = useState('');
  const [reportReason, setReportReason] = useState(
    ReportReason.ABUSIVE_LANGUAGE,
  );
  const [reportDetail, setReportDetail] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const meetingRoomIdValue = meetingRoom?.meetingId ?? meetingRoom?.roomId;
  const meetingRoomId = toExternalId(meetingRoomIdValue) ?? '';
  const isLeader = Boolean(meetingRoom?.leader);
  const roomTitle = String(
    meetingRoom?.roomName ?? route.params?.roomTitle ?? '미팅 방',
  );
  const roomCode = meetingRoom?.roomCode || '';
  const statusText =
    matchState === 'matched'
      ? '매칭 완료'
      : matchState === 'matching' ||
        matchState === 'offer' ||
        matchState === 'waitingOpponent'
      ? '매칭 중'
      : '대기중';
  const matched = matchState === 'matched' || chatRoomStatus !== 'ACTIVE';
  const canCancel = isLeader && matchState === 'matching';
  const matchingActionPending = matchingAction !== null;
  const matchingStreamActive =
    matchState === 'matching' ||
    matchState === 'offer' ||
    matchState === 'waitingOpponent';

  const updateMatchState = useCallback((nextState: MatchState) => {
    matchStateRef.current = nextState;
    setMatchState(nextState);
  }, []);

  const applyServerMatchStatus = useCallback(
    (status?: MeetingStatus) => {
      const nextState = toMatchState(status);
      const currentState = matchStateRef.current;

      if (
        nextState === 'matching' &&
        (currentState === 'offer' ||
          currentState === 'waitingOpponent' ||
          currentState === 'matched')
      ) {
        return;
      }

      updateMatchState(nextState);
    },
    [updateMatchState],
  );

  const ownTeamMembers = useMemo<TeamMember[]>(() => {
    const serverMembers = meetingRoom?.teamMembers ?? [];
    if (serverMembers.length) {
      return serverMembers.reduce<TeamMember[]>((normalized, member) => {
          const userId = toExternalId(member.userId);
          if (!userId) return normalized;
          normalized.push({
            id: userId,
            name: member.nickname,
            profileImage: member.profileImage,
            leader: member.leader,
            self: userId === currentUserId,
          });
          return normalized;
        }, []);
    }

    const routeParticipants: any[] = Array.isArray(route.params?.participants)
      ? route.params.participants
      : [];
    return routeParticipants.reduce<TeamMember[]>(
      (normalized: TeamMember[], member: any) => {
        const userId = toExternalId(member.userId);
        if (!userId) return normalized;
        normalized.push({
          id: userId,
          name: String(member.nickname || '이름 없음'),
          profileImage: String(member.profileImage || ''),
          self: userId === currentUserId,
        });
        return normalized;
      },
      [],
    );
  }, [
    currentUserId,
    isLeader,
    meetingRoom?.teamMembers,
    route.params?.participants,
  ]);

  const opponentTeamMembers = useMemo<TeamMember[]>(
    () =>
      (opponentTeam?.members ?? []).reduce<TeamMember[]>(
        (normalized, member) => {
          const userId = toExternalId(member.userId);
          if (!userId) return normalized;
          normalized.push({
            id: userId,
            name: member.nickname,
            profileImage: member.profileImage,
          });
          return normalized;
        },
        [],
      ),
    [opponentTeam],
  );
  const reportableMembers = useMemo(() => {
    if (!currentUserId) return [];

    const uniqueMembers = new Map<string, TeamMember>();
    ownTeamMembers.forEach(member => {
      if (!member.self && member.id) {
        uniqueMembers.set(member.id, member);
      }
    });
    return Array.from(uniqueMembers.values());
  }, [currentUserId, ownTeamMembers]);

  const visibleMembers =
    teamView === 'opponent' ? opponentTeamMembers : ownTeamMembers;

  const actionLabel = useMemo(() => {
    if (matchState === 'matched') return '채팅방으로';
    if (matchState === 'waitingOpponent') return '응답 대기 중';
    if (matchState === 'offer') return '매칭 수락';
    if (matchState === 'matching') return '매칭 중';
    return '매칭 신청';
  }, [matchState]);

  const acceptDeadlineText = useMemo(() => {
    if (!decisionDeadline) return '매칭 수락 응답을 기다리고 있어요.';
    const deadline = new Date(decisionDeadline);
    if (Number.isNaN(deadline.getTime())) {
      return `매칭 수락 마감 ${decisionDeadline}`;
    }
    return `매칭 수락 마감 ${deadline.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }, [decisionDeadline]);

  const pushSystem = useCallback(
    (kind: SystemKind, semanticKey?: string) => {
      setMessages(prev => {
        if (
          semanticKey &&
          prev.some(
            message =>
              message.type === 'system' &&
              message.semanticKey === semanticKey,
          )
        ) {
          return prev;
        }

        return [
          ...prev,
          {
            id: semanticKey
              ? `system-${semanticKey}`
              : `system-${Date.now()}-${kind}`,
            type: 'system',
            kind,
            text: SYSTEM_COPY[kind],
            semanticKey,
          },
        ];
      });
    },
    [],
  );

  const applyMatchingResult = useCallback(
    (result: MatchingResultData) => {
      if (!result?.matchId || !result?.opponentTeam) return false;

      setMatchId(result.matchId);
      setOpponentTeam(result.opponentTeam);
      setDecisionDeadline(result.decisionDeadline || null);
      updateMatchState('offer');
      pushSystem('arrival', `match:${result.matchId}:arrival`);
      return true;
    },
    [pushSystem, updateMatchState],
  );

  const refreshMeetingStatus = useCallback(async () => {
    const [status, userId] = await Promise.all([
      meetingApiService.getMyStatus(),
      getUserId(),
    ]);
    setCurrentUserId(userId);

    if (!status.hasActiveRoom) {
      setMeetingRoom(null);
      updateMatchState('waiting');
      throw new Error('현재 참여 중인 미팅 방을 찾을 수 없습니다.');
    }

    const activeRoomId = status.meetingId ?? status.roomId;
    if (
      !activeRoomId ||
      !requestedMeetingRoomId ||
      toExternalId(activeRoomId) !== requestedMeetingRoomId
    ) {
      setMeetingRoom(null);
      updateMatchState('waiting');
      throw new Error(
        '현재 채팅방과 활성 미팅 방을 확인할 수 없습니다. 채팅방 응답에 meetingRoomId가 필요합니다.',
      );
    }

    setMeetingRoom(status);
    applyServerMatchStatus(status.matchingStatus);
    return status;
  }, [applyServerMatchStatus, requestedMeetingRoomId, updateMatchState]);

  const loadMeetingState = useCallback(async () => {
    try {
      const status = await refreshMeetingStatus();
      const activeRoomId = status.meetingId ?? status.roomId;
      if (status.matchingStatus === 'MATCHING' && activeRoomId) {
        try {
          const result = await meetingApiService.getMatchingResult(activeRoomId);
          applyMatchingResult(result);
        } catch (error) {
          if (__DEV__) {
            console.warn('No pending meeting matching result', error);
          }
        }
      }
    } catch (error) {
      if (__DEV__) console.warn('Failed to load meeting room state', error);
      Alert.alert(
        '오류',
        parseApiMessage(error, '미팅 방 정보를 불러오지 못했어요.'),
      );
    }
  }, [applyMatchingResult, refreshMeetingStatus]);

  useFocusEffect(
    useCallback(() => {
      loadMeetingState();
      return undefined;
    }, [loadMeetingState]),
  );

  useEffect(() => {
    if (!reportableMembers.length) {
      setReportTarget('');
      return;
    }

    if (!reportableMembers.some(member => member.id === reportTarget)) {
      setReportTarget(reportableMembers[0]?.id ?? '');
    }
  }, [reportableMembers, reportTarget]);

  const syncMessages = useCallback(async () => {
    if (!roomId) return;

    try {
      const nextUserId = await getUserId();
      setCurrentUserId(nextUserId);
      const isInitialSync = !lastChatSyncTimeRef.current;
      const result = await chatApiService.syncChatRoomMessages(
        roomId,
        lastChatSyncTimeRef.current,
      );
      lastChatSyncTimeRef.current =
        result.lastSyncTime || lastChatSyncTimeRef.current;
      setChatRoomStatus(result.chatRoomStatus);
      const normalized = result.messages
        .map(message => normalizeIncomingMessage(message, nextUserId))
        .filter((message): message is ChatMessage => Boolean(message));
      setMessages(prev => {
        if (isInitialSync) {
          const localSystemMessages = prev.filter(
            message => message.type === 'system',
          );
          return [...normalized, ...localSystemMessages];
        }
        const existingIds = new Set(prev.map(message => message.id));
        const nextMessages = normalized.filter(
          message => !existingIds.has(message.id),
        );
        return nextMessages.length ? [...prev, ...nextMessages] : prev;
      });
    } catch (error) {
      if (__DEV__) console.warn('Failed to sync chat room messages', error);
    }
  }, [roomId]);

  useFocusEffect(
    useCallback(() => {
      let unsubscribe: (() => void) | undefined;

      syncMessages();
      if (roomId) {
        chatSocketService
          .subscribeRoom(roomId, raw => {
            const normalized = normalizeIncomingMessage(raw, currentUserId);
            if (!normalized) return;
            setMessages(prev => {
              if (prev.some(message => message.id === normalized.id))
                return prev;
              return [...prev, normalized];
            });
          })
          .then(nextUnsubscribe => {
            unsubscribe = nextUnsubscribe;
          })
          .catch(error => {
            if (__DEV__) console.warn('Failed to subscribe chat room', error);
          });
      }

      return () => {
        unsubscribe?.();
        chatSocketService.disconnect();
      };
    }, [currentUserId, roomId, syncMessages]),
  );

  const handleMatchingEvent = useCallback(
    (event: MeetingStreamEvent) => {
      if (event.type === 'MATCHING_STATUS') {
        applyServerMatchStatus(event.data.status);
        return;
      }

      if (event.type === 'MATCH_FOUND') {
        applyMatchingResult({
          matchId: event.data.matchId,
          opponentTeam: event.data.opponentTeam,
          decisionDeadline: event.data.decisionDeadline,
        });
        return;
      }

      if (event.type === 'MATCHING_TIMEOUT') {
        setRemainingRematches(event.data.remainingAttempts ?? null);
        setMatchId(null);
        setOpponentTeam(null);
        setDecisionDeadline(null);
        updateMatchState('waiting');
        if (event.data.canContinue && isLeader) {
          setRematchPrompt('timeout');
        } else if (!event.data.canContinue) {
          Alert.alert('매칭 종료', '매칭 대기 시간이 종료되었습니다.');
        }
        return;
      }

      if (event.type === 'DECISION_RESULT') {
        if (event.data.chatRoom) {
          setMatchedChatRoom(event.data.chatRoom);
          updateMatchState('matched');
          setDecisionDeadline(null);
          pushSystem('matched', `room:${meetingRoomId}:matched`);
          return;
        }

        setRemainingRematches(event.data.remainingRematches ?? null);
        setMatchId(null);
        setOpponentTeam(null);
        setDecisionDeadline(null);
        updateMatchState('waiting');
        pushSystem(
          rejectedByMeMatchIdsRef.current.has(event.data.matchId)
            ? 'rejectedByMe'
            : 'rejected',
          `match:${event.data.matchId}:rejected`,
        );
        if (isLeader) setRematchPrompt('rejected');
        refreshMeetingStatus().catch(error => {
          if (__DEV__) {
            console.warn('Failed to refresh state after match decision', error);
          }
        });
      }
    },
    [
      applyMatchingResult,
      applyServerMatchStatus,
      isLeader,
      meetingRoomId,
      pushSystem,
      refreshMeetingStatus,
      updateMatchState,
    ],
  );

  useEffect(() => {
    if (!meetingRoomId || !matchingStreamActive) {
      return undefined;
    }

    let disposed = false;
    let unsubscribe: (() => void) | undefined;

    meetingApiService
      .subscribeToMatchingEvents(meetingRoomId, {
        onEvent: handleMatchingEvent,
        onError: error => {
          if (__DEV__) console.warn('Meeting matching stream failed', error);
        },
      })
      .then(nextUnsubscribe => {
        if (disposed) {
          nextUnsubscribe();
          return;
        }
        unsubscribe = nextUnsubscribe;
      })
      .catch(error => {
        if (__DEV__) {
          console.warn('Failed to subscribe to meeting matching events', error);
        }
      });

    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, [handleMatchingEvent, matchingStreamActive, meetingRoomId]);

  useEffect(() => {
    if (
      !meetingRoomId ||
      !['matching', 'offer', 'waitingOpponent'].includes(matchState)
    ) {
      return undefined;
    }

    let disposed = false;
    let polling = false;

    const pollMatchingState = async () => {
      if (polling) return;
      polling = true;
      try {
        const status = await meetingApiService.getMyStatus();
        const activeRoomId = status.meetingId ?? status.roomId;
        if (
          disposed ||
          !status.hasActiveRoom ||
          !activeRoomId ||
          toExternalId(activeRoomId) !== meetingRoomId
        ) {
          return;
        }

        setMeetingRoom(status);
        if (status.matchingStatus === 'MATCHED') {
          updateMatchState('matched');
          setDecisionDeadline(null);
          pushSystem('matched', `room:${meetingRoomId}:matched`);
          return;
        }

        if (status.matchingStatus !== 'MATCHING') {
          updateMatchState(toMatchState(status.matchingStatus));
          setMatchId(null);
          setOpponentTeam(null);
          setDecisionDeadline(null);
          return;
        }

        try {
          const result = await meetingApiService.getMatchingResult(
            meetingRoomId,
          );
          if (
            !disposed &&
            (matchState === 'matching' || result.matchId !== matchId)
          ) {
            applyMatchingResult(result);
          }
        } catch (error) {
          if (__DEV__) {
            console.warn('No meeting matching result during polling', error);
          }
        }
      } catch (error) {
        if (__DEV__) console.warn('Failed to poll meeting state', error);
      } finally {
        polling = false;
      }
    };

    const interval = setInterval(pollMatchingState, 5000);
    return () => {
      disposed = true;
      clearInterval(interval);
    };
  }, [
    applyMatchingResult,
    matchId,
    matchState,
    meetingRoomId,
    pushSystem,
    updateMatchState,
  ]);

  useEffect(() => {
    const lastReadMessage = [...messages]
      .reverse()
      .find(message => message.type === 'message' && message.serverId);

    if (
      !roomId ||
      !lastReadMessage ||
      lastReadMessage.type !== 'message' ||
      !lastReadMessage.serverId
    ) {
      return;
    }

    chatApiService
      .markRoomRead({
        chatRoomId: roomId,
        lastReadMessageId: lastReadMessage.serverId,
      })
      .catch(error => {
        if (__DEV__) console.warn('Failed to mark chat room read', error);
      });
  }, [messages, roomId]);

  const startMatching = async () => {
    if (!isLeader || matchState !== 'waiting' || matchingActionPending) {
      return;
    }

    if (
      !meetingRoomId ||
      !meetingRoom?.gender ||
      !meetingRoom.region ||
      !meetingRoom.ageRangeDto ||
      !meetingRoom.memberInfo?.currentCount
    ) {
      Alert.alert(
        '매칭 시작 불가',
        '미팅 방의 성별, 지역, 나이 또는 인원 정보가 부족합니다.',
      );
      return;
    }

    setMatchingAction('start');
    try {
      const result = await meetingApiService.startMatching({
        roomId: meetingRoomId,
        gender: meetingRoom.gender,
        region: meetingRoom.region,
        ageRange: meetingRoom.ageRangeDto,
        memberCount: meetingRoom.memberInfo.currentCount,
      });

      if (!result.matchingStarted) {
        Alert.alert('매칭 시작 실패', '서버에서 매칭을 시작하지 못했습니다.');
        return;
      }

      updateMatchState('matching');
      pushSystem('started');
    } catch (error) {
      if (__DEV__) console.warn('Failed to start meeting matching', error);
      Alert.alert('오류', parseApiMessage(error, '매칭을 시작하지 못했어요.'));
    } finally {
      setMatchingAction(null);
    }
  };

  const acceptMatch = async () => {
    if (
      !isLeader ||
      matchState !== 'offer' ||
      !matchId ||
      matchingActionPending
    ) {
      return;
    }

    setMatchingAction('accept');
    try {
      const result = await meetingApiService.acceptMatch({ matchId });
      if (result.currentStatus === 'COMPLETED' && result.data?.chatRoom) {
        setMatchedChatRoom(result.data.chatRoom);
        updateMatchState('matched');
        setDecisionDeadline(null);
        pushSystem('matched', `room:${meetingRoomId}:matched`);
      } else if (result.currentStatus === 'WAITING') {
        updateMatchState('waitingOpponent');
      } else {
        try {
          await refreshMeetingStatus();
        } catch (refreshError) {
          if (__DEV__) {
            console.warn(
              'Failed to refresh state after accepting match',
              refreshError,
            );
          }
        }
        Alert.alert(
          '매칭 상태 확인 필요',
          '수락은 처리됐지만 최종 채팅방 정보를 받지 못했습니다.',
        );
      }
    } catch (error) {
      if (__DEV__) console.warn('Failed to accept meeting match', error);
      Alert.alert('오류', parseApiMessage(error, '매칭을 수락하지 못했어요.'));
    } finally {
      setMatchingAction(null);
    }
  };

  const confirmReject = async () => {
    if (!isLeader || !matchId || matchingActionPending) return;

    const rejectedMatchId = matchId;
    rejectedByMeMatchIdsRef.current.add(rejectedMatchId);
    setMatchingAction('reject');
    try {
      const result = await meetingApiService.rejectMatch({ matchId });
      if (!result.data) {
        throw new Error('매칭 거절 응답에 재매칭 정보가 없습니다.');
      }
      setRejectVisible(false);
      updateMatchState('waiting');
      setMatchId(null);
      setOpponentTeam(null);
      setDecisionDeadline(null);
      setRemainingRematches(result.data.remainingRematches);
      pushSystem(
        'rejectedByMe',
        `match:${rejectedMatchId}:rejected`,
      );

      if (result.data.canRematch) {
        setRematchPrompt('rejected');
      } else {
        Alert.alert('매칭 종료', '사용 가능한 재매칭 기회가 없습니다.');
      }
    } catch (error) {
      rejectedByMeMatchIdsRef.current.delete(rejectedMatchId);
      if (__DEV__) console.warn('Failed to reject meeting match', error);
      Alert.alert('오류', parseApiMessage(error, '매칭을 거절하지 못했어요.'));
    } finally {
      setMatchingAction(null);
    }
  };

  const continueMatching = async () => {
    if (!isLeader || !meetingRoomId || matchingActionPending) return;

    setMatchingAction('continue');
    try {
      const result = await meetingApiService.continueMatching({
        roomId: meetingRoomId,
      });
      if (!result.continued) {
        Alert.alert('재매칭 실패', '서버에서 재매칭을 시작하지 못했습니다.');
        return;
      }

      setRematchPrompt(null);
      updateMatchState('matching');
    } catch (error) {
      if (__DEV__) console.warn('Failed to continue meeting matching', error);
      Alert.alert(
        '오류',
        parseApiMessage(error, '재매칭을 시작하지 못했어요.'),
      );
    } finally {
      setMatchingAction(null);
    }
  };

  const confirmCancel = async () => {
    if (!meetingRoomId || !canCancel || matchingActionPending) return;

    setMatchingAction('cancel');
    try {
      const result = await meetingApiService.cancelMatching({
        roomId: meetingRoomId,
      });
      if (!result.cancelled) {
        Alert.alert('매칭 취소 실패', '서버에서 매칭을 취소하지 못했습니다.');
        return;
      }

      setCancelVisible(false);
      updateMatchState('waiting');
      setMatchId(null);
      setOpponentTeam(null);
      setDecisionDeadline(null);
      pushSystem('cancelled');
    } catch (error) {
      if (__DEV__) console.warn('Failed to cancel meeting matching', error);
      Alert.alert('오류', parseApiMessage(error, '매칭을 취소하지 못했어요.'));
    } finally {
      setMatchingAction(null);
    }
  };

  const goToGeneralChat = () => {
    if (!matchedChatRoom?.roomId) {
      Alert.alert(
        '채팅방 정보 확인 필요',
        '매칭은 완료됐지만 생성된 미팅 채팅방 정보를 아직 받지 못했습니다.',
      );
      return;
    }

    navigation.navigate('MeetingGeneralChat', {
      roomId: matchedChatRoom.roomId,
      roomType: 'MEETING',
      roomTitle: matchedChatRoom.roomName,
      participants: matchedChatRoom.participants.map(participant => ({
        userId: toExternalId(participant.userId) ?? '',
        profileId: toExternalId(participant.profileId) ?? undefined,
        nickname: participant.nickname,
        profileImage: participant.profileImage,
      })).filter(participant => participant.userId),
    });
  };

  const handleLeaveRequest = () => {
    setActionVisible(false);
    if (matchState === 'waiting') {
      setLeaveVisible(true);
    } else {
      setLeaveDeniedVisible(true);
    }
  };

  const confirmLeaveRoom = async () => {
    if (!meetingRoomId) {
      Alert.alert(
        '나가기 실패',
        '미팅 방 식별자를 확인할 수 없어 방에서 나갈 수 없습니다.',
      );
      return;
    }

    try {
      const result = await meetingApiService.leaveRoom({
        roomId: meetingRoomId,
      });
      if (!result.left) {
        Alert.alert(
          '나가기 실패',
          '서버에서 미팅 방 나가기를 완료하지 못했습니다.',
        );
        return;
      }
      setLeaveVisible(false);
      navigation.goBack();
    } catch (error) {
      if (__DEV__) console.warn('Failed to leave meeting room', error);
      Alert.alert(
        '오류',
        parseApiMessage(error, '미팅 방 나가기에 실패했어요.'),
      );
    }
  };

  const submitReport = async () => {
    const targetId = toExternalId(reportTarget);
    if (!roomId || !targetId || reportSubmitting) {
      Alert.alert(
        '신고할 수 없어요',
        '채팅방 또는 신고 대상 정보를 확인하지 못했어요. 채팅 목록에서 다시 들어와 주세요.',
      );
      return;
    }

    setReportSubmitting(true);
    try {
      await reportApiService.reportChat({
        contextId: roomId,
        targetId,
        reason: reportReason,
        additionalDetail: reportDetail.trim() || undefined,
      });
      setReportVisible(false);
      setReportDetail('');
      setReportReason(ReportReason.ABUSIVE_LANGUAGE);
      Alert.alert('신고 완료', '신고가 접수됐어요.');
    } catch (error) {
      if (__DEV__) console.warn('Failed to report meeting team chat', error);
      Alert.alert('오류', '신고 접수에 실패했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setReportSubmitting(false);
    }
  };

  const submitMessage = () => {
    const trimmed = input.trim();
    if (!trimmed || matched || !roomId) return;
    const clientMessageId = `manual-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      {
        id: clientMessageId,
        type: 'message',
        mine: true,
        tone: 'pink',
        text: trimmed,
        time: formatMessageTime(new Date().toISOString()),
      },
    ]);
    setInput('');
    chatSocketService
      .sendMessage({
        roomId,
        messageType: 'TEXT',
        content: trimmed,
        clientMessageId,
      })
      .catch(error => {
        if (__DEV__) console.warn('Failed to send chat message', error);
        Alert.alert('오류', '메시지 전송에 실패했어요.');
      });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Pressable
        style={styles.screen}
        onPress={() => expanded && setExpanded(false)}
      >
        <Pressable>
          <RoomHeader
            expanded={expanded}
            roomTitle={roomTitle}
            roomCode={roomCode}
            statusText={statusText}
            members={visibleMembers}
            isLeader={isLeader}
            matchState={matchState}
            teamView={teamView}
            actionLabel={actionLabel}
            canCancel={canCancel}
            actionPending={matchingActionPending}
            onToggle={() => setExpanded(prev => !prev)}
            onInfo={() => setInfoVisible(true)}
            onStart={startMatching}
            onAccept={acceptMatch}
            onCancel={() => canCancel && setCancelVisible(true)}
            onReject={() => setRejectVisible(true)}
            onToggleTeamView={() =>
              setTeamView(prev => (prev === 'mine' ? 'opponent' : 'mine'))
            }
            onGoGeneralChat={goToGeneralChat}
          />
        </Pressable>

        <ScrollView
          style={styles.messagesScroll}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map(message =>
            message.type === 'system' ? (
              <SystemMessage
                key={message.id}
                message={message}
                onMatchedPress={goToGeneralChat}
              />
            ) : (
              <BubbleMessage key={message.id} message={message} />
            ),
          )}
        </ScrollView>

        {matchState === 'offer' && (
          <View style={styles.acceptTimer}>
            <Text style={styles.acceptTimerText}>{acceptDeadlineText}</Text>
          </View>
        )}

        {actionVisible && (
          <View style={styles.actionSheet}>
            <TouchableOpacity
              style={styles.actionSheetItem}
              onPress={() => {
                setActionVisible(false);
                setReportVisible(true);
              }}
            >
              <View style={styles.actionSheetIconBox}>
                <Image
                  source={reportIconImg}
                  style={styles.actionSheetIconImage}
                />
              </View>
              <Text style={styles.actionSheetText}>신고</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionSheetItem}
              onPress={handleLeaveRequest}
            >
              <View style={styles.actionSheetIconBox}>
                <Text style={styles.actionSheetIcon}>↪</Text>
              </View>
              <Text style={styles.actionSheetText}>나가기</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Message"
            editable={!matched}
            placeholderTextColor="#B8B8B8"
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={submitMessage}
            disabled={matched}
          >
            <Image source={sendIconImg} style={styles.sendButtonImage} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => setActionVisible(prev => !prev)}
          >
            <Text style={styles.moreButtonText}>…</Text>
          </TouchableOpacity>
        </View>
      </Pressable>

      <InfoModal visible={infoVisible} onClose={() => setInfoVisible(false)} />
      <ConfirmModal
        visible={cancelVisible}
        title="정말 취소할까요?"
        body="매칭 취소하면 우선순위에서 밀려서 다음 매칭 때 더 오래걸릴 수 있어요 !"
        primary="다시 생각해볼게요"
        secondary={matchingAction === 'cancel' ? '취소 중...' : '취소할래요'}
        onPrimary={() => setCancelVisible(false)}
        onSecondary={confirmCancel}
      />
      <ConfirmModal
        visible={rejectVisible}
        title="정말 거절할까요?"
        body="거절하면 이 팀과는 다시 만날 수 없어요."
        primary="다시 생각해볼게요"
        secondary={matchingAction === 'reject' ? '거절 중...' : '거절할래요'}
        onPrimary={() => setRejectVisible(false)}
        onSecondary={confirmReject}
      />
      <ConfirmModal
        visible={rematchPrompt !== null}
        title={
          rematchPrompt === 'timeout'
            ? '매칭 대기 시간이 종료되었습니다.'
            : '이번 매칭상대와 매칭되지 않았습니다.'
        }
        body={
          remainingRematches === null
            ? '다시 매칭을 진행할까요?'
            : `남은 재매칭 기회는 ${remainingRematches}번입니다.\n다시 매칭을 진행할까요?`
        }
        primary={matchingAction === 'continue' ? '진행 중...' : '네'}
        secondary="아니요"
        onPrimary={continueMatching}
        onSecondary={() => setRematchPrompt(null)}
      />
      <ReportModal
        visible={reportVisible}
        members={reportableMembers}
        target={reportTarget}
        reason={reportReason}
        detail={reportDetail}
        onChangeTarget={setReportTarget}
        onChangeReason={setReportReason}
        onChangeDetail={setReportDetail}
        onSubmit={submitReport}
        submitting={reportSubmitting}
        submitDisabled={
          !roomId || !toExternalId(reportTarget)
        }
        onClose={() => setReportVisible(false)}
      />
      <ConfirmModal
        visible={leaveVisible}
        title="나가기"
        body="정말 나가시겠어요? 한번만 더 생각해보세요!"
        primary="나가기"
        secondary="남아있기"
        onPrimary={confirmLeaveRoom}
        onSecondary={() => setLeaveVisible(false)}
      />
      <NoticeModal
        visible={leaveDeniedVisible}
        body={
          '현재 매칭 중인 상태여서 나가실 수 없습니다.\n매칭 취소 후에 다시 시도해 주세요.'
        }
        onClose={() => setLeaveDeniedVisible(false)}
      />
    </SafeAreaView>
  );
};

type HeaderProps = {
  expanded: boolean;
  roomTitle: string;
  roomCode: string;
  statusText: string;
  members: TeamMember[];
  isLeader: boolean;
  matchState: MatchState;
  teamView: TeamView;
  actionLabel: string;
  canCancel: boolean;
  actionPending: boolean;
  onToggle: () => void;
  onInfo: () => void;
  onStart: () => void;
  onAccept: () => void;
  onCancel: () => void;
  onReject: () => void;
  onToggleTeamView: () => void;
  onGoGeneralChat: () => void;
};

const RoomHeader = ({
  expanded,
  roomTitle,
  roomCode,
  statusText,
  members,
  isLeader,
  matchState,
  teamView,
  actionLabel,
  canCancel,
  actionPending,
  onToggle,
  onInfo,
  onStart,
  onAccept,
  onCancel,
  onReject,
  onToggleTeamView,
  onGoGeneralChat,
}: HeaderProps) => {
  const showLeaderActions =
    expanded &&
    isLeader &&
    ['waiting', 'matching', 'offer'].includes(matchState);
  const showOfferActions = expanded && isLeader && matchState === 'offer';
  const showSingleAction =
    expanded && ['waitingOpponent', 'matched'].includes(matchState);
  const cancelEnabled =
    canCancel && matchState === 'matching' && !actionPending;

  const handlePrimaryAction = () => {
    if (matchState === 'waiting') onStart();
    if (matchState === 'offer') onAccept();
    if (matchState === 'matched') onGoGeneralChat();
  };

  return (
    <View style={[styles.headerCard, expanded && styles.headerCardExpanded]}>
      <TouchableOpacity activeOpacity={0.9} onPress={onToggle}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {roomTitle}
            </Text>
            {expanded && Boolean(roomCode) && (
              <Text style={styles.roomCode}>
                방코드번호&nbsp;&nbsp;{roomCode}
              </Text>
            )}
          </View>
          <Text style={styles.headerStatus}>{statusText}</Text>
          <TouchableOpacity style={styles.infoButton} onPress={onInfo}>
            <Text style={styles.infoButtonText}>!</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {expanded && (
        <>
          {['offer', 'waitingOpponent', 'matched'].includes(matchState) && (
            <TouchableOpacity
              style={teamView === 'mine' ? styles.pinkPill : styles.bluePill}
              onPress={onToggleTeamView}
            >
              <Text style={styles.teamToggleText}>
                {teamView === 'mine' ? '상대팀 보기' : '내 팀 보기'}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.memberRow}>
            {members.map(member => (
              <View key={member.id} style={styles.memberItem}>
                <Avatar uri={member.profileImage} />
                <Text style={styles.memberName} numberOfLines={1}>
                  {member.leader ? '🎩 ' : ''}
                  {member.name}
                </Text>
              </View>
            ))}
          </View>

          {showLeaderActions && !showOfferActions && (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[
                  styles.headerActionButton,
                  (matchState !== 'waiting' || actionPending) &&
                    styles.disabledActionButton,
                ]}
                onPress={handlePrimaryAction}
                disabled={matchState !== 'waiting' || actionPending}
              >
                <Text style={styles.headerActionText}>{actionLabel}</Text>
              </TouchableOpacity>
              <View style={styles.actionWithHint}>
                <TouchableOpacity
                  style={[
                    styles.headerActionButton,
                    !cancelEnabled && styles.disabledActionButton,
                  ]}
                  onPress={onCancel}
                  disabled={!cancelEnabled}
                >
                  <Text style={styles.headerActionText}>매칭 취소</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {showOfferActions && (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[
                  styles.headerActionButton,
                  actionPending && styles.disabledActionButton,
                ]}
                onPress={onAccept}
                disabled={actionPending}
              >
                <Text style={styles.headerActionText}>매칭 수락</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.headerActionButton,
                  actionPending && styles.disabledActionButton,
                ]}
                onPress={onReject}
                disabled={actionPending}
              >
                <Text style={styles.headerActionText}>매칭 거절</Text>
              </TouchableOpacity>
            </View>
          )}

          {showSingleAction && (
            <TouchableOpacity
              style={[
                styles.singleHeaderAction,
                matchState === 'waitingOpponent' && styles.disabledActionButton,
              ]}
              onPress={matchState === 'matched' ? onGoGeneralChat : undefined}
              disabled={matchState === 'waitingOpponent'}
            >
              <Text style={styles.headerActionText}>
                {matchState === 'matched' ? '채팅방으로' : '응답 대기 중'}
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}

      <TouchableOpacity style={styles.chevronWrap} onPress={onToggle}>
        <Text style={styles.chevron}>{expanded ? '⌃' : '⌄'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const Avatar = ({ uri }: { uri?: string }) =>
  uri ? (
    <Image source={{ uri }} style={styles.avatarImage} />
  ) : (
    <View style={styles.avatar}>
      <View style={styles.avatarHead} />
      <View style={styles.avatarBody} />
    </View>
  );

const BubbleMessage = ({
  message,
}: {
  message: Extract<ChatMessage, { type: 'message' }>;
}) => (
  <View style={[styles.messageRow, message.mine && styles.myMessageRow]}>
    {!message.mine && <Avatar />}
    <View
      style={[
        styles.bubble,
        message.mine && styles.myBubble,
        message.tone === 'pink' && styles.pinkBubble,
        message.tone === 'blue' && styles.blueBubble,
      ]}
    >
      <Text style={styles.bubbleText}>{message.text}</Text>
      <Text style={styles.bubbleTime}>{message.time}</Text>
    </View>
  </View>
);

const SystemMessage = ({
  message,
  onMatchedPress,
}: {
  message: Extract<ChatMessage, { type: 'system' }>;
  onMatchedPress: () => void;
}) => (
  <View style={styles.systemMessage}>
    <Text style={styles.systemText}>{message.text}</Text>
    {message.kind === 'matched' && (
      <TouchableOpacity style={styles.systemButton} onPress={onMatchedPress}>
        <Text style={styles.systemButtonText}>대화하기</Text>
      </TouchableOpacity>
    )}
  </View>
);

const ModalShell = ({
  visible,
  children,
}: {
  visible: boolean;
  children: React.ReactNode;
}) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalBackdrop}>
      <View style={styles.modalCard}>{children}</View>
    </View>
  </Modal>
);

const InfoModal = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => (
  <ModalShell visible={visible}>
    <View style={styles.infoIcon}>
      <Text style={styles.infoIconText}>!</Text>
    </View>
    <Text style={styles.modalSmallTitle}>매칭 상태</Text>
    <Text style={styles.modalBody}>
      대기 중 : 아직 방장이 매칭 시작하지 않았어요.{'\n'}
      매칭 중 : 매칭이 되길 기다리는 중이에요.{'\n'}
      상대가 제안하면 수락 가능해요.{'\n'}
      상대팀 보기 : 매칭이 완료되어 상대팀 프로필을 볼 수 있어요.
    </Text>
    <TouchableOpacity style={styles.modalPrimaryWide} onPress={onClose}>
      <Text style={styles.modalButtonText}>확인</Text>
    </TouchableOpacity>
  </ModalShell>
);

const ConfirmModal = ({
  visible,
  title,
  body,
  primary,
  secondary,
  onPrimary,
  onSecondary,
}: {
  visible: boolean;
  title: string;
  body: string;
  primary: string;
  secondary: string;
  onPrimary: () => void;
  onSecondary: () => void;
}) => (
  <ModalShell visible={visible}>
    <Text style={styles.modalTitle}>{title}</Text>
    <Text style={styles.modalBody}>{body}</Text>
    <View style={styles.modalButtonRow}>
      <TouchableOpacity style={styles.modalPrimary} onPress={onPrimary}>
        <Text style={styles.modalButtonText}>{primary}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.modalSecondary} onPress={onSecondary}>
        <Text style={styles.modalButtonText}>{secondary}</Text>
      </TouchableOpacity>
    </View>
  </ModalShell>
);

const NoticeModal = ({
  visible,
  body,
  onClose,
}: {
  visible: boolean;
  body: string;
  onClose: () => void;
}) => (
  <ModalShell visible={visible}>
    <Text style={styles.modalBodyStrong}>{body}</Text>
    <TouchableOpacity style={styles.modalPrimaryCentered} onPress={onClose}>
      <Text style={styles.modalButtonText}>확인</Text>
    </TouchableOpacity>
  </ModalShell>
);

const ReportModal = ({
  visible,
  members,
  target,
  reason,
  detail,
  onChangeTarget,
  onChangeReason,
  onChangeDetail,
  onSubmit,
  submitting,
  submitDisabled,
  onClose,
}: {
  visible: boolean;
  members: TeamMember[];
  target: string;
  reason: ReportReason;
  detail: string;
  onChangeTarget: (value: string) => void;
  onChangeReason: (value: ReportReason) => void;
  onChangeDetail: (value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitDisabled: boolean;
  onClose: () => void;
}) => {
  const [targetOpen, setTargetOpen] = useState(false);
  const reportTargets = members.filter(member => !member.self);
  const selectedTarget = reportTargets.find(member => member.id === target);

  useEffect(() => {
    if (!visible) {
      setTargetOpen(false);
    }
  }, [visible]);

  return (
    <ModalShell visible={visible}>
      <ScrollView style={styles.reportScroll} showsVerticalScrollIndicator>
        <Text style={styles.reportTitle}>신고</Text>
        <TouchableOpacity
          style={[styles.selectBox, targetOpen && styles.selectBoxOpen]}
          onPress={() => setTargetOpen(prev => !prev)}
          activeOpacity={0.8}
        >
          <Text style={styles.selectText}>
            {selectedTarget?.name ?? '신고 대상 선택'}
          </Text>
          <Text style={styles.selectArrow}>⌄</Text>
        </TouchableOpacity>
        {targetOpen && (
          <View style={styles.targetDropdown}>
            {reportTargets.map((member, index) => (
              <TouchableOpacity
                key={member.id}
                style={[
                  styles.targetDropdownItem,
                  index !== reportTargets.length - 1 &&
                    styles.targetDropdownDivider,
                ]}
                onPress={() => {
                  onChangeTarget(member.id);
                  setTargetOpen(false);
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.targetOption,
                    target === member.id && styles.targetOptionActive,
                  ]}
                >
                  {member.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {REPORT_REASON_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.value}
            style={styles.radioRow}
            onPress={() => onChangeReason(option.value)}
          >
            <View
              style={[
                styles.radioCircle,
                reason === option.value && styles.radioCircleOn,
              ]}
            />
            <Text style={styles.radioText}>{option.label}</Text>
          </TouchableOpacity>
        ))}
        <TextInput
          style={styles.reportInput}
          value={detail}
          onChangeText={onChangeDetail}
          maxLength={REPORT_DETAIL_MAX_LENGTH}
          placeholder="상세 내용"
          placeholderTextColor="#B8B8B8"
          multiline
        />
        <Text style={styles.reportHelp}>
          {submitDisabled
            ? '채팅방 또는 신고 대상 정보를 확인할 수 없어 제출할 수 없어요.'
            : '신고 대상과 사유를 확인해 주세요.'}
        </Text>
        <View style={styles.modalButtonRow}>
          <TouchableOpacity
            style={[
              styles.modalPrimary,
              (submitDisabled || submitting) && styles.reportSubmitDisabled,
            ]}
            onPress={onSubmit}
            disabled={submitDisabled || submitting}
          >
            <Text style={styles.modalButtonText}>
              {submitting ? '신고 중...' : '신고하기'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalSecondary} onPress={onClose}>
            <Text style={styles.modalButtonText}>취소하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ModalShell>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  headerCard: {
    borderWidth: 1,
    borderColor: '#111111',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
    marginHorizontal: 20,
  },
  headerCardExpanded: { paddingBottom: 26 },
  headerTopRow: { flexDirection: 'row', alignItems: 'flex-start' },
  headerTitleWrap: { flex: 1, minWidth: 0 },
  headerTitle: {
    color: '#111111',
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 32,
  },
  roomCode: { color: '#111111', fontSize: 13, fontWeight: '600', marginTop: 4 },
  headerStatus: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
    marginHorizontal: 14,
  },
  infoButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
  },
  infoButtonText: { color: '#111111', fontSize: 18, fontWeight: '900' },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  memberItem: { width: 64, alignItems: 'center' },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#B7BBC1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  avatarImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F2F2F2',
  },
  avatarHead: {
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#B7BBC1',
    marginBottom: 3,
  },
  avatarBody: {
    width: 28,
    height: 13,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: '#B7BBC1',
  },
  memberName: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 5,
  },
  chevronWrap: { position: 'absolute', bottom: -14, alignSelf: 'center' },
  chevron: { color: '#B9B9B9', fontSize: 28, lineHeight: 28 },
  pinkPill: {
    position: 'absolute',
    right: 54,
    top: 16,
    borderRadius: 14,
    backgroundColor: '#FFE6EA',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  bluePill: {
    position: 'absolute',
    right: 54,
    top: 16,
    borderRadius: 14,
    backgroundColor: '#DDF2FF',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  teamToggleText: { color: '#111111', fontSize: 14, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 46, marginTop: 18 },
  headerActionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: '#FFAFBF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledActionButton: { backgroundColor: '#DEDEDE' },
  actionWithHint: { flex: 1, position: 'relative' },
  headerActionText: { color: '#111111', fontSize: 16, fontWeight: '800' },
  singleHeaderAction: {
    alignSelf: 'center',
    width: 188,
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: '#FFAFBF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  messagesScroll: { flex: 1 },
  messagesContent: { paddingHorizontal: 28, paddingTop: 44, paddingBottom: 20 },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 10,
  },
  myMessageRow: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '76%',
    minHeight: 38,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D0D5DB',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  myBubble: { borderColor: '#FFCED7' },
  pinkBubble: { backgroundColor: '#FFE2E6' },
  blueBubble: { backgroundColor: '#D8F0FF', borderColor: '#A9D7F2' },
  bubbleText: { color: '#222222', fontSize: 16 },
  bubbleTime: { color: '#7A91A3', fontSize: 11, marginTop: 3 },
  systemMessage: {
    alignSelf: 'center',
    maxWidth: '90%',
    borderRadius: 12,
    backgroundColor: '#F6F6F6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
  },
  systemText: {
    color: '#333333',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 19,
  },
  systemButton: {
    alignSelf: 'center',
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: '#FFAFBF',
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  systemButtonText: { color: '#111111', fontSize: 14, fontWeight: '800' },
  acceptTimer: {
    marginHorizontal: 20,
    marginBottom: 6,
    borderRadius: 8,
    backgroundColor: '#FFF1F4',
    paddingVertical: 8,
  },
  acceptTimerText: {
    color: '#FF6678',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  actionSheet: {
    marginHorizontal: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: '#888888',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 80,
    paddingVertical: 18,
  },
  actionSheetItem: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 64,
  },
  actionSheetIconBox: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSheetIcon: {
    color: '#111111',
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 36,
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  actionSheetIconImage: { width: 34, height: 34, resizeMode: 'contain' },
  actionSheetText: {
    color: '#111111',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#888888',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#909090',
    paddingHorizontal: 12,
    color: '#111111',
    fontSize: 15,
  },
  sendButton: {
    position: 'absolute',
    right: 54,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonImage: { width: 22, height: 22, resizeMode: 'contain' },
  moreButton: {
    width: 36,
    height: 36,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#999999',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreButtonText: {
    color: '#777777',
    fontSize: 24,
    lineHeight: 25,
    fontWeight: '900',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#00000014',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '90%',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    padding: 22,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  infoIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FFE6EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  infoIconText: { color: '#111111', fontSize: 16, fontWeight: '900' },
  modalSmallTitle: {
    color: '#001A44',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  modalTitle: {
    color: '#001A44',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 10,
  },
  reportTitle: {
    color: '#001A44',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
  },
  reportScroll: { flexShrink: 1 },
  modalBody: {
    color: '#46506A',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  modalBodyStrong: {
    color: '#001A44',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 20,
  },
  modalButtonRow: { flexDirection: 'row', gap: 18 },
  modalPrimary: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#FFAFBF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportSubmitDisabled: { opacity: 0.5 },
  modalPrimaryWide: {
    height: 44,
    borderRadius: 6,
    backgroundColor: '#FFAFBF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryCentered: {
    alignSelf: 'center',
    width: 134,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#FFAFBF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondary: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#E3E3E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: { color: '#111111', fontSize: 16, fontWeight: '800' },
  selectBox: {
    height: 40,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#AEB3BA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  selectBoxOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 0,
  },
  selectText: { color: '#555555', fontSize: 15, fontWeight: '700' },
  selectArrow: { color: '#222222', fontSize: 22 },
  targetDropdown: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#AEB3BA',
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    overflow: 'hidden',
  },
  targetDropdownItem: {
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  targetDropdownDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  targetOption: { color: '#555555', fontSize: 14, fontWeight: '700' },
  targetOptionActive: { color: '#FF6678', fontWeight: '900' },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  radioCircle: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FF7E8D',
  },
  radioCircleOn: { borderWidth: 6 },
  radioText: { color: '#222222', fontSize: 16, fontWeight: '700' },
  reportInput: {
    height: 78,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D8D8D8',
    paddingHorizontal: 12,
    paddingTop: 10,
    color: '#111111',
    fontSize: 15,
    textAlignVertical: 'top',
  },
  reportHelp: {
    color: '#6D7890',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 12,
  },
});

export default MeetingTeamChatScreen;
