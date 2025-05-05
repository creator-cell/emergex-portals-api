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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationIdentity = exports.ConversationType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var ConversationType;
(function (ConversationType) {
    ConversationType["SINGLE"] = "single";
    ConversationType["GROUP"] = "group";
})(ConversationType || (exports.ConversationType = ConversationType = {}));
var ConversationIdentity;
(function (ConversationIdentity) {
    ConversationIdentity["TEAM"] = "Team";
    ConversationIdentity["INCIDENT"] = "Incident";
    ConversationIdentity["PROJECT"] = "Project";
    ConversationIdentity["SUPERADMIN"] = "Super-Admin";
    ConversationIdentity["EMPLOYEE"] = "Employee";
})(ConversationIdentity || (exports.ConversationIdentity = ConversationIdentity = {}));
const ParticipantSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    participantSid: { type: String, required: true },
    identity: { type: String, required: true },
});
const conversationSchema = new mongoose_1.Schema({
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
    identity: {
        type: String,
        enum: Object.values(ConversationIdentity),
        required: true,
    },
    identityId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: function () {
            switch (this.identity) {
                case ConversationIdentity.TEAM:
                    return "Team";
                case ConversationIdentity.INCIDENT:
                    return "Incident";
                case ConversationIdentity.PROJECT:
                    return "Project";
                case ConversationIdentity.SUPERADMIN:
                    return "Super-Admin";
                case ConversationIdentity.EMPLOYEE:
                    return "Employee";
                default:
                    return null;
            }
        },
    },
    name: {
        type: String,
        trim: true,
        unique: true,
        required: true,
    },
    participants: [ParticipantSchema],
    createdBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastMessage: { type: mongoose_1.Schema.Types.ObjectId, ref: "Message" },
}, { timestamps: true });
// Add index for faster queries
conversationSchema.index({ participants: 1 });
conversationSchema.index({ createdBy: 1 });
// conversationSchema.index({ twilioSid: 1 });
const ConversationModel = mongoose_1.default.model("Conversation", conversationSchema);
exports.default = ConversationModel;
