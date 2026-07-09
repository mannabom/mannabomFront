import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { chatApiService } from '../../services/ChatApiService';
import { chatSocketService } from '../../services/ChatSocketService';
import { ChatMessageDTO, ChatRoomStatus, ChatRoomType } from '../../types/ChatAPI';
import { getProfileId } from '../../utils/AuthUtils';

const sendIconImg = require('../../assets/images/Send.png');
const reportIconImg = require('../../assets/images/report.png');

const isMockRoomId = (value: string) => value.startsWith('mock-');

type MatchState = 'waiting' | 'matching' | 'offer' | 'waitingOpponent' | 'matched';
type TeamView = 'mine' | 'opponent';
type SystemKind = 'arrival' | 'rejected' | 'matched' | 'started' | 'cancelled';

type TeamMember = {
  id: string;
  name: string;
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
  | { id: string; type: 'system'; kind: SystemKind; text: string };

const TEAM_MEMBERS: TeamMember[] = [
  { id: 'me', name: '나', self: true },
  { id: 'leader', name: 'ㅇㅇㅇ', leader: true },
  { id: 'mate-1', name: 'ㅇㅇㅇ' },
  { id: 'mate-2', name: 'ㅇㅇㅇ' },
];

const OPPONENT_MEMBERS: TeamMember[] = [
  { id: 'opp-1', name: 'ㅇㅇㅇ' },
  { id: 'opp-2', name: 'ㅇㅇㅇ' },
  { id: 'opp-3', name: 'ㅇㅇㅇ' },
  { id: 'opp-4', name: 'ㅇㅇㅇ' },
];

const INITIAL_MESSAGES: ChatMessage[] = [];

const SYSTEM_COPY: Record<SystemKind, string> = {
  arrival: '새로운 상대 팀이 자동 매칭되었습니다. 제한 시간 안에 매칭을 수락해주세요.',
  rejected: '상대팀이 먼저 거절하여 이번 매칭은 성사되지 않았습니다.',
  matched: '양쪽 팀이 모두 수락하여 미팅이 성사되었습니다.',
  started: '팀장이 매칭을 시작했습니다.',
  cancelled: '팀장이 매칭을 취소했습니다.',
};

const formatMessageTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).toLowerCase();
};

const normalizeIncomingMessage = (
  raw: ChatMessageDTO | any,
  currentUserId?: string | null,
): ChatMessage | null => {
  const messageId = raw?.messageId ?? raw?.id ?? raw?.clientMessageId;
  const messageContent = raw?.messageContent ?? raw?.content;
  if (!messageId || typeof messageContent !== 'string') return null;

  const mine = Boolean(currentUserId && String(raw?.senderId) === String(currentUserId));
  return {
    id: String(messageId),
    serverId: String(raw?.messageId ?? messageId),
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
  const roomId = String(route.params?.roomId ?? '');
  const roomType = String(route.params?.roomType ?? 'TEAM') as ChatRoomType;
  const [expanded, setExpanded] = useState(false);
  const [matchState, setMatchState] = useState<MatchState>('waiting');
  const [teamView, setTeamView] = useState<TeamView>('mine');
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [chatRoomStatus, setChatRoomStatus] = useState<ChatRoomStatus>('ACTIVE');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const lastChatSyncTimeRef = useRef<string | null>(null);

  const [infoVisible, setInfoVisible] = useState(false);
  const [cancelVisible, setCancelVisible] = useState(false);
  const [rejectVisible, setRejectVisible] = useState(false);
  const [rejectDoneVisible, setRejectDoneVisible] = useState(false);
  const [actionVisible, setActionVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [leaveVisible, setLeaveVisible] = useState(false);
  const [leaveDeniedVisible, setLeaveDeniedVisible] = useState(false);
  const [reportTarget, setReportTarget] = useState(TEAM_MEMBERS[1].id);
  const [reportReason, setReportReason] = useState('폭언, 욕설 등 언어폭력');

  const isLeader = true;
  const roomTitle = roomType === 'MEETING' ? '임시 방제목 아무거나(미팅)' : '임시 방제목 아무거나';
  const roomCode = '□□□□';
  const statusText =
    matchState === 'matched'
      ? '매칭 완료'
      : matchState === 'matching' || matchState === 'offer' || matchState === 'waitingOpponent'
        ? '매칭 중'
        : '대기중';
  const matched = matchState === 'matched' || chatRoomStatus !== 'ACTIVE';
  const canCancel = false;
  const visibleMembers = teamView === 'opponent' ? OPPONENT_MEMBERS : TEAM_MEMBERS;

  const actionLabel = useMemo(() => {
    if (matchState === 'matched') return '채팅방으로';
    if (matchState === 'waitingOpponent') return '응답 대기 중';
    if (matchState === 'offer') return '매칭 수락';
    return '매칭 신청';
  }, [matchState]);

  const pushSystem = (kind: SystemKind) => {
    setMessages(prev => [
      ...prev,
      {
        id: `system-${Date.now()}-${kind}`,
        type: 'system',
        kind,
        text: SYSTEM_COPY[kind],
      },
    ]);
  };

  const syncMessages = useCallback(async () => {
    if (!roomId) return;

    try {
      const nextUserId = await getProfileId();
      setCurrentUserId(nextUserId);
      const result = await chatApiService.syncChatRoomMessages(
        roomId,
        lastChatSyncTimeRef.current,
      );
      lastChatSyncTimeRef.current = result.lastSyncTime || lastChatSyncTimeRef.current;
      setChatRoomStatus(result.chatRoomStatus);
      const normalized = result.messages
        .map(message => normalizeIncomingMessage(message, nextUserId))
        .filter((message): message is ChatMessage => Boolean(message));
      setMessages(normalized.length ? normalized : []);
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
              if (prev.some(message => message.id === normalized.id)) return prev;
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

  useEffect(() => {
    const lastReadMessage = [...messages]
      .reverse()
      .find(message => message.type === 'message' && message.serverId);

    if (!roomId || !lastReadMessage || lastReadMessage.type !== 'message' || !lastReadMessage.serverId) {
      return;
    }

    chatApiService.markRoomRead({
      chatRoomId: roomId,
      lastReadMessageId: lastReadMessage.serverId,
    }).catch(error => {
      if (__DEV__) console.warn('Failed to mark chat room read', error);
    });
  }, [messages, roomId]);

  const startMatching = () => {
    if (!isLeader || matchState !== 'waiting') return;
    setMatchState('matching');
    pushSystem('started');
  };

  const acceptMatch = () => {
    if (matchState !== 'offer') return;
    setMatchState('waitingOpponent');
  };

  const confirmReject = () => {
    setRejectVisible(false);
    setMatchState('matching');
    pushSystem('rejected');
    setRejectDoneVisible(true);
  };

  const continueMatching = () => {
    setRejectDoneVisible(false);
    setMatchState('matching');
  };

  const confirmCancel = () => {
    setCancelVisible(false);
    setMatchState('waiting');
    pushSystem('cancelled');
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
    if (!roomId) {
      setLeaveVisible(false);
      navigation.goBack();
      return;
    }

    if (isMockRoomId(roomId)) {
      setLeaveVisible(false);
      navigation.goBack();
      return;
    }

    try {
      await chatApiService.leaveRoom(roomId);
      setLeaveVisible(false);
      navigation.goBack();
    } catch (error) {
      if (__DEV__) console.warn('Failed to leave chat room', error);
      Alert.alert('오류', '채팅방 나가기에 실패했어요.');
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
      <Pressable style={styles.screen} onPress={() => expanded && setExpanded(false)}>
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
            onToggle={() => setExpanded(prev => !prev)}
            onInfo={() => setInfoVisible(true)}
            onStart={startMatching}
            onAccept={acceptMatch}
            onCancel={() => canCancel && setCancelVisible(true)}
            onReject={() => setRejectVisible(true)}
            onToggleTeamView={() => setTeamView(prev => (prev === 'mine' ? 'opponent' : 'mine'))}
            onGoGeneralChat={() => navigation.goBack()}
          />
        </Pressable>

        <ScrollView style={styles.messagesScroll} contentContainerStyle={styles.messagesContent}>
          {messages.map(message =>
            message.type === 'system' ? (
              <SystemMessage key={message.id} message={message} />
            ) : (
              <BubbleMessage key={message.id} message={message} />
            ),
          )}
        </ScrollView>

        {matchState === 'offer' && (
          <View style={styles.acceptTimer}>
            <Text style={styles.acceptTimerText}>매칭 수락 가능 시간 09:59</Text>
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
              <Image source={reportIconImg} style={styles.actionSheetIconImage} />
              <Text style={styles.actionSheetText}>신고</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionSheetItem} onPress={handleLeaveRequest}>
              <Text style={styles.actionSheetIcon}>↪</Text>
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
          <TouchableOpacity style={styles.sendButton} onPress={submitMessage} disabled={matched}>
            <Image source={sendIconImg} style={styles.sendButtonImage} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.moreButton} onPress={() => setActionVisible(prev => !prev)}>
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
        secondary="취소할래요"
        onPrimary={() => setCancelVisible(false)}
        onSecondary={confirmCancel}
      />
      <ConfirmModal
        visible={rejectVisible}
        title="정말 거절할까요?"
        body={'거절하면 이 팀과는 다시 만날 수 없어요\n재매칭 기회가 2번 남았습니다.'}
        primary="다시 생각해볼게요"
        secondary="거절할래요"
        onPrimary={() => setRejectVisible(false)}
        onSecondary={confirmReject}
      />
      <ConfirmModal
        visible={rejectDoneVisible}
        title="이번 매칭상대를 거절하셨습니다."
        body="다시 매칭을 진행할까요?"
        primary="네"
        secondary="아니요"
        onPrimary={continueMatching}
        onSecondary={() => setRejectDoneVisible(false)}
      />
      <ReportModal
        visible={reportVisible}
        target={reportTarget}
        reason={reportReason}
        onChangeTarget={setReportTarget}
        onChangeReason={setReportReason}
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
        body={'현재 매칭 중인 상태여서 나가실 수 없습니다.\n매칭 취소 후에 다시 시도해 주세요.'}
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
  onToggle,
  onInfo,
  onStart,
  onAccept,
  onCancel,
  onReject,
  onToggleTeamView,
  onGoGeneralChat,
}: HeaderProps) => {
  const showLeaderActions = expanded && isLeader && ['waiting', 'matching', 'offer'].includes(matchState);
  const showOfferActions = expanded && matchState === 'offer';
  const showSingleAction = expanded && ['waitingOpponent', 'matched'].includes(matchState);
  const cancelEnabled = canCancel && matchState === 'matching';

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
            {expanded && <Text style={styles.roomCode}>방코드번호&nbsp;&nbsp;{roomCode}</Text>}
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
            <TouchableOpacity style={teamView === 'mine' ? styles.pinkPill : styles.bluePill} onPress={onToggleTeamView}>
              <Text style={styles.teamToggleText}>{teamView === 'mine' ? '상대팀 보기' : '내 팀 보기'}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.memberRow}>
            {members.map(member => (
              <View key={member.id} style={styles.memberItem}>
                <Avatar />
                <Text style={styles.memberName} numberOfLines={1}>
                  {member.leader ? '🎩 ' : ''}{member.name}
                </Text>
              </View>
            ))}
          </View>

          {showLeaderActions && !showOfferActions && (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.headerActionButton, matchState !== 'waiting' && styles.disabledActionButton]}
                onPress={handlePrimaryAction}
                disabled={matchState !== 'waiting'}
              >
                <Text style={styles.headerActionText}>{actionLabel}</Text>
              </TouchableOpacity>
              <View style={styles.actionWithHint}>
                {matchState === 'matching' && !cancelEnabled && (
                  <Text style={styles.cancelHint}>2시간 이후부터 취소 가능해요 !</Text>
                )}
                <TouchableOpacity
                  style={[styles.headerActionButton, !cancelEnabled && styles.disabledActionButton]}
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
              <TouchableOpacity style={styles.headerActionButton} onPress={onAccept}>
                <Text style={styles.headerActionText}>매칭 수락</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.headerActionButton, styles.disabledActionButton]} onPress={onReject}>
                <Text style={styles.headerActionText}>매칭 거절</Text>
                <Text style={styles.rejectCountText}>거절 가능 횟수:1</Text>
              </TouchableOpacity>
            </View>
          )}

          {showSingleAction && (
            <TouchableOpacity
              style={[styles.singleHeaderAction, matchState === 'waitingOpponent' && styles.disabledActionButton]}
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

const Avatar = () => (
  <View style={styles.avatar}>
    <View style={styles.avatarHead} />
    <View style={styles.avatarBody} />
  </View>
);

const BubbleMessage = ({ message }: { message: Extract<ChatMessage, { type: 'message' }> }) => (
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

const SystemMessage = ({ message }: { message: Extract<ChatMessage, { type: 'system' }> }) => (
  <View style={styles.systemMessage}>
    <Text style={styles.systemText}>{message.text}</Text>
    {message.kind === 'matched' && (
      <TouchableOpacity style={styles.systemButton}>
        <Text style={styles.systemButtonText}>대화하기</Text>
      </TouchableOpacity>
    )}
  </View>
);

const ModalShell = ({ visible, children }: { visible: boolean; children: React.ReactNode }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalBackdrop}>
      <View style={styles.modalCard}>{children}</View>
    </View>
  </Modal>
);

const InfoModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
  <ModalShell visible={visible}>
    <View style={styles.infoIcon}><Text style={styles.infoIconText}>!</Text></View>
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

const NoticeModal = ({ visible, body, onClose }: { visible: boolean; body: string; onClose: () => void }) => (
  <ModalShell visible={visible}>
    <Text style={styles.modalBodyStrong}>{body}</Text>
    <TouchableOpacity style={styles.modalPrimaryCentered} onPress={onClose}>
      <Text style={styles.modalButtonText}>확인</Text>
    </TouchableOpacity>
  </ModalShell>
);

const ReportModal = ({
  visible,
  target,
  reason,
  onChangeTarget,
  onChangeReason,
  onClose,
}: {
  visible: boolean;
  target: string;
  reason: string;
  onChangeTarget: (value: string) => void;
  onChangeReason: (value: string) => void;
  onClose: () => void;
}) => {
  const reasons = ['폭언, 욕설 등 언어폭력', '나체, 성적인 이미지', '과도한 개인정보 요구', '기타'];
  const [targetOpen, setTargetOpen] = useState(false);
  const reportTargets = TEAM_MEMBERS.filter(member => !member.self);
  const selectedTarget = reportTargets.find(member => member.id === target);

  useEffect(() => {
    if (!visible) {
      setTargetOpen(false);
    }
  }, [visible]);

  return (
    <ModalShell visible={visible}>
      <Text style={styles.reportTitle}>신고</Text>
      <TouchableOpacity
        style={[styles.selectBox, targetOpen && styles.selectBoxOpen]}
        onPress={() => setTargetOpen(prev => !prev)}
        activeOpacity={0.8}
      >
        <Text style={styles.selectText}>{selectedTarget?.name ?? 'ㅇㅇㅇ'}</Text>
        <Text style={styles.selectArrow}>⌄</Text>
      </TouchableOpacity>
      {targetOpen && (
        <View style={styles.targetDropdown}>
          {reportTargets.map((member, index) => (
            <TouchableOpacity
              key={member.id}
              style={[
                styles.targetDropdownItem,
                index !== reportTargets.length - 1 && styles.targetDropdownDivider,
              ]}
              onPress={() => {
                onChangeTarget(member.id);
                setTargetOpen(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.targetOption, target === member.id && styles.targetOptionActive]}>
                {member.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {reasons.map(item => (
        <TouchableOpacity key={item} style={styles.radioRow} onPress={() => onChangeReason(item)}>
          <View style={[styles.radioCircle, reason === item && styles.radioCircleOn]} />
          <Text style={styles.radioText}>{item}</Text>
        </TouchableOpacity>
      ))}
      <TextInput
        style={styles.reportInput}
        placeholder="상세 내용"
        placeholderTextColor="#B8B8B8"
        multiline
      />
      <Text style={styles.reportHelp}>신고 대상과 사유를 선택해주세요!</Text>
      <View style={styles.modalButtonRow}>
        <TouchableOpacity style={styles.modalPrimary} onPress={onClose}>
          <Text style={styles.modalButtonText}>신고하기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.modalSecondary} onPress={onClose}>
          <Text style={styles.modalButtonText}>취소하기</Text>
        </TouchableOpacity>
      </View>
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
  headerTitle: { color: '#111111', fontSize: 24, fontWeight: '900', lineHeight: 32 },
  roomCode: { color: '#111111', fontSize: 13, fontWeight: '600', marginTop: 4 },
  headerStatus: { color: '#111111', fontSize: 15, fontWeight: '700', marginTop: 8, marginHorizontal: 14 },
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
  memberRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
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
  memberName: { color: '#111111', fontSize: 16, fontWeight: '800', marginTop: 5 },
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
  cancelHint: {
    position: 'absolute',
    left: -16,
    right: -16,
    bottom: 48,
    color: '#FF6F7D',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerActionText: { color: '#111111', fontSize: 16, fontWeight: '800' },
  rejectCountText: { color: '#999999', fontSize: 11, fontWeight: '700', marginTop: 2 },
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
  messageRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 10 },
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
  systemText: { color: '#333333', fontSize: 13, fontWeight: '700', textAlign: 'center', lineHeight: 19 },
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
  acceptTimerText: { color: '#FF6678', fontSize: 13, fontWeight: '800', textAlign: 'center' },
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
  actionSheetItem: { alignItems: 'center' },
  actionSheetIcon: { color: '#111111', fontSize: 34, fontWeight: '900' },
  actionSheetIconImage: { width: 34, height: 34, resizeMode: 'contain' },
  actionSheetText: { color: '#111111', fontSize: 13, marginTop: 4 },
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
  moreButtonText: { color: '#777777', fontSize: 24, lineHeight: 25, fontWeight: '900' },
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
  modalSmallTitle: { color: '#001A44', fontSize: 14, fontWeight: '800', marginBottom: 8 },
  modalTitle: { color: '#001A44', fontSize: 18, fontWeight: '900', marginBottom: 10 },
  reportTitle: { color: '#001A44', fontSize: 24, fontWeight: '900', marginBottom: 8 },
  modalBody: { color: '#46506A', fontSize: 15, lineHeight: 22, marginBottom: 20 },
  modalBodyStrong: { color: '#001A44', fontSize: 17, fontWeight: '800', lineHeight: 24, marginBottom: 20 },
  modalButtonRow: { flexDirection: 'row', gap: 18 },
  modalPrimary: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#FFAFBF',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
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
  reportHelp: { color: '#6D7890', fontSize: 14, fontWeight: '700', marginTop: 10, marginBottom: 12 },
});

export default MeetingTeamChatScreen;
