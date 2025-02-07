import mongoose, { Schema, Document, Model } from "mongoose";

interface ISession extends Document {
  isActive: boolean;
  ip: string;
  browser: string;
  os: string;
  device: string;
  expiryAt: Date;
  role?: string;
  userId: mongoose.Types.ObjectId; 
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema: Schema = new Schema<ISession>(
  {
    isActive: {
      type: Boolean,
      default: true,
    },
    ip: {
      type: String,
      default: "",
    },
    browser: {
      type: String,
      default: "",
    },
    os: {
      type: String,
      default: "",
    },
    device: {
      type: String,
      default: "",
    },
    expiryAt: {
      type: Date,
      required: true,
    },
    role: {
      type: String,
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
const SessionModel: Model<ISession> = mongoose.model<ISession>(
  "Session",
  SessionSchema
);

export default SessionModel;
