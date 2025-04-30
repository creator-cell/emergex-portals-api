import mongoose, { Document, Schema, Model } from "mongoose";

export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  VIDEO = "video",
  AUDIO = "audio",
  FILE = "file",
  LOCATION = "location",
  SYSTEM = "system",
}

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  twilioSid: string;
  author: mongoose.Types.ObjectId;
  conversationSid: string;
  messageSid: string;
  body: string;
  type: MessageType;
  mediaUrl?: string;
  readBy: mongoose.Types.ObjectId[];
  attributes?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    twilioSid: {
      type: String,
      required: true,
      unique: true,
    },
    conversationSid: { type: String, required: true },
    messageSid: { type: String, required: true, unique: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(MessageType),
      default: MessageType.TEXT,
    },
    mediaUrl: {
      type: String,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    attributes: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
// messageSchema.index({ twilioSid: 1 });

const MessageModel: Model<IMessage> = mongoose.model<IMessage>(
  "Message",
  messageSchema
);

export default MessageModel;
