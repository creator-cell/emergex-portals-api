import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  content: string;
  chat: mongoose.Types.ObjectId;
  readBy: mongoose.Types.ObjectId[];
}

const MessageSchema = new Schema<IMessage>(
  {
    sender: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    content: { type: String, trim: true },
    chat: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Chat' 
    },
    readBy: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }],
  },
  { timestamps: true }
);

export default mongoose.model<IMessage>('Message', MessageSchema);