import mongoose, { Document, Schema, Model } from "mongoose";

export enum ConversationType {
  SINGLE = "single",
  GROUP = "group",
}

export enum ConversationSection {
  SUPERADMIN = "superadmin",
  INCIDENT = "incident",
}

export interface IParticipant extends Document {
  user: mongoose.Types.ObjectId;
  participantSid: string;
  identity: string;
}

const ParticipantSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  participantSid: { type: String, required: true },
  identity: { type: String, required: true },
});

export interface IConversation extends Document {
  twilioSid: string;
  type: ConversationType;
  section: ConversationSection;
  name?: string;
  participants: IParticipant[];
  createdBy: mongoose.Types.ObjectId;
  attributes: Record<string, any>;
  lastMessage?: mongoose.Types.ObjectId;
  incident?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    twilioSid: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: Object.values(ConversationType),
      required: true,
    },
    section: {
      type: String,
      enum: Object.values(ConversationSection),
      required: true,
    },
    name: {
      type: String,
      trim: true,
    },
    participants: [ParticipantSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    incident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },
  },
  { timestamps: true }
);

// Add index for faster queries
conversationSchema.index({ participants: 1 });
conversationSchema.index({ createdBy: 1 });
// conversationSchema.index({ twilioSid: 1 });

const ConversationModel: Model<IConversation> = mongoose.model<IConversation>(
  "Conversation",
  conversationSchema
);

export default ConversationModel;
