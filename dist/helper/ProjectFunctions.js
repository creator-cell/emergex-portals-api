"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUniqueId = generateUniqueId;
const ProjectModel_1 = __importDefault(require("../models/ProjectModel"));
async function generateUniqueId() {
    const prefix = 'FIRMD';
    const randomNumbers = Math.floor(100000 + Math.random() * 900000);
    const randomChars = Array.from({ length: 2 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
    const id = `${prefix}-${randomNumbers}${randomChars}`;
    const isExist = await ProjectModel_1.default.findOne({
        id,
    });
    if (isExist) {
        generateUniqueId();
    }
    return id;
}
