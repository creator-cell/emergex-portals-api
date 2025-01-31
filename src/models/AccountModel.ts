import mongoose, { Schema, Document, Models, Model } from "mongoose";
import { AccountProviderType } from "../config/global-enum";

export interface IAccount extends Document {
  isTrash: boolean;
  provider: AccountProviderType;
  providerId: string | mongoose.Types.ObjectId;
  username: string;
  email?: string;
}

const AccountSchema = new Schema<IAccount>(
  {
    isTrash: {
      type: Boolean,
      default: false,
    },
    provider: {
      type: String,
      enum: Object.values(AccountProviderType),
      required: true,
    },
    providerId: {
      type: Schema.Types.ObjectId || String ,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    email: { type: String },
  },
  { 
    timestamps: true 
});

const AccountModel:Model<IAccount> = mongoose.model<IAccount>("Account", AccountSchema);
export default AccountModel;
