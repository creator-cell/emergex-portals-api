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
exports.ProjectRoleSchema = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.ProjectRoleSchema = new mongoose_1.Schema({
    project: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Project",
    },
    role: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Role",
    },
    team: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Team",
    },
    employee: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Employee",
    },
    description: {
        type: String,
    },
    priority: {
        type: Number
    },
    from: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Employee",
    },
    to: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Employee",
    },
}, {
    timestamps: true,
});
const ProjectRoleModel = mongoose_1.default.model("Project_Roles", exports.ProjectRoleSchema);
exports.default = ProjectRoleModel;
