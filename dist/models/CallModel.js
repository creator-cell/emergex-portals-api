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
exports.CallStatus = exports.CallType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var CallType;
(function (CallType) {
    CallType["VOICE"] = "voice";
    CallType["VIDEO"] = "video";
})(CallType || (exports.CallType = CallType = {}));
var CallStatus;
(function (CallStatus) {
    CallStatus["INITIATED"] = "initiated";
    CallStatus["RINGING"] = "ringing";
    CallStatus["IN_PROGRESS"] = "in-progress";
    CallStatus["COMPLETED"] = "completed";
    CallStatus["FAILED"] = "failed";
    CallStatus["BUSY"] = "busy";
    CallStatus["NO_ANSWER"] = "no-answer";
    CallStatus["CANCELED"] = "canceled";
})(CallStatus || (exports.CallStatus = CallStatus = {}));
const callSchema = new mongoose_1.Schema({
    twilioSid: {
        type: String,
        required: true,
        // unique: true,
    },
    token: {
        type: String,
        // unique: true,
    },
    roomId: {
        type: String,
    },
    type: {
        type: String,
        enum: Object.values(CallType),
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(CallStatus),
        required: true,
        default: CallStatus.INITIATED,
    },
    from: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    to: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    conversationId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Conversation",
    },
    duration: {
        type: Number,
    },
    startTime: {
        type: Date,
    },
    endTime: {
        type: Date,
    },
    recordingUrl: {
        type: String,
    },
    recordingSid: {
        type: String,
    },
    roomName: {
        type: String,
    },
}, { timestamps: true });
callSchema.index({ from: 1 });
callSchema.index({ to: 1 });
callSchema.index({ conversationId: 1 });
const CallModel = mongoose_1.default.model("Call", callSchema);
exports.default = CallModel;
