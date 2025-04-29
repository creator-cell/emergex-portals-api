export interface CreateConversationDto {
  participants: string[]; // User IDs
  type: "direct" | "group";
  name?: string; // Required for group chats
}

export interface SendMessageDto {
  conversationId: string;
  body: string;
  type?: string;
  mediaUrl?: string;
  attributes?: Record<string, any>;
}

export interface ConversationResponse {
  id: string;
  twilioSid: string;
  type: string;
  name?: string;
  participants: Array<{
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    image?: string;
  }>;
  createdBy: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: {
    id: string;
    body: string;
    sender: string;
    createdAt: Date;
  };
}

export interface MessageResponse {
  id: string;
  twilioSid: string;
  conversationId: string;
  body: string;
  type: string;
  mediaUrl?: string;
  sender: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    image?: string;
  };
  readBy: string[];
  createdAt: Date;
}

// src/types/call.types.ts
export interface InitiateCallDto {
  participants: string[]; // User IDs
  type: "audio" | "video" | "screen_share";
}

export interface TwilioTokenResponse {
  token: string;
  identity: string;
  roomName?: string;
}

export interface CallResponse {
  id: string;
  twilioSid: string;
  roomName: string;
  type: string;
  status: string;
  initiator: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    image?: string;
  };
  participants: Array<{
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    image?: string;
  }>;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  createdAt: Date;
}
