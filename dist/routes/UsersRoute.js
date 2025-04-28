"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const global_enum_1 = require("../config/global-enum");
const router = express_1.default.Router();
router.get('/super-admin', authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin), (req, res) => {
    res.status(200).json({ message: 'Welcome, Super Admin!' });
});
router.get('/client-admin', authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)('client-admin', 'super-admin'), (req, res) => {
    res.status(200).json({ message: 'Welcome, Client Admin!' });
});
router.get('/viewer', authMiddleware_1.authenticate, (req, res) => {
    res.status(200).json({ message: 'Welcome, Viewer!' });
});
exports.default = router;
