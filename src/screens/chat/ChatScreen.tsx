import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ChatRoomDTO } from '../../types/ChatAPI';
import { chatApiService } from '../../services/ChatApiService';
import { chatSocketService } from '../../services/ChatSocketService';
import { getProfileId } from '../../utils/AuthUtils';

const benchImg = require('../../assets/images/bench.png');

type ChatTab = 'meeting' | 'dating';

type MeetingChatRoom = ChatRoomDTO & { kind: 'team' | 'mixed' };
type DatingChatRoom = ChatRoomDTO & { kind: 'profile' | 'loveView' };

const isMeetingRoom = (room: ChatRoomDTO): room is MeetingChatRoom =>
  room.chatRoomType === 'TEAM' || room.chatRoomType === 'MEETING';

const isDatingRoom = (room: ChatRoomDTO): room is DatingChatRoom =>
  room.chatRoomType === 'PROFILE' ||
  room.chatRoomType === 'DATING' ||
  room.chatRoomType === 'LOVEVIEW' ||
  room.chatRoomType === 'CODE';

const getMeetingKind = (room: ChatRoomDTO): MeetingChatRoom['kind'] =>
  room.chatRoomType === 'TEAM' ? 'team' : 'mixed';

const getDatingKind = (room: ChatRoomDTO): DatingChatRoom['kind'] =>
  room.chatRoomType === 'PROFILE' || room.chatRoomType === 'DATING'
    ? 'profile'
    : 'loveView';

const formatChatTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const getRoomTitle = (room: ChatRoomDTO) => {
  const names = room.participants
    .map(participant => participant.nickname)
    .filter(Boolean);
  if (names.length) return names.join(', ');
  if (room.chatRoomType === 'TEAM') return '동성팀 채팅방';
  if (room.chatRoomType === 'MEETING') return '미팅 채팅방';
  return '소개팅 채팅방';
};

const ChatScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<ChatTab>('meeting');
  const [chatRooms, setChatRooms] = useState<ChatRoomDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const lastSyncTimestampRef = useRef<string | undefined>(undefined);

  const syncChatRooms = useCallback(async () => {
    setLoading(true);
    try {
      const nextUserId = await getProfileId();
      setCurrentUserId(nextUserId);
      chatSocketService.connect().catch(error => {
        if (__DEV__) console.warn('Failed to connect chat socket', error);
      });
      const result = await chatApiService.syncChatRooms({
        lastSyncTimestamp: lastSyncTimestampRef.current,
      });
      lastSyncTimestampRef.current = result.lastSyncTime || lastSyncTimestampRef.current;
      setChatRooms(result.chatRooms);
    } catch (error) {
      if (__DEV__) console.warn('Failed to sync chat rooms', error);
      setChatRooms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      syncChatRooms();
      return () => {
        chatSocketService.disconnect();
      };
    }, [syncChatRooms]),
  );

  const meetingRooms = useMemo(
    () => chatRooms.filter(isMeetingRoom).map(room => ({ ...room, kind: getMeetingKind(room) })),
    [chatRooms],
  );

  const datingRooms = useMemo(
    () => chatRooms.filter(isDatingRoom).map(room => ({ ...room, kind: getDatingKind(room) })),
    [chatRooms],
  );

  const rooms = activeTab === 'meeting' ? meetingRooms : datingRooms;
  const isEmpty = rooms.length === 0;

  const title = activeTab === 'meeting' ? '미팅 채팅방' : '소개팅 채팅방';
  const switchLabel = activeTab === 'meeting' ? '소개팅 채팅방' : '미팅 채팅방 전환';

  const placeholders = useMemo(
    () => Array.from({ length: activeTab === 'meeting' ? 4 : 3 }, (_, index) => index),
    [activeTab],
  );

  const handleSwitchTab = () => {
    setActiveTab(prev => (prev === 'meeting' ? 'dating' : 'meeting'));
  };

  const handleMatchPress = () => {
    navigation.navigate(activeTab === 'meeting' ? 'meeting' : 'dating');
  };

  const openMeetingRoom = (room: MeetingChatRoom) => {
    navigation.navigate(room.kind === 'team' ? 'MeetingTeamChat' : 'MeetingGeneralChat', {
      roomId: room.chatRoomId,
      roomType: room.chatRoomType,
    });
  };

  const openDatingRoom = (room: DatingChatRoom) => {
    const opponent =
      room.participants.find(participant => String(participant.userId) !== String(currentUserId)) ??
      room.participants[0];

    navigation.navigate(room.kind === 'profile' ? 'ProfileChat' : 'LoveviewChat', {
      roomId: room.chatRoomId,
      roomType: room.chatRoomType,
      targetProfileId: Number(opponent?.userId) || undefined,
      nickname: opponent?.nickname,
      profileImage: opponent?.profileImage,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={handleSwitchTab} activeOpacity={0.75}>
            <Text style={styles.switchText}>{switchLabel}</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#FFAFBF" />
          </View>
        ) : isEmpty ? (
          <View style={styles.emptyPanel}>
            <Image source={benchImg} style={styles.emptyImage} />
            <Text style={styles.emptyText}>채팅방이 없습니다</Text>
            <TouchableOpacity style={styles.matchButton} onPress={handleMatchPress}>
              <Text style={styles.matchButtonText}>매칭 받으러 가기</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.listScroll}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator
          >
            {activeTab === 'meeting'
              ? meetingRooms.map(room => (
                  <TouchableOpacity
                    key={room.chatRoomId}
                    style={styles.chatCard}
                    onPress={() => openMeetingRoom(room)}
                    activeOpacity={0.82}
                  >
                    <MeetingRoomIcon kind={room.kind} />
                    <View style={styles.chatTextCol}>
                      <Text style={styles.roomTitle} numberOfLines={1}>
                        {getRoomTitle(room)}
                      </Text>
                      <Text style={styles.lastMessage} numberOfLines={1}>
                        {room.lastMessagePreview || '가장 최근 메시지 내용'}
                      </Text>
                    </View>
                    <Text style={styles.timestamp}>{formatChatTime(room.lastMessageAt)}</Text>
                  </TouchableOpacity>
                ))
              : datingRooms.map(room => (
                  <TouchableOpacity
                    key={room.chatRoomId}
                    style={styles.chatCard}
                    onPress={() => openDatingRoom(room)}
                    activeOpacity={0.82}
                  >
                    <DatingRoomAvatar room={room} />
                    <View style={styles.chatTextCol}>
                      <Text style={styles.roomTitle} numberOfLines={1}>
                        {getRoomTitle(room)}
                      </Text>
                      <Text style={styles.lastMessage} numberOfLines={1}>
                        {room.lastMessagePreview || '가장 최근 메시지 내용'}
                      </Text>
                    </View>
                    <Text style={styles.timestamp}>{formatChatTime(room.lastMessageAt)}</Text>
                  </TouchableOpacity>
                ))}

            {placeholders.map(index => (
              <View key={`placeholder-${index}`} style={styles.placeholderCard} />
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const MeetingRoomIcon = ({ kind }: { kind: MeetingChatRoom['kind'] }) => {
  const isTeam = kind === 'team';

  return (
    <View style={styles.meetingIconWrap}>
      <View style={[styles.iconBubble, styles.iconBubbleTop]}>
        <Text style={styles.iconBubbleText}>{isTeam ? '♂' : '♀'}</Text>
      </View>
      <View style={[styles.iconBubble, isTeam ? styles.maleBubble : styles.femaleBubble]}>
        <Text style={styles.iconBubbleText}>{isTeam ? '♂' : '♀'}</Text>
      </View>
      <View style={[styles.iconBubble, styles.outlineBubble]}>
        <Text style={styles.outlineBubbleText}>♂</Text>
      </View>
    </View>
  );
};

const DatingRoomAvatar = ({ room }: { room: DatingChatRoom }) => {
  const imageUri = room.participants.find(participant => participant.profileImage)?.profileImage;
  if (room.kind === 'profile' && imageUri) {
    return <Image source={{ uri: imageUri }} style={styles.datingAvatarImage} />;
  }

  return (
    <View style={styles.unknownAvatar}>
      <Text style={styles.unknownAvatarText}>?</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: {
    color: '#111111',
    fontSize: 29,
    lineHeight: 36,
    fontWeight: '900',
  },
  switchText: {
    color: '#D8D8D8',
    fontSize: 18,
    fontWeight: '800',
  },
  emptyPanel: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: '#FDFDFD',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 74,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyImage: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    tintColor: '#DEC9B8',
    opacity: 0.92,
    marginBottom: 38,
  },
  emptyText: {
    color: '#111111',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    marginBottom: 78,
  },
  matchButton: {
    width: 158,
    height: 58,
    borderRadius: 9,
    backgroundColor: '#FFAFBF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchButtonText: {
    color: '#191919',
    fontSize: 17,
    fontWeight: '800',
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  chatCard: {
    minHeight: 82,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  chatTextCol: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  roomTitle: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '900',
  },
  lastMessage: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '700',
  },
  timestamp: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '700',
    alignSelf: 'flex-end',
    marginBottom: 9,
    marginLeft: 8,
  },
  placeholderCard: {
    height: 82,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  meetingIconWrap: {
    width: 66,
    height: 56,
  },
  iconBubble: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#A9D1FF',
  },
  iconBubbleTop: {
    top: 0,
    left: 13,
    backgroundColor: '#DDEEFF',
  },
  maleBubble: {
    bottom: 0,
    left: 0,
    backgroundColor: '#A9D1FF',
  },
  femaleBubble: {
    bottom: 0,
    left: 0,
    backgroundColor: '#FFC5D3',
  },
  outlineBubble: {
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#111111',
  },
  iconBubbleText: {
    color: '#111111',
    fontSize: 21,
    fontWeight: '900',
  },
  outlineBubbleText: {
    color: '#111111',
    fontSize: 21,
    fontWeight: '900',
  },
  datingAvatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F2F2F2',
  },
  unknownAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#FFB8C7',
    backgroundColor: '#FFEDEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unknownAvatarText: {
    color: '#111111',
    fontSize: 36,
    fontWeight: '900',
  },
});

export default ChatScreen;
