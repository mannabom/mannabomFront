import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  PermissionsAndroid,
  Platform,
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
import {
  NaverMapMarkerOverlay,
  NaverMapView,
  type Camera,
} from '@mj-studio/react-native-naver-map';
import { chatApiService } from '../../services/ChatApiService';
import { chatSocketService } from '../../services/ChatSocketService';
import { ChatMessageDTO, ChatRoomStatus } from '../../types/ChatAPI';
import { getProfileId } from '../../utils/AuthUtils';
import { PickedChatPhoto, showChatPhotoPicker } from '../../utils/ChatPhotoPicker';

const sendIconImg = require('../../assets/images/Send.png');
const photoIconImg = require('../../assets/images/photo.png');
const reportIconImg = require('../../assets/images/report.png');
const verificationIconImg = require('../../assets/images/verification.png');
const cancelIconImg = require('../../assets/images/cancel.png');

const isMockRoomId = (value: string) => value.startsWith('mock-');

type GeneralSystemKind =
  | 'cancelVote'
  | 'cancelVoteDone'
  | 'cancelAllAgreed'
  | 'cancelRejected'
  | 'verifyStart'
  | 'verifySuccess'
  | 'verifyFailed';

type VoteChoice = '동의' | '미동의';

type GeneralMessage =
  | {
      id: string;
      serverId?: string;
      type: 'message';
      mine?: boolean;
      tone?: 'pink' | 'blue';
      text: string;
      time: string;
      photoUri?: string;
    }
  | {
      id: string;
      type: 'system';
      kind: GeneralSystemKind;
      voteChoice?: VoteChoice;
    };

type MeetingMember = {
  id: string;
  name: string;
  self?: boolean;
};

type LocationState = {
  latitude: number;
  longitude: number;
  isDevFallback?: boolean;
} | null;

const DEFAULT_MAP_LOCATION = {
  latitude: 37.5665,
  longitude: 126.978,
};

const DEV_MAP_TEST_LOCATION = {
  latitude: 37.49795,
  longitude: 127.02764,
  isDevFallback: true,
};

const toMapCamera = (location: LocationState): Camera => ({
  latitude: location?.latitude ?? DEFAULT_MAP_LOCATION.latitude,
  longitude: location?.longitude ?? DEFAULT_MAP_LOCATION.longitude,
  zoom: 16,
});

const isValidCoordinate = (latitude: number, longitude: number) =>
  Number.isFinite(latitude) && Number.isFinite(longitude);

const MEMBERS: MeetingMember[] = [
  { id: 'me', name: '나', self: true },
  { id: 'member-1', name: 'ㅇㅇㅇ' },
  { id: 'member-2', name: 'ㅇㅇㅇ' },
  { id: 'member-3', name: 'ㅇㅇㅇ' },
  { id: 'member-4', name: 'ㅇㅇㅇ' },
  { id: 'member-5', name: 'ㅇㅇㅇ' },
  { id: 'member-6', name: 'ㅇㅇㅇ' },
  { id: 'member-7', name: 'ㅇㅇㅇ' },
];

const INITIAL_MESSAGES: GeneralMessage[] = [];

const REPORT_REASONS = [
  '폭언, 욕설 등 언어폭력',
  '나체, 성적인 이미지',
  '과도한 개인정보 요구',
  '기타',
];

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
): GeneralMessage | null => {
  const systemType = String(raw?.systemType ?? raw?.eventType ?? '').toUpperCase();
  const messageType = String(raw?.messageType ?? raw?.type ?? '').toUpperCase();

  if (messageType === 'SYSTEM' || systemType) {
    const kind =
      systemType.includes('VERIFY_SUCCESS') || systemType.includes('CERTIFICATION_SUCCESS')
        ? 'verifySuccess'
        : systemType.includes('VERIFY_FAIL') || systemType.includes('CERTIFICATION_FAIL')
          ? 'verifyFailed'
          : systemType.includes('VERIFY') || systemType.includes('CERTIFICATION')
            ? 'verifyStart'
            : systemType.includes('CANCEL_AGREED')
              ? 'cancelAllAgreed'
              : systemType.includes('CANCEL_REJECT')
                ? 'cancelRejected'
                : 'cancelVote';
    return {
      id: String(raw?.messageId ?? raw?.id ?? `system-${Date.now()}`),
      type: 'system',
      kind,
    };
  }

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
    text: messageType === 'PHOTO' ? '사진을 보냈어요' : messageContent,
    time: formatMessageTime(raw?.timestamp),
    photoUri: messageType === 'PHOTO' ? messageContent : undefined,
  };
};

const MeetingGeneralChatScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const roomId = String(route.params?.roomId ?? '');
  const roomTitle = String(route.params?.roomTitle ?? '임시 방제목');

  const [expanded, setExpanded] = useState(false);
  const [memberPage, setMemberPage] = useState(0);
  const [cancelVoteActive, setCancelVoteActive] = useState(false);
  const [messages, setMessages] = useState<GeneralMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [chatRoomStatus, setChatRoomStatus] = useState<ChatRoomStatus>('ACTIVE');
  const [actionVisible, setActionVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [cancelConfirmVisible, setCancelConfirmVisible] = useState(false);
  const [verifyConfirmVisible, setVerifyConfirmVisible] = useState(false);
  const [locationLoadingVisible, setLocationLoadingVisible] = useState(false);
  const [locationConfirmVisible, setLocationConfirmVisible] = useState(false);
  const [leaveVisible, setLeaveVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [reportDetail, setReportDetail] = useState('');
  const [currentLocation, setCurrentLocation] = useState<LocationState>(null);
  const lastChatSyncTimeRef = useRef<string | null>(null);

  const closed = chatRoomStatus !== 'ACTIVE';
  const visibleMembers = MEMBERS.slice(memberPage * 4, memberPage * 4 + 4);

  const syncMessages = useCallback(async () => {
    if (!roomId) return;

    try {
      const nextUserId = await getProfileId();
      setCurrentUserId(nextUserId);
      const isInitialSync = !lastChatSyncTimeRef.current;
      const result = await chatApiService.syncChatRoomMessages(
        roomId,
        lastChatSyncTimeRef.current,
      );
      lastChatSyncTimeRef.current = result.lastSyncTime || lastChatSyncTimeRef.current;
      setChatRoomStatus(result.chatRoomStatus);
      const normalized = result.messages
        .map(message => normalizeIncomingMessage(message, nextUserId))
        .filter((message): message is GeneralMessage => Boolean(message));
      setMessages(prev => {
        if (isInitialSync) return normalized;
        const existingIds = new Set(prev.map(message => message.id));
        const nextMessages = normalized.filter(message => !existingIds.has(message.id));
        return nextMessages.length ? [...prev, ...nextMessages] : prev;
      });
    } catch (error) {
      if (__DEV__) console.warn('Failed to sync meeting general chat', error);
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
            if (__DEV__) console.warn('Failed to subscribe meeting general chat', error);
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
      if (__DEV__) console.warn('Failed to mark meeting general chat read', error);
    });
  }, [messages, roomId]);

  const sendPhoto = (photo: PickedChatPhoto) => {
    if (closed || !roomId) return;
    const clientMessageId = `photo-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      {
        id: clientMessageId,
        type: 'message',
        mine: true,
        tone: 'pink',
        text: '사진을 보냈어요',
        time: formatMessageTime(new Date().toISOString()),
        photoUri: photo.uri,
      },
    ]);

    chatSocketService
      .sendMessage({
        roomId,
        messageType: 'PHOTO',
        content: photo.content,
        clientMessageId,
      })
      .catch(error => {
        if (__DEV__) console.warn('Failed to send meeting general chat photo', error);
        Alert.alert('오류', '사진 전송에 실패했어요.');
      });
  };

  const submitMessage = () => {
    const trimmed = input.trim();
    if (!trimmed || closed || !roomId) return;
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
        if (__DEV__) console.warn('Failed to send meeting general chat message', error);
        Alert.alert('오류', '메시지 전송에 실패했어요.');
      });
  };

  const startCancelVote = () => {
    setCancelConfirmVisible(false);
    setCancelVoteActive(true);
    setMessages(prev => [
      ...prev,
      {
        id: `cancel-vote-${Date.now()}`,
        type: 'system',
        kind: 'cancelVote',
      },
    ]);
  };

  const chooseCancelVote = (messageId: string, choice: VoteChoice) => {
    setMessages(prev =>
      prev.map(message =>
        message.id === messageId && message.type === 'system'
          ? { ...message, kind: 'cancelVoteDone', voteChoice: choice }
          : message,
      ),
    );
  };

  const requestLocationPermission = async () => {
    if (Platform.OS !== 'android') return true;

    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: '위치 권한',
        message: '만남 인증을 위해 현재 위치 권한이 필요해요.',
        buttonPositive: '허용',
        buttonNegative: '거부',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  const finishLocationRequest = () => {
    setLocationLoadingVisible(false);
    setLocationConfirmVisible(true);
  };

  const requestCurrentLocation = async () => {
    setVerifyConfirmVisible(false);
    setLocationConfirmVisible(false);
    setCurrentLocation(__DEV__ ? DEV_MAP_TEST_LOCATION : null);
    setLocationLoadingVisible(true);

    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      finishLocationRequest();
      return;
    }

    const geolocation = (globalThis as any).navigator?.geolocation;
    if (!geolocation?.getCurrentPosition) {
      setTimeout(finishLocationRequest, 1200);
      return;
    }

    geolocation.getCurrentPosition(
      (position: any) => {
        const latitude = Number(position?.coords?.latitude);
        const longitude = Number(position?.coords?.longitude);
        if (isValidCoordinate(latitude, longitude)) {
          setCurrentLocation({ latitude, longitude });
        }
        finishLocationRequest();
      },
      (error: unknown) => {
        if (__DEV__) console.warn('Failed to get current location', error);
        finishLocationRequest();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const startVerification = () => {
    setVerifyConfirmVisible(false);
    setMessages(prev => [
      ...prev,
      {
        id: `verify-start-${Date.now()}`,
        type: 'system',
        kind: 'verifyStart',
      },
    ]);
    requestCurrentLocation();
  };

  const completeVerification = async () => {
    if (!roomId || !currentLocation) {
      Alert.alert('위치 확인', '현재 위치를 다시 보내주세요.');
      return;
    }

    if (currentLocation.isDevFallback) {
      Alert.alert('지도 확인용', '현재 좌표는 개발용 더미 위치예요. 실제 인증 전송은 실제 위치를 받은 뒤 진행해주세요.');
      return;
    }

    try {
      await chatApiService.verifyMeeting({
        chatRoomId: roomId,
        location: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        },
        timestamp: new Date().toISOString(),
      });
      setLocationConfirmVisible(false);
      Alert.alert('인증 완료', '만남 인증 위치를 보냈어요.');
    } catch (error) {
      if (__DEV__) console.warn('Failed to verify meeting', error);
      Alert.alert('오류', '만남 인증에 실패했어요.');
    }
  };

  const leaveRoom = async () => {
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
      if (__DEV__) console.warn('Failed to leave meeting general chat', error);
      Alert.alert('오류', '채팅방 나가기에 실패했어요.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Pressable style={styles.screen} onPress={() => expanded && setExpanded(false)}>
        <Pressable>
          <MeetingHeader
            expanded={expanded}
            title={roomTitle}
            cancelVoteActive={cancelVoteActive}
            members={visibleMembers}
            hasNextMembers={(memberPage + 1) * 4 < MEMBERS.length}
            onToggle={() => setExpanded(prev => !prev)}
            onInfo={() => setInfoVisible(true)}
            onNextMembers={() => setMemberPage(prev => ((prev + 1) * 4 >= MEMBERS.length ? 0 : prev + 1))}
            onVote={choice => {
              setCancelVoteActive(false);
              setMessages(prev => [
                ...prev,
                {
                  id: `cancel-vote-choice-${Date.now()}`,
                  type: 'system',
                  kind: 'cancelVoteDone',
                  voteChoice: choice,
                },
              ]);
            }}
          />
        </Pressable>

        <ScrollView style={styles.messagesScroll} contentContainerStyle={styles.messagesContent}>
          {messages.map(message =>
            message.type === 'system' ? (
              <GeneralSystemMessage
                key={message.id}
                message={message}
                onVote={choice => chooseCancelVote(message.id, choice)}
                onJoinVerification={requestCurrentLocation}
              />
            ) : (
              <BubbleMessage key={message.id} message={message} />
            ),
          )}
        </ScrollView>

        {actionVisible && (
          <View style={styles.actionSheet}>
            <ActionSheetItem label="사진" iconSource={photoIconImg} onPress={() => {
              setActionVisible(false);
              showChatPhotoPicker(sendPhoto);
            }} />
            <ActionSheetItem label="신고" iconSource={reportIconImg} onPress={() => {
              setActionVisible(false);
              setReportVisible(true);
            }} />
            <ActionSheetItem label="만남 인증" iconSource={verificationIconImg} onPress={() => {
              setActionVisible(false);
              setVerifyConfirmVisible(true);
            }} />
            <ActionSheetItem label="미팅 취소" iconSource={cancelIconImg} onPress={() => {
              setActionVisible(false);
              setCancelConfirmVisible(true);
            }} />
            <ActionSheetItem label="나가기" icon="↪" onPress={() => {
              setActionVisible(false);
              setLeaveVisible(true);
            }} />
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Message"
            editable={!closed}
            placeholderTextColor="#B8B8B8"
          />
          <TouchableOpacity style={styles.sendButton} onPress={submitMessage} disabled={closed}>
            <Image source={sendIconImg} style={styles.sendButtonImage} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.moreButton} onPress={() => setActionVisible(prev => !prev)}>
            <Text style={styles.moreButtonText}>…</Text>
          </TouchableOpacity>
        </View>
      </Pressable>

      <MeetingInfoModal visible={infoVisible} onClose={() => setInfoVisible(false)} />
      <ReportModal
        visible={reportVisible}
        selectedReason={selectedReason}
        reportDetail={reportDetail}
        onChangeReason={setSelectedReason}
        onChangeDetail={setReportDetail}
        onClose={() => setReportVisible(false)}
      />
      <ConfirmModal
        visible={cancelConfirmVisible}
        title="미팅 취소하기"
        body={'미팅을 취소 투표로 진행할까요?\n모든 사람이 동의하면 미팅이 취소되고 현재 채팅방은 사라집니다.\n위약금을 제외하고 환불됩니다.'}
        primary="네"
        secondary="아니요"
        onPrimary={startCancelVote}
        onSecondary={() => setCancelConfirmVisible(false)}
      />
      <ConfirmModal
        visible={verifyConfirmVisible}
        title="만남 인증하기"
        body={'만남 인증을 하면 리워드를 받고 24시간 후에 채팅방이 사라져요.\n만남 인증을 시작할까요?'}
        primary="네"
        secondary="아니요"
        onPrimary={startVerification}
        onSecondary={() => setVerifyConfirmVisible(false)}
      />
      <LocationLoadingModal
        visible={locationLoadingVisible}
        location={currentLocation}
      />
      <LocationConfirmModal
        visible={locationConfirmVisible}
        location={currentLocation}
        onRetry={requestCurrentLocation}
        onComplete={completeVerification}
      />
      <ConfirmModal
        visible={leaveVisible}
        title="나가기"
        body="정말 나가시겠어요? 한번만 더 생각해보세요!"
        primary="나가기"
        secondary="남아있기"
        onPrimary={leaveRoom}
        onSecondary={() => setLeaveVisible(false)}
      />
    </SafeAreaView>
  );
};

const MeetingHeader = ({
  expanded,
  title,
  cancelVoteActive,
  members,
  hasNextMembers,
  onToggle,
  onInfo,
  onNextMembers,
  onVote,
}: {
  expanded: boolean;
  title: string;
  cancelVoteActive: boolean;
  members: MeetingMember[];
  hasNextMembers: boolean;
  onToggle: () => void;
  onInfo: () => void;
  onNextMembers: () => void;
  onVote: (choice: VoteChoice) => void;
}) => (
  <View style={[styles.headerCard, expanded && styles.headerExpanded]}>
    <TouchableOpacity activeOpacity={0.9} onPress={onToggle}>
      <View style={styles.headerTopRow}>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        {cancelVoteActive && <Text style={styles.headerStatus}>미팅 취소</Text>}
        <TouchableOpacity style={styles.infoButton} onPress={onInfo}>
          <Text style={styles.infoButtonText}>!</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>

    {expanded && (
      <>
        <View style={styles.memberRow}>
          {members.map(member => (
            <View key={member.id} style={styles.memberItem}>
              <Avatar />
              <Text style={styles.memberName}>{member.self ? '나' : member.name}</Text>
            </View>
          ))}
          {hasNextMembers && (
            <TouchableOpacity style={styles.nextMemberButton} onPress={onNextMembers}>
              <Text style={styles.nextMemberText}>›</Text>
            </TouchableOpacity>
          )}
        </View>
        {cancelVoteActive && (
          <View style={styles.headerVoteActions}>
            <TouchableOpacity style={styles.headerVoteButtonPink} onPress={() => onVote('미동의')}>
              <Text style={styles.headerVoteText}>미동의</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerVoteButtonGray} onPress={() => onVote('동의')}>
              <Text style={styles.headerVoteText}>동의</Text>
            </TouchableOpacity>
          </View>
        )}
      </>
    )}

    <TouchableOpacity style={styles.chevronWrap} onPress={onToggle}>
      <Text style={styles.chevron}>{expanded ? '⌃' : '⌄'}</Text>
    </TouchableOpacity>
  </View>
);

const Avatar = () => (
  <View style={styles.avatar}>
    <View style={styles.avatarHead} />
    <View style={styles.avatarBody} />
  </View>
);

const BubbleMessage = ({ message }: { message: Extract<GeneralMessage, { type: 'message' }> }) => (
  <View style={[styles.messageRow, message.mine && styles.myMessageRow]}>
    {!message.mine && <Avatar />}
    <View style={[
      styles.bubble,
      message.mine && styles.myBubble,
      message.tone === 'pink' && styles.pinkBubble,
      message.tone === 'blue' && styles.blueBubble,
      message.photoUri && styles.photoBubble,
    ]}>
      {message.photoUri ? (
        <>
          <Image source={{ uri: message.photoUri }} style={styles.photoMessageImage} />
          <View style={styles.mediaBubbleFooter}>
            <Text style={styles.mediaBubbleText} numberOfLines={1}>
              {message.text}
            </Text>
            <Text style={styles.mediaTimeText}>{message.time}</Text>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.bubbleText}>{message.text}</Text>
          <Text style={styles.bubbleTime}>{message.time}</Text>
        </>
      )}
    </View>
  </View>
);

const GeneralSystemMessage = ({
  message,
  onVote,
  onJoinVerification,
}: {
  message: Extract<GeneralMessage, { type: 'system' }>;
  onVote: (choice: VoteChoice) => void;
  onJoinVerification: () => void;
}) => {
  if (message.kind === 'cancelVote' || message.kind === 'cancelVoteDone') {
    return (
      <View style={styles.systemCard}>
        <Text style={styles.systemTitle}>미팅 취소 투표</Text>
        <Text style={styles.systemBody}>
          []님이 미팅 취소 투표를 시작하셨어요!{'\n'}
          모든 인원이 취소에 동의하면 채팅방이 사라지고 채팅방에서 사용된 팅은 위약금을 제외하고 환불해드려요!{'\n'}
          투표 남은시간 hh시간 : mm분
        </Text>
        {message.kind === 'cancelVoteDone' ? (
          <Text style={styles.voteDoneText}>﹛{message.voteChoice ?? '동의'}﹜하셨습니다</Text>
        ) : (
          <View style={styles.systemButtonRow}>
            <TouchableOpacity style={styles.systemPrimaryButton} onPress={() => onVote('동의')}>
              <Text style={styles.systemButtonText}>동의</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.systemSecondaryButton} onPress={() => onVote('미동의')}>
              <Text style={styles.systemButtonText}>미동의</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  if (message.kind === 'cancelAllAgreed') {
    return (
      <View style={styles.systemCard}>
        <Text style={styles.systemTitle}>미팅 취소 투표 결과</Text>
        <Text style={styles.systemBody}>모두가 동의하여 채팅방이 사라져요{'\n'}사라지기까지 남은시간 mm분</Text>
      </View>
    );
  }

  if (message.kind === 'cancelRejected') {
    return (
      <View style={styles.systemCard}>
        <Text style={styles.systemTitle}>미팅 취소 투표 결과</Text>
        <Text style={styles.systemBody}>모두가 동의하지 않아 취소되지 않았어요</Text>
      </View>
    );
  }

  if (message.kind === 'verifySuccess') {
    return (
      <View style={styles.systemCard}>
        <Text style={styles.systemTitle}>만남인증 성공</Text>
        <Text style={styles.systemBody}>
          []님이 시작한 만남인증이 완료되었어요{'\n'}
          참여인원 : N명{'\n\n'}
          채팅방이 사라지기까지{'\n'}
          남은시간 : hh시간 mm분
        </Text>
      </View>
    );
  }

  if (message.kind === 'verifyFailed') {
    return (
      <View style={styles.systemCard}>
        <Text style={styles.systemTitle}>만남인증 실패</Text>
        <Text style={styles.systemBody}>
          []님이 시작한 만남인증이 완료되지 않았어요{'\n'}
          참여인원 : N명
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.systemCard}>
      <Text style={styles.systemTitle}>만남인증</Text>
      <Text style={styles.systemBody}>
        []님이 만남인증을 시작하셨어요{'\n'}
        만남인증이 완료되면 참여하신 분들에게 리워드가 지급되고 이 채팅방은 24시간 뒤에 사라져요{'\n'}
        남은시간 mm분 :ss초
      </Text>
      <TouchableOpacity style={styles.systemWideButton} onPress={onJoinVerification}>
        <Text style={styles.systemButtonText}>참여하기</Text>
      </TouchableOpacity>
    </View>
  );
};

const ActionSheetItem = ({
  label,
  icon,
  iconSource,
  onPress,
}: {
  label: string;
  icon?: string;
  iconSource?: any;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.actionSheetItem} onPress={onPress}>
    {iconSource ? (
      <Image source={iconSource} style={styles.actionSheetIconImage} />
    ) : (
      <Text style={styles.actionSheetIcon}>{icon}</Text>
    )}
    <Text style={styles.actionSheetText}>{label}</Text>
  </TouchableOpacity>
);

const ModalShell = ({ visible, children }: { visible: boolean; children: React.ReactNode }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalBackdrop}>
      <View style={styles.modalCard}>{children}</View>
    </View>
  </Modal>
);

const MeetingInfoModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
  <ModalShell visible={visible}>
    <View style={styles.infoIcon}><Text style={styles.infoIconText}>!</Text></View>
    <Text style={styles.modalBody}>
      만남 인증 : 시작 후 24시간 안에 남녀가 포함된 과반수 팀원이 같은 위치에서 인증해야 보상이 주어져요.{'\n\n'}
      미팅 취소 : 만남 인증 전에 누군가 취소 투표를 시작하면, 24시간 안에 모두가 수락해야 위약금 없이 미팅을 취소할 수 있어요.
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

const ReportModal = ({
  visible,
  selectedReason,
  reportDetail,
  onChangeReason,
  onChangeDetail,
  onClose,
}: {
  visible: boolean;
  selectedReason: string;
  reportDetail: string;
  onChangeReason: (reason: string) => void;
  onChangeDetail: (value: string) => void;
  onClose: () => void;
}) => (
  <ModalShell visible={visible}>
    <Text style={styles.reportTitle}>신고</Text>
    {REPORT_REASONS.map(reason => (
      <TouchableOpacity key={reason} style={styles.radioRow} onPress={() => onChangeReason(reason)}>
        <View style={[styles.radioCircle, selectedReason === reason && styles.radioCircleOn]} />
        <Text style={styles.radioText}>{reason}</Text>
      </TouchableOpacity>
    ))}
    <TextInput
      style={styles.reportInput}
      value={reportDetail}
      onChangeText={onChangeDetail}
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

const LocationLoadingModal = ({
  visible,
  location,
}: {
  visible: boolean;
  location: LocationState;
}) => (
  <ModalShell visible={visible}>
    <LocationMapPreview location={location} tracking />
    <Text style={styles.locationTitle}>위치를 파악중이에요</Text>
    <Text style={styles.modalBody}>만남인증이 완료되려면 절반이상이 일치해야돼요</Text>
  </ModalShell>
);

const LocationConfirmModal = ({
  visible,
  location,
  onRetry,
  onComplete,
}: {
  visible: boolean;
  location: LocationState;
  onRetry: () => void;
  onComplete: () => void;
}) => (
  <ModalShell visible={visible}>
    <LocationMapPreview location={location} tracking />
    <Text style={styles.locationInfoText}>
      현재 위치 : {location ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : '미확정'}{'\n'}
      현재 가장 많이 인증한 위치 : 강남역
    </Text>
    <Text style={styles.modalBody}>
      만남인증이 완료되려면 절반이상이 일치해야돼요{'\n\n'}
      '참여하기' 버튼을 다시 눌러 위치를 다시 인증할 수 있어요.
    </Text>
    <View style={styles.modalButtonRow}>
      <TouchableOpacity style={styles.modalPrimary} onPress={onComplete}>
        <Text style={styles.modalButtonText}>인증 완료 하기</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.modalSecondary} onPress={onRetry}>
        <Text style={styles.modalButtonText}>다시 위치 보내기</Text>
      </TouchableOpacity>
    </View>
  </ModalShell>
);

const LocationMapPreview = ({
  location,
  tracking,
}: {
  location: LocationState;
  tracking?: boolean;
}) => (
  <View style={styles.mapPreview}>
    <NaverMapView
      style={styles.map}
      camera={toMapCamera(location)}
      animationDuration={250}
      isShowCompass={false}
      isShowIndoorLevelPicker={false}
      isShowLocationButton={false}
      isShowScaleBar={false}
      isShowZoomControls={false}
      isScrollGesturesEnabled={false}
      isZoomGesturesEnabled={false}
      isTiltGesturesEnabled={false}
      isRotateGesturesEnabled={false}
      isStopGesturesEnabled={false}
      isUseTextureViewAndroid
      locale="ko"
      locationOverlay={{
        isVisible: Boolean(tracking && location),
        position: location ?? DEFAULT_MAP_LOCATION,
        circleRadius: 44,
        circleColor: '#FFAFBF33',
        circleOutlineWidth: 1,
        circleOutlineColor: '#FFAFBF',
      }}
    >
      {location && (
        <NaverMapMarkerOverlay
          latitude={location.latitude}
          longitude={location.longitude}
          image={{ symbol: 'pink' }}
          width={28}
          height={36}
          caption={{ text: '현재 위치', textSize: 11, color: '#001A44', haloColor: '#FFFFFF' }}
        />
      )}
    </NaverMapView>
  </View>
);

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
  headerExpanded: { paddingBottom: 28 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { flex: 1, minWidth: 0, color: '#111111', fontSize: 22, fontWeight: '900' },
  headerStatus: { color: '#111111', fontSize: 13, fontWeight: '900' },
  infoButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoButtonText: { color: '#111111', fontSize: 17, fontWeight: '900' },
  chevronWrap: { position: 'absolute', bottom: -14, alignSelf: 'center' },
  chevron: { color: '#C0C0C0', fontSize: 26, lineHeight: 26 },
  memberRow: { marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  memberItem: { width: 56, alignItems: 'center' },
  nextMemberButton: { width: 22, height: 44, alignItems: 'center', justifyContent: 'center' },
  nextMemberText: { color: '#111111', fontSize: 26, lineHeight: 28 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#B7BBC1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  avatarHead: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#B7BBC1',
    marginBottom: 3,
  },
  avatarBody: {
    width: 25,
    height: 11,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: '#B7BBC1',
  },
  memberName: { color: '#111111', fontSize: 13, fontWeight: '800', marginTop: 4 },
  headerVoteActions: { flexDirection: 'row', gap: 34, marginTop: 16 },
  headerVoteButtonPink: {
    flex: 1,
    height: 42,
    borderRadius: 7,
    backgroundColor: '#FFAFBF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerVoteButtonGray: {
    flex: 1,
    height: 42,
    borderRadius: 7,
    backgroundColor: '#D9D9D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerVoteText: { color: '#111111', fontSize: 15, fontWeight: '900' },
  messagesScroll: { flex: 1 },
  messagesContent: { paddingHorizontal: 28, paddingTop: 54, paddingBottom: 20 },
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
  photoBubble: {
    width: 178,
    minHeight: 160,
    borderRadius: 12,
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    padding: 8,
    overflow: 'hidden',
  },
  photoMessageImage: {
    width: '100%',
    height: 118,
    borderRadius: 9,
    backgroundColor: '#EAF5FF',
    resizeMode: 'cover',
  },
  mediaBubbleFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 5,
    marginTop: 7,
  },
  mediaBubbleText: {
    flex: 1,
    minWidth: 0,
    color: '#222222',
    fontSize: 11,
    fontWeight: '700',
  },
  mediaTimeText: {
    flexShrink: 0,
    color: '#7A91A3',
    fontSize: 9,
  },
  bubbleText: { color: '#222222', fontSize: 16 },
  bubbleTime: { color: '#7A91A3', fontSize: 11, marginTop: 3 },
  systemCard: {
    alignSelf: 'center',
    width: '86%',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 18,
  },
  systemTitle: { color: '#001A44', fontSize: 16, fontWeight: '900', marginBottom: 10 },
  systemBody: { color: '#46506A', fontSize: 13, lineHeight: 19, fontWeight: '600' },
  systemButtonRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  systemPrimaryButton: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#FFAFBF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  systemSecondaryButton: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#D9D9D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  systemWideButton: {
    height: 42,
    borderRadius: 8,
    backgroundColor: '#FFAFBF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  systemButtonText: { color: '#111111', fontSize: 15, fontWeight: '900' },
  voteDoneText: { color: '#001A44', fontSize: 14, fontWeight: '900', marginTop: 14 },
  actionSheet: {
    marginHorizontal: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: '#888888',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 18,
  },
  actionSheetItem: { alignItems: 'center', width: 58 },
  actionSheetIcon: { color: '#111111', fontSize: 28, fontWeight: '900', lineHeight: 30 },
  actionSheetIconImage: { width: 30, height: 30, resizeMode: 'contain' },
  actionSheetText: { color: '#111111', fontSize: 11, marginTop: 5 },
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
    paddingRight: 36,
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
    backgroundColor: '#00000012',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    padding: 18,
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 7,
    backgroundColor: '#FFEDEF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  infoIconText: { color: '#111111', fontSize: 17, fontWeight: '900' },
  modalTitle: { color: '#001A44', fontSize: 17, fontWeight: '900', marginBottom: 10 },
  reportTitle: { color: '#001A44', fontSize: 22, fontWeight: '900', marginBottom: 12 },
  modalBody: { color: '#46506A', fontSize: 14, lineHeight: 21, marginBottom: 18 },
  modalButtonRow: { flexDirection: 'row', gap: 10 },
  modalPrimary: {
    flex: 1,
    height: 46,
    borderRadius: 7,
    backgroundColor: '#FFAFBF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondary: {
    flex: 1,
    height: 46,
    borderRadius: 7,
    backgroundColor: '#D9D9D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryWide: {
    height: 46,
    borderRadius: 6,
    backgroundColor: '#FFAFBF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: { color: '#111111', fontSize: 15, fontWeight: '800' },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#FF7E8D',
  },
  radioCircleOn: { borderWidth: 5 },
  radioText: { color: '#222222', fontSize: 14, fontWeight: '700' },
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
    marginTop: 4,
  },
  reportHelp: { color: '#6D7890', fontSize: 13, fontWeight: '700', marginTop: 10, marginBottom: 12 },
  locationTitle: { color: '#001A44', fontSize: 18, fontWeight: '900', marginTop: 18, marginBottom: 8 },
  locationInfoText: { color: '#001A44', fontSize: 14, fontWeight: '800', lineHeight: 22, marginTop: 16, marginBottom: 8 },
  mapPreview: {
    height: 136,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B8B8B8',
    backgroundColor: '#E4E4E4',
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default MeetingGeneralChatScreen;
