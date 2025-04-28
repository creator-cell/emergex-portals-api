import mongoose, { Document, Schema } from 'mongoose';

export interface IChat extends Document {
  name?: string;
  isGroupChat: boolean;
  users: mongoose.Types.ObjectId[];
  latestMessage?: mongoose.Types.ObjectId;
  groupAdmin?: mongoose.Types.ObjectId;
}

const ChatSchema = new Schema<IChat>(
  {
    name: { type: String, trim: true },
    isGroupChat: { type: Boolean, default: false },
    users: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }],
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export default mongoose.model<IChat>('Chat', ChatSchema);