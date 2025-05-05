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
    CallType["AUDIO"] = "audio";
    CallType["VIDEO"] = "video";
    CallType["SCREEN_SHARE"] = "screen_share";
})(CallType || (exports.CallType = CallType = {}));
var CallStatus;
(function (CallStatus) {
    CallStatus["INITIATED"] = "initiated";
    CallStatus["RINGING"] = "ringing";
    CallStatus["ONGOING"] = "ongoing";
    CallStatus["COMPLETED"] = "completed";
    CallStatus["MISSED"] = "missed";
    CallStatus["REJECTED"] = "rejected";
    CallStatus["FAILED"] = "failed";
})(CallStatus || (exports.CallStatus = CallStatus = {}));
const callSchema = new mongoose_1.Schema({
    twilioSid: {
        type: String,
        required: true,
        unique: true
    },
    roomName: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: Object.values(CallType),
        required: true
    },
    status: {
        type: String,
        enum: Object.values(CallStatus),
        default: CallStatus.INITIATED
    },
    initiator: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    participants: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }],
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    duration: {
        type: Number
    },
    attributes: {
        type: mongoose_1.Schema.Types.Mixed
    }
}, { timestamps: true });
// Add indexes for faster queries
callSchema.index({ participants: 1 });
callSchema.index({ initiator: 1 });
callSchema.index({ startTime: -1 });
const CallModel = mongoose_1.default.model('Call', callSchema);
exports.default = CallModel;
