export interface Chat {
  id: number;
  participants: number[];
  messages: ChatMessage[];
}

export interface ChatMessage {
  id?: number;
  senderId: number;
  senderLogin?: string;
  content: string;
  timestamp: string;
}

export interface ChatListItem {
  id: number;
  participants: number[];
  other: {
    id: number;
    login: string;
    schoolType: string;
    city: string;
    schoolClass: number;
    favoriteSubjects?: string;
    bio?: string;
  };
  lastMessage?: ChatMessage;
  unreadCount: number;
}