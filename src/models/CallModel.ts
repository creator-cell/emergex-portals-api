import mongoose, { Document, Schema, Model } from 'mongoose';

export enum CallType {
  AUDIO = 'audio',
  VIDEO = 'video',
  SCREEN_SHARE = 'screen_share'
}

export enum CallStatus {
  INITIATED = 'initiated',
  RINGING = 'ringing',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  MISSED = 'missed',
  REJECTED = 'rejected',
  FAILED = 'failed'
}

export interface ICall extends Document {
  twilioSid: string;
  roomName: string;
  type: CallType;
  status: CallStatus;
  initiator: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  startTime: Date;
  endTime?: Date;
  duration?: number;
  attributes?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const callSchema = new Schema<ICall>(
  {
    twilioSid: {
      type: String,
      required: true,
      unique: true
    },
    roomName: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: Object.values(CallType),
      required: true
    },
    status: {
      type: String,
      enum: Object.values(CallStatus),
      default: CallStatus.INITIATED
    },
    initiator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }],
    startTime: {
      type: Date,
      default: Date.now
    },
    endTime: {
      type: Date
    },
    duration: {
      type: Number
    },
    attributes: {
      type: Schema.Types.Mixed
    }
  },
  { timestamps: true }
);

// Add indexes for faster queries
callSchema.index({ participants: 1 });
callSchema.index({ initiator: 1 });
callSchema.index({ startTime: -1 });

const CallModel: Model<ICall> = mongoose.model<ICall>(
  'Call',
  callSchema
);

export default CallModel;