"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const global_enum_1 = require("../config/global-enum");
const AccessToken_1 = __importStar(require("twilio/lib/jwt/AccessToken"));
const userSchema = new mongoose_1.Schema({
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
        enum: Object.values(global_enum_1.GlobalAdminRoles),
        default: global_enum_1.GlobalAdminRoles.ClientAdmin,
    },
    isTrash: {
        type: Boolean,
        default: false,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    image: {
        type: String,
        default: ""
    },
    createdBy: {
        type: mongoose_1.default.Schema.Types.ObjectId || null,
        ref: "User"
    },
    accounts: {
        type: [mongoose_1.default.Schema.Types.ObjectId],
        ref: "Account"
    },
}, {
    timestamps: true,
});
userSchema.pre("save", async function (next) {
    if (!this.isModified("password"))
        return next();
    this.password = await bcrypt_1.default.hash(this.password, 10);
    next();
});
userSchema.methods.comparePassword = async function (password) {
    return bcrypt_1.default.compare(password, this.password);
};
userSchema.methods.generateChatToken = async (identity) => {
    if (typeof identity !== 'string') {
        return 'Missing or invalid identity';
    }
    const token = new AccessToken_1.default(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_API_KEY, process.env.TWILIO_API_SECRET, { identity });
    const chatGrant = new AccessToken_1.ChatGrant({
        serviceSid: process.env.TWILIO_CHAT_SERVICE_SID,
    });
    token.addGrant(chatGrant);
    const twilioToken = token.toJwt();
    return twilioToken;
};
const UserModel = mongoose_1.default.model("User", userSchema);
exports.default = UserModel;
