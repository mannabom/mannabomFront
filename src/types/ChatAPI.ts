export type ChatRoomStatus = 'ACTIVE' | 'CLOSED' | 'BLOCKED';
export type ChatRoomType = 'PROFILE' | 'LOVEVIEW' | 'DATING' | 'CODE' | 'MEETING' | 'TEAM';
export type ChatMessageType = 'TEXT' | 'PHOTO';
export type ChatMessageStatus = 'SENT' | 'READ';
export type ProfileRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'pending' | 'accepted' | 'rejected';

export interface ChatParticipantDTO {
  userId: string;
  nickname: string;
  profileImage: string;
}

export interface ChatRoomDTO {
  chatRoomId: string;
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
