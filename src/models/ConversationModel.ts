import mongoose, { Document, Schema, Model } from 'mongoose';

export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group'
}

export interface IConversation extends Document {
  twilioSid: string;
  type: ConversationType;
  name?: string;
  participants: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    twilioSid: {
      type: String,
      required: true,
      unique: true
    },
    type: {
      type: String,
      enum: Object.values(ConversationType),
      required: true
    },
    name: {
      type: String,
      trim: true
    },
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Add index for faster queries
conversationSchema.index({ participants: 1 });
conversationSchema.index({ createdBy: 1 });

const ConversationModel: Model<IConversation> = mongoose.model<IConversation>(
  'Conversation',
  conversationSchema
);

export default ConversationModel;