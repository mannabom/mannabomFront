import { API_BASE_URL } from '../config/api';
import { ChatMessageDTO, ChatSendPayloadDTO } from '../types/ChatAPI';
import { getAuthTokens } from '../utils/AuthUtils';
import { requireExternalId } from '../utils/IdUtils';

type MessageHandler = (message: ChatMessageDTO | any) => void;

const buildChatSocketUrl = () => {
  const base = API_BASE_URL.replace(/^http:\/\//, 'ws://').replace(/^https:\/\//, 'wss://');
  return `${base}/ws-chat`;
};

const escapeStompHeader = (value: string) =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/:/g, '\\c');

const buildFrame = (
  command: string,
  headers: Record<string, string> = {},
  body = '',
) => {
  const headerLines = Object.entries(headers).map(
    ([key, value]) =>
      `${escapeStompHeader(key)}:${escapeStompHeader(value)}`,
  );
  return `${command}\n${headerLines.join('\n')}\n\n${body}\0`;
};

const parseFrames = (raw: string) =>
  raw
    .split('\0')
    .map(frame => frame.trim())
    .filter(Boolean)
    .map(frame => {
      const [headerPart, body = ''] = frame.split('\n\n');
      const [command, ...headerLines] = headerPart.split('\n');
      const headers = Object.fromEntries(
        headerLines
          .map(line => {
            const separatorIndex = line.indexOf(':');
            if (separatorIndex < 0) return null;
            return [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)];
          })
          .filter((entry): entry is [string, string] => Boolean(entry)),
      );
      return { command, headers, body };
    });

class ChatSocketService {
  private socket: WebSocket | null = null;
  private connected = false;
  private roomHandlers = new Map<string, MessageHandler>();
  private pendingConnect: Promise<void> | null = null;

  async connect(): Promise<void> {
    if (this.connected && this.socket?.readyState === 1) return;
    if (this.pendingConnect) return this.pendingConnect;

    this.pendingConnect = new Promise(async (resolve, reject) => {
      const { accessToken } = await getAuthTokens();
      const socket = new WebSocket(buildChatSocketUrl());
      this.socket = socket;

      socket.onopen = () => {
        socket.send(
          buildFrame('CONNECT', {
            'accept-version': '1.2',
            'heart-beat': '10000,10000',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          }),
        );
      };

      socket.onmessage = event => {
        const frames = parseFrames(String(event.data ?? ''));
        frames.forEach(frame => {
          if (frame.command === 'CONNECTED') {
            this.connected = true;
            this.pendingConnect = null;
            resolve();
            return;
          }

          if (frame.command === 'MESSAGE') {
            const destination = frame.headers.destination ?? '';
            const encodedRoomId = destination.split('/').filter(Boolean).pop();
            let roomId = encodedRoomId;
            if (encodedRoomId) {
              try {
                roomId = decodeURIComponent(encodedRoomId);
              } catch {
                roomId = undefined;
              }
            }
            const handler = roomId ? this.roomHandlers.get(roomId) : undefined;
            if (!handler) return;

            try {
              handler(JSON.parse(frame.body));
            } catch {
              handler(frame.body);
            }
          }
        });
      };

      socket.onerror = error => {
        this.connected = false;
        this.pendingConnect = null;
        reject(error);
      };

      socket.onclose = () => {
        this.connected = false;
        this.pendingConnect = null;
        this.roomHandlers.clear();
      };
    });

    return this.pendingConnect;
  }

  async subscribeRoom(roomId: string, handler: MessageHandler): Promise<() => void> {
    const normalizedRoomId = requireExternalId(roomId, '채팅방 ID');
    await this.connect();
    this.roomHandlers.set(normalizedRoomId, handler);
    const encodedRoomId = encodeURIComponent(normalizedRoomId);
    const subscriptionId = `room-${encodedRoomId}`;
    this.socket?.send(
      buildFrame('SUBSCRIBE', {
        id: subscriptionId,
        destination: `/topic/rooms/${encodedRoomId}`,
        ack: 'auto',
      }),
    );

    return () => {
      this.roomHandlers.delete(normalizedRoomId);
      if (this.socket?.readyState === 1) {
        this.socket.send(buildFrame('UNSUBSCRIBE', { id: subscriptionId }));
      }
    };
  }

  async sendMessage(payload: ChatSendPayloadDTO): Promise<void> {
    const normalizedPayload = {
      ...payload,
      roomId: requireExternalId(payload.roomId, '채팅방 ID'),
    };
    await this.connect();
    this.socket?.send(
      buildFrame(
        'SEND',
        {
          destination: '/app/chat.send',
          'content-type': 'application/json',
        },
        JSON.stringify(normalizedPayload),
      ),
    );
  }

  disconnect() {
    if (this.socket?.readyState === 1) {
      this.socket.send(buildFrame('DISCONNECT'));
    }
    this.socket?.close();
    this.socket = null;
    this.connected = false;
    this.pendingConnect = null;
    this.roomHandlers.clear();
  }
}

export const chatSocketService = new ChatSocketService();
