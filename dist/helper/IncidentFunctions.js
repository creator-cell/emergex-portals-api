"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUniqueIncidentId = generateUniqueIncidentId;
const IncidentModel_1 = __importDefault(require("../models/IncidentModel"));
async function generateUniqueIncidentId() {
    const prefix = 'INCID';
    const randomNumbers = Math.floor(100000 + Math.random() * 900000);
    const randomChars = Array.from({ length: 2 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
    const id = `${prefix}-${randomNumbers}${randomChars}`;
    const isExist = await IncidentModel_1.default.findOne({
        id,
    });
    if (isExist) {
        generateUniqueIncidentId();
    }
    return id;
}
