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
const mongoose_1 = __importStar(require("mongoose"));
const IncidentSchema = new mongoose_1.Schema({
    id: {
        type: String,
        required: [true, "Incident Id is required"],
    },
    level: {
        type: String,
        enum: ["Level 1", "Level 2", "Level 3", "Level 4"],
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["Assigned", "Delayed", "In Progress", "Completed", "Cancelled"],
        required: true,
    },
    project: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Project",
        required: true,
    },
    // assignedTo: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Employee",
    //   required: true,
    // },
    countOfInjuredPeople: {
        type: Number,
        required: true,
    },
    countOfTotalPeople: {
        type: Number,
        required: true,
    },
    location: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Worksite",
        required: true,
    },
    damageAssets: {
        type: [String],
        required: true,
    },
    finance: {
        type: Number,
        required: true,
    },
    utilityAffected: {
        type: [String],
        required: true,
    },
    image: {
        type: [String],
    },
    signature: {
        type: String,
    },
    informToTeam: {
        type: Boolean,
        required: true,
    },
    termsAndConditions: {
        type: Boolean,
        required: true,
    },
    createdBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    isStopped: {
        type: Boolean,
        default: false,
    },
    stoppedTime: {
        type: Date,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });
const IncidentModel = mongoose_1.default.model("Incident", IncidentSchema);
exports.default = IncidentModel;
