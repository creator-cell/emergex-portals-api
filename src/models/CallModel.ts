import mongoose, { Document, Schema, Model } from "mongoose";

export enum CallType {
  VOICE = "voice",
  VIDEO = "video",
}

export enum CallStatus {
  INITIATED = "initiated",
  RINGING = "ringing",
  IN_PROGRESS = "in-progress",
  COMPLETED = "completed",
  FAILED = "failed",
  BUSY = "busy",
  NO_ANSWER = "no-answer",
  CANCELED = "canceled",
}

export interface ICall extends Document {
  twilioSid: string;
  token: string;
  roomId: string;
  type: CallType;
  status: CallStatus;
  from: mongoose.Types.ObjectId;
  to: mongoose.Types.ObjectId;
  conversationId?: mongoose.Types.ObjectId;
  duration?: number;
  startTime?: Date;
  endTime?: Date;
  recordingUrl?: string;
  recordingSid?: string;
  roomName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const callSchema = new Schema<ICall>(
  {
    twilioSid: {
      type: String,
      required: true,
      // unique: true,
    },
    token: {
      type: String,
      // unique: true,
    },
    roomId: {
      type: String,
    },
    type: {
      type: String,
      enum: Object.values(CallType),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(CallStatus),
      required: true,
      default: CallStatus.INITIATED,
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
    },
    duration: {
      type: Number,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    recordingUrl: {
      type: String,
    },
    recordingSid: {
      type: String,
    },
    roomName: {
      type: String,
    },
  },
  { timestamps: true }
);

callSchema.index({ from: 1 });
callSchema.index({ to: 1 });
callSchema.index({ conversationId: 1 });

const CallModel: Model<ICall> = mongoose.model<ICall>("Call", callSchema);

export default CallModel;
