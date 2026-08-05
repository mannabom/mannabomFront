export type ChatRoomStatus = 'ACTIVE' | 'CLOSED' | 'BLOCKED';
export type ChatRoomType = 'PROFILE' | 'LOVEVIEW' | 'DATING' | 'CODE' | 'MEETING' | 'TEAM';
export type ChatMessageType = 'TEXT' | 'PHOTO';
export type ChatMessageStatus = 'SENT' | 'READ';
export type ProfileRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'pending' | 'accepted' | 'rejected';

export interface ChatParticipantDTO {
  userId: string;
  /**
   * 상대 프로필 상세 이동에 사용하는 영구 profileId.
   * 백엔드 participants 응답 배포 전까지는 없을 수 있다.
   */
  profileId?: string;
  nickname: string;
  profileImage: string;
}

export interface ChatRoomDTO {
  chatRoomId: string;
  /**
   * TEAM 채팅방이 연결된 미팅 모집방 ID.
   * 채팅방 ID와 미팅방 ID는 서로 다른 도메인 ID이므로 백엔드가 명시적으로 내려줘야 한다.
   */
  meetingRoomId?: string;
  participants: ChatParticipantDTO[];
  unreadMessageCount: number;
  lastMessagePreview: string;
  lastMessageAt: string;
  chatRoomStatus: ChatRoomStatus;
  chatRoomType: ChatRoomType;
}

export interface ChatRoomListRequestDTO {
  lastSyncTimestamp?: string;
}

export interface ChatRoomListResponseDTO {
  chatRooms: ChatRoomDTO[];
  lastSyncTime: string;
}

export interface ChatMessageDTO {
  messageId: string;
  senderId: string;
  messageType: ChatMessageType;
  messageContent: string;
  timestamp: string;
  messageStatus: ChatMessageStatus;
}

export interface ChatRoomMessagesSyncRequestDTO {
  chatRoomId: string;
  lastChatSyncTime?: string | null;
}

export interface ChatRoomMessagesResponseDTO {
  chatRoomId: string;
  chatRoomStatus: ChatRoomStatus;
  chatRoomType: ChatRoomType;
  profileRequestStatus?: ProfileRequestStatus;
  messages: ChatMessageDTO[];
  lastSyncTime: string;
}

export interface ChatMessageReadRequestDTO {
  chatRoomId: string;
  lastReadMessageId: string;
}

export interface ProfileOpenRequestDTO {
  chatRoomId: string;
}

export interface ProfileOpenRespondDTO {
  chatRoomId: string;
  accepted: boolean;
}

export interface LocationDTO {
  latitude: number;
  longitude: number;
}

export interface MeetingCertificationRequestDTO {
  chatRoomId: string;
  location: LocationDTO;
  timestamp: string;
}

export interface ChatSendPayloadDTO {
  roomId: string;
  messageType: ChatMessageType;
  content: string;
  clientMessageId: string;
}
