import mongoose, { Document, Schema, Model } from "mongoose";
import bcrypt from "bcrypt";
import { GlobalAdminRoles } from "../config/global-enum";
import AccessToken, { ChatGrant } from "twilio/lib/jwt/AccessToken";

export interface IUser extends Document {
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  role?: GlobalAdminRoles;
  isTrash?: boolean;
  verified?: boolean;
  phoneNumber?: string;
  image?: string;
  accounts?: [mongoose.Types.ObjectId];
  createdBy?:mongoose.Types.ObjectId;
  comparePassword(password: string): Promise<boolean>;
  generateChatToken(identity: string): Promise<string>;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      trim: true,
      required: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{10}$/, "Please provide a valid 10-digit phone number"],
    },
    password: {
      type: String,
      trim: true,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(GlobalAdminRoles),
      default: GlobalAdminRoles.ClientAdmin,
    },
    isTrash: {
      type: Boolean,
      default:false,
    },
    verified: {
      type: Boolean,
      default:false,
    },
    image:{
      type:String,
      default:""
    },
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId || null, 
      ref: "User" 
    },
    accounts: { 
      type: [mongoose.Schema.Types.ObjectId], 
      ref: "Account" 
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.generateChatToken = async (identity:string)=>{
  if (typeof identity !== 'string') {
    return 'Missing or invalid identity';
  }

  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_API_KEY!,
    process.env.TWILIO_API_SECRET!,
    { identity }
  );
 
  const chatGrant = new ChatGrant({
    serviceSid: process.env.TWILIO_CHAT_SERVICE_SID!,
  });
 
  token.addGrant(chatGrant);
  const twilioToken = token.toJwt();
  return twilioToken;
}

const UserModel: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export default UserModel;
