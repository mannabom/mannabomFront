import { API_ENDPOINTS_LIST, getApiUrlWithParams } from '../config/api';
import {
  ChatMessageReadRequestDTO,
  ChatRoomListRequestDTO,
  ChatRoomListResponseDTO,
  ChatRoomMessagesResponseDTO,
  MeetingCertificationRequestDTO,
  ProfileOpenRequestDTO,
  ProfileOpenRespondDTO,
  ProfileRequestStatus,
} from '../types/ChatAPI';
import apiClient from './apiClient';

class ChatApiService {
  private unwrap<T>(raw: any): T {
    return (raw?.data ?? raw) as T;
  }

  async syncChatRooms(
    payload: ChatRoomListRequestDTO = {},
  ): Promise<ChatRoomListResponseDTO> {
    const response = await apiClient.get(API_ENDPOINTS_LIST.CHAT_SYNC_LIST, {
      params: payload.lastSyncTimestamp
        ? { lastSyncTimestamp: payload.lastSyncTimestamp }
        : undefined,
    });
    const data = this.unwrap<any>(response.data);

    return {
      chatRooms: Array.isArray(data?.chatRooms) ? data.chatRooms : [],
      lastSyncTime: String(data?.lastSyncTime ?? ''),
    };
  }

  async syncChatRoomMessages(
    roomId: string,
    lastChatSyncTime?: string | null,
  ): Promise<ChatRoomMessagesResponseDTO> {
    const response = await apiClient.get(
      getApiUrlWithParams(API_ENDPOINTS_LIST.CHAT_SYNC_MESSAGES, { roomId }),
      {
        params: lastChatSyncTime ? { lastChatSyncTime } : undefined,
      },
    );
    return this.unwrap<ChatRoomMessagesResponseDTO>(response.data);
  }

  async syncChatRoomHistory(
    roomId: string,
    oldestMessageId?: string,
  ): Promise<ChatRoomMessagesResponseDTO> {
    const response = await apiClient.get(
      getApiUrlWithParams(API_ENDPOINTS_LIST.CHAT_HISTORY_MESSAGES, { roomId }),
      {
        params: oldestMessageId ? { oldestMessageId } : undefined,
      },
    );
    return this.unwrap<ChatRoomMessagesResponseDTO>(response.data);
  }

  async markRoomRead(payload: ChatMessageReadRequestDTO): Promise<boolean> {
    const response = await apiClient.post(
      getApiUrlWithParams(API_ENDPOINTS_LIST.CHAT_MARK_READ, {
        roomId: payload.chatRoomId,
      }),
      payload,
    );
    return response.status >= 200 && response.status < 300;
  }

  async leaveRoom(roomId: string): Promise<boolean> {
    const response = await apiClient.delete(
      getApiUrlWithParams(API_ENDPOINTS_LIST.CHAT_ROOM_LEAVE, { roomId }),
      { headers: { chatRoomId: roomId } },
    );
    return response.status >= 200 && response.status < 300;
  }

  async requestLoveviewProfile(payload: ProfileOpenRequestDTO): Promise<boolean> {
    const response = await apiClient.post(
      API_ENDPOINTS_LIST.CHAT_LOVEVIEW_PROFILE_REQUEST,
      payload,
    );
    return response.status >= 200 && response.status < 300;
  }

  async respondLoveviewProfile(payload: ProfileOpenRespondDTO): Promise<boolean> {
    const response = await apiClient.post(
      API_ENDPOINTS_LIST.CHAT_LOVEVIEW_PROFILE_RESPONSE,
      payload,
    );
    return response.status >= 200 && response.status < 300;
  }

  async checkLoveviewProfileStatus(chatRoomId: string): Promise<ProfileRequestStatus> {
    const response = await apiClient.get(
      API_ENDPOINTS_LIST.CHAT_LOVEVIEW_PROFILE_STATUS,
      { params: { chatRoomId } },
    );
    const data = this.unwrap<any>(response.data);
    return String(data?.profileRequestStatus ?? data?.status ?? 'PENDING') as ProfileRequestStatus;
  }

  async verifyMeeting(payload: MeetingCertificationRequestDTO): Promise<boolean> {
    const response = await apiClient.post(
      API_ENDPOINTS_LIST.CHAT_MEETING_VERIFY,
      payload,
    );
    return response.status >= 200 && response.status < 300;
  }
}

export const chatApiService = new ChatApiService();
