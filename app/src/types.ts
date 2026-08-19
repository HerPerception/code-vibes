export interface ChatMessage {
  id: string;
  room: string;
  user: string;
  avatar?: string;
  msg: string;
  timestamp: string;
  type: 'message' | 'system' | 'typing' | 'image' | 'reaction';
  attachment?: {
    name: string;
    url: string;
    type: string;
    size?: string;
  };
  reactions?: Record<string, string[]>;
}

export interface OnlineUser {
  user: string;
  avatar: string;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  icon?: string;
  unreadCount?: number;
}

export type ThemeMode = 'light' | 'dark';
