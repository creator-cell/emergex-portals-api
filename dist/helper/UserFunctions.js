"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePassword = void 0;
exports.generateUniqueUsername = generateUniqueUsername;
exports.generatePassword = generatePassword;
const UserModel_1 = __importDefault(require("../models/UserModel"));
async function generateUniqueUsername(name) {
    const cleanedName = name.toLowerCase().replace(/\s+/g, "");
    const randomSuffix = Math.floor(Math.random() * 100000);
    const username = `${cleanedName}${randomSuffix}`;
    const isUserNameExist = await UserModel_1.default.findOne({ username });
    if (isUserNameExist) {
        return generateUniqueUsername(name);
    }
    return username;
}
function generatePassword() {
    const length = Math.floor(Math.random() * 3) + 8;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let password = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    return password;
}
const validatePassword = (password) => {
    if (password.length < 8) {
        return "Password must be at least 8 characters long";
    }
    if (!/\d/.test(password)) {
        return "Password must contain at least one number";
    }
    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter";
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return "Password must contain at least one special character";
    }
    return null;
};
exports.validatePassword = validatePassword;
