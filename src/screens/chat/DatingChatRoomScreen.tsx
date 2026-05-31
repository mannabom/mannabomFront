import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
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
import { API_ENDPOINTS_LIST } from '../../config/api';
import { chatApiService } from '../../services/ChatApiService';
import { chatSocketService } from '../../services/ChatSocketService';
import apiClient from '../../services/apiClient';
import {
  ChatMessageDTO,
  ChatRoomStatus,
  ChatRoomType,
  ProfileRequestStatus,
} from '../../types/ChatAPI';
import { getProfileId } from '../../utils/AuthUtils';
import {
  clearSelectedGift,
  getSelectedGift,
  SelectedGift,
} from '../../utils/GiftSelectionStore';

type ProfileFlowState =
  | 'idle'
  | 'outgoingPending'
  | 'incomingPending'
  | 'accepted'
  | 'rejected';

type UiMessage =
  | {
      id: string;
      serverId?: string;
      type: 'message';
      mine: boolean;
      text: string;
      time: string;
      giftTitle?: string;
    }
  | {
      id: string;
      type: 'system';
      title: string;
      body: string;
    };

const SAMPLE_MESSAGES: UiMessage[] = [
  { id: 'sample-1', type: 'message', mine: false, text: 'Message here', time: '2:00pm' },
  { id: 'sample-2', type: 'message', mine: false, text: 'Message here', time: '2:00pm' },
  { id: 'sample-3', type: 'message', mine: true, text: 'Message here', time: '2:00pm' },
  { id: 'sample-4', type: 'message', mine: true, text: 'Message here', time: '2:00pm' },
];

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

const normalizeProfileStatus = (value?: ProfileRequestStatus) =>
  String(value ?? '').toUpperCase() as 'PENDING' | 'ACCEPTED' | 'REJECTED' | '';

const resolveProfileFlow = (
  raw: any,
  currentUserId?: string | null,
): ProfileFlowState => {
  const status = normalizeProfileStatus(raw?.profileRequestStatus ?? raw?.status);

  if (status === 'ACCEPTED') return 'accepted';
  if (status === 'REJECTED') return 'rejected';

  if (status === 'PENDING') {
    const direction = String(raw?.profileRequestDirection ?? raw?.direction ?? '').toUpperCase();
    const requesterId = raw?.requesterId ?? raw?.requestedByUserId ?? raw?.senderId;
    const requestedByMe = raw?.requestedByMe;

    if (direction === 'RECEIVED' || requestedByMe === false) return 'incomingPending';
    if (direction === 'SENT' || requestedByMe === true) return 'outgoingPending';
    if (requesterId && currentUserId) {
      return String(requesterId) === String(currentUserId)
        ? 'outgoingPending'
        : 'incomingPending';
    }
  }

  return 'idle';
};

const getProfileStateLabel = (state: ProfileFlowState) => {
  switch (state) {
    case 'outgoingPending':
      return '응답 대기중';
    case 'incomingPending':
      return '요청 도착';
    case 'accepted':
      return '공개 완료';
    case 'rejected':
      return '공개 거절';
    case 'idle':
    default:
      return '프로필 요청';
  }
};

const normalizeMessage = (
  raw: ChatMessageDTO | any,
  currentUserId?: string | null,
): UiMessage | null => {
  const messageType = String(raw?.messageType ?? raw?.type ?? '').toUpperCase();
  const systemKind = String(raw?.systemType ?? raw?.eventType ?? '').toUpperCase();

  if (messageType === 'SYSTEM' || systemKind.includes('PROFILE')) {
    const title =
      raw?.title ??
      (systemKind.includes('ACCEPT') || systemKind.includes('OPEN')
        ? '서로의 프로필이 공개되었습니다!'
        : systemKind.includes('REJECT')
          ? '프로필 공개가 거절되었어요'
          : '프로필 공개를 요청했어요');
    const body =
      raw?.body ??
      raw?.messageContent ??
      raw?.content ??
      '프로필 요청 상태가 변경되었습니다.';

    return {
      id: String(raw?.messageId ?? raw?.id ?? `system-${Date.now()}`),
      type: 'system',
      title: String(title),
      body: String(body),
    };
  }

  const messageId = raw?.messageId ?? raw?.id ?? raw?.clientMessageId;
  const messageContent = raw?.messageContent ?? raw?.content;
  if (!messageId || typeof messageContent !== 'string') return null;

  return {
    id: String(messageId),
    serverId: String(raw?.messageId ?? messageId),
    type: 'message',
    mine: Boolean(currentUserId && String(raw?.senderId) === String(currentUserId)),
    text: messageContent,
    time: formatMessageTime(raw?.timestamp),
  };
};

const makeSystemMessage = (state: 'requested' | 'accepted' | 'rejected'): UiMessage => {
  if (state === 'accepted') {
    return {
      id: `system-accepted-${Date.now()}`,
      type: 'system',
      title: '서로의 프로필이 공개되었습니다!',
      body: '서로의 프로필을 눌러 더 다양한 대화를 나눠봐요 !',
    };
  }

  if (state === 'rejected') {
    return {
      id: `system-rejected-${Date.now()}`,
      type: 'system',
      title: '프로필 공개가 거절되었어요',
      body: '아직 상대가 조심스러운가봐요. 더 대화를 나눠보세요!',
    };
  }

  return {
    id: `system-requested-${Date.now()}`,
    type: 'system',
    title: '프로필 공개를 요청했어요',
    body: '수락할 시 서로의 프로필이 공개됩니다. 헤더를 내려 수락하기 버튼을 눌러주세요',
  };
};

const DatingChatRoomScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const roomId = String(route.params?.roomId ?? '');
  const roomType = String(route.params?.roomType ?? 'PROFILE') as ChatRoomType;
  const isLoveview = roomType === 'LOVEVIEW' || roomType === 'CODE';
  const isProfileChat = !isLoveview;

  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>(SAMPLE_MESSAGES);
  const [input, setInput] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [chatRoomStatus, setChatRoomStatus] = useState<ChatRoomStatus>('ACTIVE');
  const [profileFlow, setProfileFlow] = useState<ProfileFlowState>('idle');
  const [actionVisible, setActionVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [profileGuideVisible, setProfileGuideVisible] = useState(false);
  const [profileTooEarlyVisible, setProfileTooEarlyVisible] = useState(false);
  const [giftVisible, setGiftVisible] = useState(false);
  const [leaveVisible, setLeaveVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [reportDetail, setReportDetail] = useState('');
  const [selectedGift, setSelectedGiftState] = useState<SelectedGift | null>(null);
  const [resolvedGender, setResolvedGender] = useState(
    String(route.params?.myGender ?? '').toUpperCase(),
  );
  const lastChatSyncTimeRef = useRef<string | null>(null);

  const closed = chatRoomStatus !== 'ACTIVE';
  const opponentNickname = String(route.params?.nickname ?? '닉네임');
  const targetProfileId = Number(route.params?.targetProfileId ?? 0);
  const opponentProfileImage = String(route.params?.profileImage ?? '');
  const myTalkCount = messages.filter(message => message.type === 'message' && message.mine).length;
  const myBubbleColor = isProfileChat
    ? resolvedGender === 'FEMALE'
      ? '#FFE2E6'
      : '#CFEBFF'
    : '#FFE2E6';

  useEffect(() => {
    if (resolvedGender) return;

    apiClient
      .get(API_ENDPOINTS_LIST.USER_PROFILE)
      .then(response => {
        const raw = response.data?.data ?? response.data ?? {};
        const rawProfile = raw?.profile ?? {};
        const gender = String(raw?.gender ?? rawProfile?.gender ?? '').toUpperCase();
        if (gender) setResolvedGender(gender);
      })
      .catch(error => {
        if (__DEV__) console.warn('Failed to load chat user gender', error);
      });
  }, [resolvedGender]);

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
      setProfileFlow(resolveProfileFlow(result, nextUserId));

      const normalized = result.messages
        .map(message => normalizeMessage(message, nextUserId))
        .filter((message): message is UiMessage => Boolean(message));
      setMessages(normalized);
    } catch (error) {
      if (__DEV__) console.warn('Failed to sync dating chat room', error);
    }
  }, [roomId]);

  useFocusEffect(
    useCallback(() => {
      let unsubscribe: (() => void) | undefined;
      const gift = getSelectedGift();
      if (gift) {
        setSelectedGiftState(gift);
        setGiftVisible(true);
        clearSelectedGift();
      }

      syncMessages();
      if (roomId) {
        chatSocketService
          .subscribeRoom(roomId, raw => {
            const nextProfileFlow = resolveProfileFlow(raw, currentUserId);
            if (nextProfileFlow !== 'idle') {
              setProfileFlow(nextProfileFlow);
            }

            const normalized = normalizeMessage(raw, currentUserId);
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
            if (__DEV__) console.warn('Failed to subscribe dating chat room', error);
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
      if (__DEV__) console.warn('Failed to mark dating chat read', error);
    });
  }, [messages, roomId]);

  const sendChatPayload = (content: string, messageType: 'TEXT' | 'PHOTO' = 'TEXT') => {
    if (!roomId || closed) return;
    const clientMessageId = `manual-${Date.now()}`;
    chatSocketService
      .sendMessage({
        roomId,
        messageType,
        content,
        clientMessageId,
      })
      .catch(error => {
        if (__DEV__) console.warn('Failed to send dating chat message', error);
        Alert.alert('오류', '메시지 전송에 실패했어요.');
      });
  };

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed || !roomId || closed) return;

    const clientMessageId = `manual-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      {
        id: clientMessageId,
        type: 'message',
        mine: true,
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
        if (__DEV__) console.warn('Failed to send dating chat message', error);
        Alert.alert('오류', '메시지 전송에 실패했어요.');
      });
  };

  const openProfileRequestFlow = () => {
    if (!isLoveview || profileFlow !== 'idle') return;
    if (myTalkCount < 10) {
      setProfileTooEarlyVisible(true);
      return;
    }
    setProfileGuideVisible(true);
  };

  const requestProfileOpen = async () => {
    if (!roomId) return;
    try {
      await chatApiService.requestLoveviewProfile({ chatRoomId: roomId });
      setProfileFlow('outgoingPending');
      setProfileGuideVisible(false);
      setMessages(prev => [...prev, makeSystemMessage('requested')]);
    } catch (error) {
      if (__DEV__) console.warn('Failed to request profile open', error);
      Alert.alert('오류', '프로필 공개 요청에 실패했어요.');
    }
  };

  const respondProfileOpen = async (accepted: boolean) => {
    if (!roomId) return;
    try {
      await chatApiService.respondLoveviewProfile({ chatRoomId: roomId, accepted });
      setProfileFlow(accepted ? 'accepted' : 'rejected');
      setMessages(prev => [...prev, makeSystemMessage(accepted ? 'accepted' : 'rejected')]);
    } catch (error) {
      if (__DEV__) console.warn('Failed to respond profile open', error);
      Alert.alert('오류', '프로필 공개 응답에 실패했어요.');
    }
  };

  const openGiftPicker = () => {
    navigation.navigate('Store', { pickGiftMode: true });
  };

  const sendGift = () => {
    if (!selectedGift) {
      openGiftPicker();
      return;
    }
    setMessages(prev => [
      ...prev,
      {
        id: `gift-${Date.now()}`,
        type: 'message',
        mine: true,
        text: '기프티콘을 보냈어요',
        time: formatMessageTime(new Date().toISOString()),
        giftTitle: selectedGift.title,
      },
    ]);
    sendChatPayload(`[기프티콘] ${selectedGift.title}`, 'TEXT');
    setGiftVisible(false);
    setSelectedGiftState(null);
  };

  const leaveRoom = async () => {
    if (!roomId) {
      setLeaveVisible(false);
      navigation.goBack();
      return;
    }

    try {
      await chatApiService.leaveRoom(roomId);
      setLeaveVisible(false);
      navigation.goBack();
    } catch (error) {
      if (__DEV__) console.warn('Failed to leave dating chat room', error);
      Alert.alert('오류', '채팅방 나가기에 실패했어요.');
    }
  };

  const openOpponentProfile = () => {
    if (!targetProfileId) return;
    navigation.navigate('ChatProfileDetail', {
      source: isProfileChat ? 'PROFILE_MATCH' : 'LOVE_VIEW_MATCH',
      targetProfileId,
      previewName: opponentNickname,
      previewImageUrl: opponentProfileImage,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Pressable style={styles.screen} onPress={() => isLoveview && expanded && setExpanded(false)}>
        <Pressable>
          {isProfileChat ? (
            <ProfileChatHeader title={opponentNickname} />
          ) : (
            <LoveviewHeader
              expanded={expanded}
              title={opponentNickname}
              profileFlow={profileFlow}
              onToggle={() => setExpanded(prev => !prev)}
              onInfo={() => setInfoVisible(true)}
              onRequestProfile={openProfileRequestFlow}
              onAccept={() => respondProfileOpen(true)}
              onReject={() => respondProfileOpen(false)}
              onOpponentProfilePress={openOpponentProfile}
            />
          )}
        </Pressable>

        <ScrollView style={styles.messagesScroll} contentContainerStyle={styles.messagesContent}>
          {messages.map(message =>
            message.type === 'system' ? (
              <SystemMessage key={message.id} message={message} />
            ) : (
              <BubbleMessage
                key={message.id}
                message={message}
                profileOpen={profileFlow === 'accepted'}
                isProfileChat={isProfileChat}
                myBubbleColor={myBubbleColor}
                onOpponentProfilePress={openOpponentProfile}
              />
            ),
          )}
        </ScrollView>

        {actionVisible && (
          <View style={styles.actionSheet}>
            <ActionSheetItem label="사진" icon="▧" onPress={() => {
              setActionVisible(false);
              Alert.alert('사진 보내기', '사진 전송은 PHOTO 웹소켓 payload에 연결할 수 있게 준비되어 있어요.');
            }} />
            <ActionSheetItem label="신고" icon="⚠" onPress={() => {
              setActionVisible(false);
              setReportVisible(true);
            }} />
            <ActionSheetItem label="기프티콘" icon="□" onPress={() => {
              setActionVisible(false);
              setGiftVisible(true);
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
            placeholderTextColor="#B8B8B8"
            editable={!closed}
          />
          <TouchableOpacity style={styles.sendIconButton} onPress={sendMessage} disabled={closed}>
            <Text style={styles.sendIconText}>⌁</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.moreButton} onPress={() => setActionVisible(prev => !prev)}>
            <Text style={styles.moreButtonText}>…</Text>
          </TouchableOpacity>
        </View>
      </Pressable>

      {isLoveview && <InfoModal visible={infoVisible} onClose={() => setInfoVisible(false)} />}
      <ReportModal
        visible={reportVisible}
        selectedReason={selectedReason}
        reportDetail={reportDetail}
        onChangeReason={setSelectedReason}
        onChangeDetail={setReportDetail}
        onClose={() => setReportVisible(false)}
      />
      <ProfileGuideModal
        visible={profileGuideVisible}
        onClose={() => setProfileGuideVisible(false)}
        onRequest={requestProfileOpen}
      />
      <NoticeModal
        visible={profileTooEarlyVisible}
        title="서로를 알아가는 단계예요."
        body="대화를 조금 더 나눠보세요!\n(10마디 미만)"
        button="확인"
        onClose={() => setProfileTooEarlyVisible(false)}
      />
      <GiftModal
        visible={giftVisible}
        selectedGift={selectedGift}
        onPickGift={openGiftPicker}
        onSend={sendGift}
        onClose={() => setGiftVisible(false)}
      />
      <ConfirmModal
        visible={leaveVisible}
        title="나가기"
        body="정말 나가시겠어요?\n한번만 더 생각해보세요!"
        primary="나가기"
        secondary="남아있기"
        onPrimary={leaveRoom}
        onSecondary={() => setLeaveVisible(false)}
      />
    </SafeAreaView>
  );
};

const LoveviewHeader = ({
  expanded,
  title,
  profileFlow,
  onToggle,
  onInfo,
  onRequestProfile,
  onAccept,
  onReject,
  onOpponentProfilePress,
}: {
  expanded: boolean;
  title: string;
  profileFlow: ProfileFlowState;
  onToggle: () => void;
  onInfo: () => void;
  onRequestProfile: () => void;
  onAccept: () => void;
  onReject: () => void;
  onOpponentProfilePress: () => void;
}) => {
  const profileOpen = profileFlow === 'accepted';
  const requestDisabled = profileFlow !== 'idle';

  return (
    <View style={[styles.headerCard, expanded && styles.headerExpanded]}>
      <TouchableOpacity activeOpacity={0.9} onPress={onToggle}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          <TouchableOpacity
            style={[styles.profilePill, requestDisabled && styles.profilePillMuted]}
            onPress={onRequestProfile}
            disabled={requestDisabled}
          >
            <Text style={styles.profilePillText}>{getProfileStateLabel(profileFlow)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.infoButton} onPress={onInfo}>
            <Text style={styles.infoButtonText}>!</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {expanded && (
        <>
          <View style={styles.profileCompareRow}>
            <View style={styles.profileStatusItem}>
              <Avatar open />
              <Text style={styles.profileStatusName}>나</Text>
            </View>
            <View style={styles.profileDots}>
              <View style={styles.profileDotMuted} />
              <View style={styles.profileDot} />
              <View style={styles.profileDot} />
            </View>
            <View style={styles.profileStatusItem}>
              <TouchableOpacity
                activeOpacity={profileOpen ? 0.75 : 1}
                onPress={profileOpen ? onOpponentProfilePress : undefined}
              >
                <Avatar open={profileOpen} unknown={!profileOpen} />
              </TouchableOpacity>
              <Text style={styles.profileStatusName}>ㅇㅇㅇ</Text>
            </View>
          </View>

          {profileFlow === 'idle' && (
            <TouchableOpacity style={styles.singleProfileAction} onPress={onRequestProfile}>
              <Text style={styles.headerActionText}>프로필 요청</Text>
            </TouchableOpacity>
          )}
          {profileFlow === 'outgoingPending' && (
            <TouchableOpacity style={[styles.singleProfileAction, styles.disabledAction]}>
              <Text style={styles.headerActionText}>응답 대기중</Text>
            </TouchableOpacity>
          )}
          {profileFlow === 'incomingPending' && (
            <View style={styles.headerActionRow}>
              <TouchableOpacity style={styles.headerActionButton} onPress={onAccept}>
                <Text style={styles.headerActionText}>요청 수락</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.headerActionButton, styles.disabledAction]} onPress={onReject}>
                <Text style={styles.headerActionText}>요청 거절</Text>
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
};

const ProfileChatHeader = ({ title }: { title: string }) => (
  <View style={styles.profileChatHeader}>
    <Text style={styles.profileChatTitle} numberOfLines={1}>
      {title}
    </Text>
  </View>
);

const Avatar = ({ open = false, unknown = false }: { open?: boolean; unknown?: boolean }) => {
  if (unknown) {
    return (
      <View style={styles.unknownAvatar}>
        <Text style={styles.unknownAvatarText}>?</Text>
      </View>
    );
  }

  return (
    <View style={[styles.avatar, open && styles.avatarOpen]}>
      <View style={styles.avatarHead} />
      <View style={styles.avatarBody} />
    </View>
  );
};

const BubbleMessage = ({
  message,
  profileOpen,
  isProfileChat,
  myBubbleColor,
  onOpponentProfilePress,
}: {
  message: Extract<UiMessage, { type: 'message' }>;
  profileOpen: boolean;
  isProfileChat: boolean;
  myBubbleColor: string;
  onOpponentProfilePress: () => void;
}) => (
  <View style={[styles.messageRow, message.mine && styles.myMessageRow]}>
    {!message.mine && (
      <TouchableOpacity
        activeOpacity={isProfileChat ? 0.75 : 1}
        onPress={isProfileChat ? onOpponentProfilePress : undefined}
      >
        <Avatar open={isProfileChat || profileOpen} unknown={!isProfileChat && !profileOpen} />
      </TouchableOpacity>
    )}
    <View
      style={[
        styles.bubble,
        message.mine && styles.myBubble,
        message.mine && { backgroundColor: myBubbleColor },
        message.giftTitle && styles.giftBubble,
      ]}
    >
      {message.giftTitle && (
        <Text style={styles.giftBubbleTitle}>{message.giftTitle}</Text>
      )}
      <Text style={styles.bubbleText}>{message.text}</Text>
      <Text style={styles.timeText}>{message.time}</Text>
    </View>
  </View>
);

const SystemMessage = ({ message }: { message: Extract<UiMessage, { type: 'system' }> }) => (
  <View style={styles.systemCard}>
    <Text style={styles.systemTitle}>{message.title}</Text>
    <Text style={styles.systemBody}>{message.body}</Text>
  </View>
);

const ActionSheetItem = ({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.actionSheetItem} onPress={onPress}>
    <Text style={styles.actionSheetIcon}>{icon}</Text>
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

const InfoModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
  <ModalShell visible={visible}>
    <View style={styles.infoIcon}>
      <Text style={styles.infoIconText}>!</Text>
    </View>
    <Text style={styles.modalTitleSmall}>프로필 요청</Text>
    <Text style={styles.modalBody}>
      일정 메시지를 주고 받은 이후에 프로필 요청을 할 수 있어요!
    </Text>
    <TouchableOpacity style={styles.modalPrimaryWide} onPress={onClose}>
      <Text style={styles.modalButtonText}>확인</Text>
    </TouchableOpacity>
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

const ProfileGuideModal = ({
  visible,
  onClose,
  onRequest,
}: {
  visible: boolean;
  onClose: () => void;
  onRequest: () => void;
}) => (
  <ModalShell visible={visible}>
    <Text style={styles.modalTitle}>서로 충분히 대화했네요!</Text>
    <Text style={styles.modalBody}>이제 상대방에게 프로필 사진을 요청해 볼까요?</Text>
    <View style={styles.modalButtonRow}>
      <TouchableOpacity style={styles.modalPrimary} onPress={onRequest}>
        <Text style={styles.modalButtonText}>프로필 요청</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.modalSecondary} onPress={onClose}>
        <Text style={styles.modalButtonText}>더 대화하기</Text>
      </TouchableOpacity>
    </View>
  </ModalShell>
);

const NoticeModal = ({
  visible,
  title,
  body,
  button,
  onClose,
}: {
  visible: boolean;
  title: string;
  body: string;
  button: string;
  onClose: () => void;
}) => (
  <ModalShell visible={visible}>
    <Text style={styles.modalTitle}>{title}</Text>
    <Text style={styles.modalBody}>{body}</Text>
    <TouchableOpacity style={styles.modalPrimaryCentered} onPress={onClose}>
      <Text style={styles.modalButtonText}>{button}</Text>
    </TouchableOpacity>
  </ModalShell>
);

const GiftModal = ({
  visible,
  selectedGift,
  onPickGift,
  onSend,
  onClose,
}: {
  visible: boolean;
  selectedGift: SelectedGift | null;
  onPickGift: () => void;
  onSend: () => void;
  onClose: () => void;
}) => (
  <ModalShell visible={visible}>
    <Text style={styles.reportTitle}>기프티콘</Text>
    <TouchableOpacity style={styles.giftPreview} onPress={onPickGift}>
      {selectedGift ? (
        <View style={styles.giftSelectedWrap}>
          <Text style={styles.giftSelectedTitle}>{selectedGift.title}</Text>
          <Text style={styles.giftSelectedPrice}>{selectedGift.price}팅</Text>
        </View>
      ) : (
        <Text style={styles.giftEmptyIcon}>▧</Text>
      )}
    </TouchableOpacity>
    <Text style={styles.reportHelp}>상대방에게 보낼 기프티콘을 선택하세요!</Text>
    <View style={styles.modalButtonRow}>
      <TouchableOpacity style={styles.modalPrimary} onPress={onSend}>
        <Text style={styles.modalButtonText}>보내기</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.modalSecondary} onPress={onClose}>
        <Text style={styles.modalButtonText}>취소하기</Text>
      </TouchableOpacity>
    </View>
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
    <Text style={styles.reportTitle}>{title}</Text>
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
    paddingBottom: 13,
    marginHorizontal: 20,
  },
  profileChatHeader: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: '#111111',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginHorizontal: 20,
  },
  profileChatTitle: {
    color: '#111111',
    fontSize: 20,
    fontWeight: '900',
  },
  headerExpanded: {
    paddingBottom: 28,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    minWidth: 0,
    color: '#111111',
    fontSize: 20,
    fontWeight: '900',
  },
  profilePill: {
    minWidth: 74,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#FFAFBF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  profilePillMuted: {
    backgroundColor: '#E2E2E2',
  },
  profilePillText: {
    color: '#111111',
    fontSize: 11,
    fontWeight: '900',
  },
  infoButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoButtonText: {
    color: '#111111',
    fontSize: 17,
    fontWeight: '900',
  },
  chevronWrap: {
    position: 'absolute',
    bottom: -14,
    alignSelf: 'center',
  },
  chevron: {
    color: '#C0C0C0',
    fontSize: 26,
    lineHeight: 26,
  },
  profileCompareRow: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  profileStatusItem: {
    alignItems: 'center',
    width: 72,
  },
  profileStatusName: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  profileDots: {
    flexDirection: 'row',
    gap: 17,
    alignItems: 'center',
    marginBottom: 18,
  },
  profileDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#888888',
  },
  profileDotMuted: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F2DDE1',
  },
  singleProfileAction: {
    alignSelf: 'center',
    minWidth: 128,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#FFAFBF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  headerActionRow: {
    flexDirection: 'row',
    gap: 38,
    marginTop: 18,
  },
  headerActionButton: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#FFAFBF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledAction: {
    backgroundColor: '#DEDEDE',
  },
  headerActionText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '900',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#B7BBC1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  avatarOpen: {
    borderColor: '#B7BBC1',
  },
  avatarHead: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#B7BBC1',
    marginBottom: 3,
  },
  avatarBody: {
    width: 27,
    height: 12,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: '#B7BBC1',
  },
  unknownAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#FFB8C7',
    backgroundColor: '#FFEDEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unknownAvatarText: {
    color: '#111111',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 33,
  },
  messagesScroll: { flex: 1 },
  messagesContent: {
    paddingHorizontal: 28,
    paddingTop: 58,
    paddingBottom: 22,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 26,
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
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
  myBubble: {
    backgroundColor: '#FFE2E6',
    borderColor: '#FFCED7',
  },
  giftBubble: {
    width: 164,
    minHeight: 132,
    borderRadius: 12,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    paddingVertical: 16,
  },
  giftBubbleTitle: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 8,
  },
  bubbleText: {
    color: '#222222',
    fontSize: 16,
  },
  timeText: {
    color: '#7A91A3',
    fontSize: 11,
    marginTop: 3,
  },
  systemCard: {
    alignSelf: 'center',
    width: '86%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  systemTitle: {
    color: '#001A44',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 9,
  },
  systemBody: {
    color: '#46506A',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
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
  actionSheetItem: {
    alignItems: 'center',
    width: 62,
  },
  actionSheetIcon: {
    color: '#111111',
    fontSize: 31,
    fontWeight: '900',
    lineHeight: 33,
  },
  actionSheetText: {
    color: '#111111',
    fontSize: 12,
    marginTop: 4,
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
    paddingRight: 36,
    color: '#111111',
    fontSize: 15,
  },
  sendIconButton: {
    position: 'absolute',
    right: 54,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIconText: {
    color: '#FF7A8D',
    fontSize: 28,
    transform: [{ rotate: '-30deg' }],
  },
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
    backgroundColor: '#00000012',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    width: '100%',
    maxWidth: 350,
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
    marginBottom: 18,
  },
  infoIconText: {
    color: '#111111',
    fontSize: 17,
    fontWeight: '900',
  },
  modalTitle: {
    color: '#001A44',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 12,
  },
  modalTitleSmall: {
    color: '#001A44',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 8,
  },
  reportTitle: {
    color: '#001A44',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 12,
  },
  modalBody: {
    color: '#46506A',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
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
  modalPrimaryCentered: {
    alignSelf: 'center',
    minWidth: 132,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#FFAFBF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 26,
  },
  modalButtonText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '800',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#FF7E8D',
  },
  radioCircleOn: {
    borderWidth: 5,
  },
  radioText: {
    color: '#222222',
    fontSize: 14,
    fontWeight: '700',
  },
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
  reportHelp: {
    color: '#6D7890',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 12,
  },
  giftPreview: {
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  giftEmptyIcon: {
    color: '#D0D0D0',
    fontSize: 34,
  },
  giftSelectedWrap: {
    alignItems: 'center',
  },
  giftSelectedTitle: {
    color: '#111111',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 6,
  },
  giftSelectedPrice: {
    color: '#E06385',
    fontSize: 15,
    fontWeight: '900',
  },
});

export default DatingChatRoomScreen;
