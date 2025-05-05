"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ChatControllers_1 = require("../controllers/ChatControllers");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const roleMiddleware_1 = require("../middlewares/roleMiddleware");
const global_enum_1 = require("../config/global-enum");
const router = express_1.default.Router();
router
    .route("/")
    .post(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin), ChatControllers_1.accessChat)
    .get(authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin), ChatControllers_1.fetchChats);
router.post("/group", authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin), ChatControllers_1.createSuperAdminChat);
router.get("/token", authMiddleware_1.authenticate, (0, roleMiddleware_1.authorizeRoles)(global_enum_1.GlobalAdminRoles.SuperAdmin, global_enum_1.GlobalAdminRoles.ClientAdmin), ChatControllers_1.generateChatToken);
exports.default = router;
