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
exports.EmployeeSchema = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const zod_1 = require("zod");
exports.EmployeeSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Name is required."],
        trim: true,
    },
    contactNo: {
        type: String,
        required: [true, "Contact number is required."],
        validate: {
            validator: (value) => /^\d{10}$/.test(value),
            message: "Contact number must be 10 digits.",
        },
    },
    designation: {
        type: String,
        required: [true, "Designation is required."],
        trim: true,
    },
    email: {
        type: String,
        required: [true, "Email is required."],
        unique: true,
        lowercase: true,
        validate: {
            validator: (value) => zod_1.z.string().email().safeParse(value).success,
            message: "Invalid email format.",
        },
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User"
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
}, {
    timestamps: true,
});
const EmployeeModel = mongoose_1.default.model("Employee", exports.EmployeeSchema);
exports.default = EmployeeModel;
